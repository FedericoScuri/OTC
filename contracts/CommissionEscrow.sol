// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TourPackageNFT.sol";

/**
 * @title CommissionEscrow
 * @notice Motor de comisiones descentralizado (RF-C01).
 *
 * Flujo de una compra:
 *   1. El cliente paga el precio en USDC -> queda retenido en escrow.
 *   2. Se acuña la reserva (NFT ERC-1155) al cliente.
 *   3. El proveedor confirma el servicio -> el contrato divide el pago
 *      automáticamente: 85% proveedor, 12% agente vendedor, 3% plataforma OTC.
 *   4. Si se cancela antes del deadline de la política -> reembolso al cliente.
 *
 * Si la compra no vino por un link de afiliado (sin agente), el 12% del agente
 * se suma al proveedor (proveedor 97% / plataforma 3%).
 */
contract CommissionEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Reparto en puntos básicos (basis points): 10000 = 100% ---
    uint256 public constant PROVIDER_BPS = 8500; // 85%
    uint256 public constant AGENT_BPS = 1200; // 12%
    uint256 public constant PLATFORM_BPS = 300; // 3%
    uint256 public constant TOTAL_BPS = 10000;

    /// @notice Estados del ciclo de vida de una reserva en escrow.
    enum Status {
        None,
        Pending, // pagado y retenido, servicio sin confirmar
        Released, // servicio confirmado, fondos repartidos
        Refunded // cancelado, fondos devueltos al cliente
    }

    struct Booking {
        uint256 packageId;
        address customer;
        address provider;
        address agent; // address(0) si fue venta directa
        uint256 amount; // total pagado en USDC
        uint256 quantity; // unidades reservadas
        uint64 refundDeadline; // copiado del paquete al momento de comprar
        Status status;
    }

    IERC20 public immutable usdc;
    TourPackageNFT public immutable tourPackage;

    /// @notice Cuenta que recibe el fee del 3% de la plataforma OTC.
    address public platformWallet;

    /// @notice Cuenta recaudadora de la retención impositiva (RNF-L01).
    /// Si hay retención > 0 para un proveedor, su porción se le descuenta y se
    /// gira acá (ej: agente de retención local / cuenta fiscal de la plataforma).
    address public taxWallet;

    /// @notice Retención impositiva por proveedor, en basis points (RNF-L01).
    /// El valor sale de la jurisdicción del proveedor (se fija en el onboarding).
    /// Se descuenta de la parte del proveedor al liberar los fondos. Default 0
    /// (sin retención): el reparto queda en el 85/12/3 clásico.
    mapping(address => uint256) public providerRetentionBps;

    /// @dev Contador incremental de IDs de reserva.
    uint256 private _nextBookingId = 1;

    /// @notice bookingId => datos de la reserva.
    mapping(uint256 => Booking) public bookings;

    event Purchased(
        uint256 indexed bookingId,
        uint256 indexed packageId,
        address indexed customer,
        address agent,
        uint256 amount,
        uint256 quantity
    );
    event ServiceConfirmed(
        uint256 indexed bookingId,
        uint256 providerAmount,
        uint256 agentAmount,
        uint256 platformAmount
    );
    event Refunded(uint256 indexed bookingId, address indexed customer, uint256 amount);
    event PlatformWalletUpdated(address indexed wallet);
    event TaxWalletUpdated(address indexed wallet);
    event ProviderRetentionUpdated(address indexed provider, uint256 bps);
    event TaxWithheld(uint256 indexed bookingId, address indexed taxWallet, uint256 amount, uint256 bps);

    constructor(address usdc_, address tourPackage_, address platformWallet_) Ownable(msg.sender) {
        require(usdc_ != address(0), "Escrow: usdc invalido");
        require(tourPackage_ != address(0), "Escrow: tourPackage invalido");
        require(platformWallet_ != address(0), "Escrow: wallet invalida");
        usdc = IERC20(usdc_);
        tourPackage = TourPackageNFT(tourPackage_);
        platformWallet = platformWallet_;
    }

    /// @notice Actualiza la wallet que cobra el fee de la plataforma.
    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Escrow: wallet invalida");
        platformWallet = wallet;
        emit PlatformWalletUpdated(wallet);
    }

    /// @notice Define la cuenta recaudadora de la retención impositiva (RNF-L01).
    function setTaxWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Escrow: wallet invalida");
        taxWallet = wallet;
        emit TaxWalletUpdated(wallet);
    }

    /**
     * @notice Fija la retención impositiva de un proveedor según su jurisdicción.
     * @param provider Proveedor al que se le aplica la retención.
     * @param bps      Retención en basis points (se descuenta de su parte).
     * @dev Tope: no puede superar la porción base del proveedor (PROVIDER_BPS).
     *      Requiere `taxWallet` configurada si bps > 0.
     */
    function setProviderRetention(address provider, uint256 bps) external onlyOwner {
        require(provider != address(0), "Escrow: proveedor invalido");
        require(bps <= PROVIDER_BPS, "Escrow: retencion excede la parte del proveedor");
        require(bps == 0 || taxWallet != address(0), "Escrow: falta taxWallet");
        providerRetentionBps[provider] = bps;
        emit ProviderRetentionUpdated(provider, bps);
    }

    /**
     * @notice El cliente compra una reserva. Retiene el pago y acuña el NFT.
     * @param packageId Paquete a reservar.
     * @param quantity  Unidades a reservar.
     * @param agent     Agente afiliado que originó la venta (RF-D02); address(0) si es directa.
     *
     * Requiere que el cliente haya aprobado (approve) el gasto de USDC a este contrato.
     */
    function purchase(uint256 packageId, uint256 quantity, address agent)
        external
        nonReentrant
        returns (uint256 bookingId)
    {
        require(quantity > 0, "Escrow: cantidad debe ser > 0");

        TourPackageNFT.Package memory p = tourPackage.getPackage(packageId);
        require(p.provider != address(0), "Escrow: paquete inexistente");
        require(p.active, "Escrow: paquete inactivo");
        require(agent != msg.sender, "Escrow: el agente no puede ser el cliente");
        require(agent != p.provider, "Escrow: el agente no puede ser el proveedor");

        uint256 amount = p.price * quantity;

        // 1. Retenemos el pago en el escrow.
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // 2. Registramos la reserva.
        bookingId = _nextBookingId++;
        bookings[bookingId] = Booking({
            packageId: packageId,
            customer: msg.sender,
            provider: p.provider,
            agent: agent,
            amount: amount,
            quantity: quantity,
            refundDeadline: p.refundDeadline,
            status: Status.Pending
        });

        // 3. Acuñamos la reserva tokenizada al cliente.
        tourPackage.mintReservation(msg.sender, packageId, quantity);

        emit Purchased(bookingId, packageId, msg.sender, agent, amount, quantity);
    }

    /**
     * @notice El proveedor confirma que prestó el servicio y libera los fondos.
     * @dev Divide automáticamente 85/12/3. El proveedor también puede recibir
     *      el 12% del agente si la venta fue directa. Si el proveedor tiene una
     *      retención impositiva configurada (RNF-L01), esa porción se descuenta
     *      de su parte y se gira a la `taxWallet`.
     */
    function confirmService(uint256 bookingId) external nonReentrant {
        Booking storage b = bookings[bookingId];
        require(b.status == Status.Pending, "Escrow: reserva no pendiente");
        require(msg.sender == b.provider, "Escrow: solo el proveedor confirma");

        b.status = Status.Released;

        uint256 agentAmount = (b.amount * AGENT_BPS) / TOTAL_BPS;
        uint256 platformAmount = (b.amount * PLATFORM_BPS) / TOTAL_BPS;
        // El proveedor recibe el resto para no perder wei por redondeo.
        uint256 providerAmount = b.amount - platformAmount;

        // Si hubo agente afiliado, le pagamos su comisión; si no, queda con el proveedor.
        if (b.agent != address(0)) {
            providerAmount -= agentAmount;
            usdc.safeTransfer(b.agent, agentAmount);
        } else {
            agentAmount = 0;
        }

        // Retención impositiva (RNF-L01): se descuenta de la parte del proveedor
        // según su jurisdicción y se gira a la cuenta recaudadora. Default 0.
        uint256 retentionAmount = (b.amount * providerRetentionBps[b.provider]) / TOTAL_BPS;
        if (retentionAmount > 0) {
            require(retentionAmount <= providerAmount, "Escrow: retencion mayor a la parte del proveedor");
            providerAmount -= retentionAmount;
            usdc.safeTransfer(taxWallet, retentionAmount);
            emit TaxWithheld(bookingId, taxWallet, retentionAmount, providerRetentionBps[b.provider]);
        }

        usdc.safeTransfer(b.provider, providerAmount);
        usdc.safeTransfer(platformWallet, platformAmount);

        emit ServiceConfirmed(bookingId, providerAmount, agentAmount, platformAmount);
    }

    /**
     * @notice Cancela una reserva y reembolsa al cliente (política de cancelación).
     * @dev Solo antes del `refundDeadline`. Puede pedirla el cliente o el proveedor.
     */
    function cancelAndRefund(uint256 bookingId) external nonReentrant {
        Booking storage b = bookings[bookingId];
        require(b.status == Status.Pending, "Escrow: reserva no pendiente");
        require(
            msg.sender == b.customer || msg.sender == b.provider,
            "Escrow: no autorizado a cancelar"
        );
        require(block.timestamp <= b.refundDeadline, "Escrow: fuera del plazo de reembolso");

        b.status = Status.Refunded;
        usdc.safeTransfer(b.customer, b.amount);

        emit Refunded(bookingId, b.customer, b.amount);
    }

    /// @notice Devuelve los datos completos de una reserva.
    function getBooking(uint256 bookingId) external view returns (Booking memory) {
        return bookings[bookingId];
    }

    /// @notice Cantidad de reservas registradas hasta ahora.
    function totalBookings() external view returns (uint256) {
        return _nextBookingId - 1;
    }
}
