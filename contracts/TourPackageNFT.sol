// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TourPackageNFT
 * @notice Tokeniza paquetes turísticos como activos ERC-1155 (RF-B02).
 *
 * Cada `packageId` representa un tipo de paquete/reserva publicado por un
 * proveedor (hotel, bodega, turismo aventura). El estándar ERC-1155 permite
 * que un mismo paquete tenga varias unidades disponibles (ej: 10 habitaciones
 * para la misma fecha = supply 10 del token), lo cual modela el inventario.
 *
 * Cada paquete guarda on-chain: fechas, política de cancelación, precio,
 * proveedor y supply. El minteo (acuñación de la reserva al cliente) lo hace
 * exclusivamente el contrato de escrow cuando se confirma un pago.
 */
contract TourPackageNFT is ERC1155, Ownable {
    /// @notice Categorías de oferta turística (enfoque de mercado regional).
    enum Category {
        Hotel,
        Bodega,
        Aventura,
        Cultural
    }

    /// @notice Datos inmutables de un paquete turístico tokenizado.
    struct Package {
        address provider; // proveedor dueño del inventario
        Category category; // tipo de servicio
        string name; // nombre legible del paquete
        uint256 price; // precio por unidad, en USDC (6 decimales)
        uint64 checkInDate; // inicio del servicio (timestamp)
        uint64 checkOutDate; // fin del servicio (timestamp)
        uint64 refundDeadline; // hasta esta fecha hay reembolso total (política de cancelación)
        uint256 maxSupply; // cupo total publicado
        uint256 minted; // unidades ya vendidas/acuñadas
        bool active; // el proveedor puede pausar la venta
    }

    /// @notice Dirección del contrato de escrow autorizado a mintear reservas.
    address public escrow;

    /// @dev Contador incremental de IDs de paquete.
    uint256 private _nextPackageId = 1;

    /// @notice packageId => datos del paquete.
    mapping(uint256 => Package) public packages;

    event EscrowUpdated(address indexed escrow);
    event PackageCreated(
        uint256 indexed packageId,
        address indexed provider,
        Category category,
        uint256 price,
        uint256 maxSupply
    );
    event PackageMinted(uint256 indexed packageId, address indexed to, uint256 amount);
    event PackageActiveChanged(uint256 indexed packageId, bool active);

    /// @param uri_ URI base de metadata (puede ser un endpoint o IPFS).
    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    /// @dev Solo el contrato de escrow puede mintear reservas.
    modifier onlyEscrow() {
        require(msg.sender == escrow, "TourPackageNFT: solo el escrow puede mintear");
        _;
    }

    /// @dev Solo el proveedor dueño del paquete.
    modifier onlyProvider(uint256 packageId) {
        require(packages[packageId].provider == msg.sender, "TourPackageNFT: no sos el proveedor");
        _;
    }

    /// @notice Define qué contrato de escrow está autorizado a mintear.
    function setEscrow(address escrow_) external onlyOwner {
        require(escrow_ != address(0), "TourPackageNFT: escrow invalido");
        escrow = escrow_;
        emit EscrowUpdated(escrow_);
    }

    /**
     * @notice Un proveedor publica un nuevo paquete turístico (RF-B02).
     * @return packageId El ID asignado al nuevo paquete.
     */
    function createPackage(
        Category category,
        string calldata name,
        uint256 price,
        uint64 checkInDate,
        uint64 checkOutDate,
        uint64 refundDeadline,
        uint256 maxSupply
    ) external returns (uint256 packageId) {
        // price puede ser 0: habilita actividades GRATUITAS (ej. experiencias
        // de cortesía o degustaciones introductorias). El escrow maneja el
        // monto 0 sin problema (no transfiere nada al confirmarse).
        require(maxSupply > 0, "TourPackageNFT: supply debe ser > 0");
        require(checkOutDate > checkInDate, "TourPackageNFT: fechas invalidas");
        require(refundDeadline <= checkInDate, "TourPackageNFT: deadline tras el check-in");

        packageId = _nextPackageId++;
        packages[packageId] = Package({
            provider: msg.sender,
            category: category,
            name: name,
            price: price,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            refundDeadline: refundDeadline,
            maxSupply: maxSupply,
            minted: 0,
            active: true
        });

        emit PackageCreated(packageId, msg.sender, category, price, maxSupply);
    }

    /**
     * @notice Acuña `amount` unidades de una reserva al cliente.
     * @dev Lo llama el escrow tras recibir el pago. Controla el cupo disponible.
     */
    function mintReservation(address to, uint256 packageId, uint256 amount) external onlyEscrow {
        Package storage p = packages[packageId];
        require(p.provider != address(0), "TourPackageNFT: paquete inexistente");
        require(p.active, "TourPackageNFT: paquete inactivo");
        require(p.minted + amount <= p.maxSupply, "TourPackageNFT: sin cupo disponible");

        p.minted += amount;
        _mint(to, packageId, amount, "");
        emit PackageMinted(packageId, to, amount);
    }

    /// @notice El proveedor activa/pausa la venta de su paquete.
    function setPackageActive(uint256 packageId, bool active) external onlyProvider(packageId) {
        packages[packageId].active = active;
        emit PackageActiveChanged(packageId, active);
    }

    /// @notice Devuelve los datos completos de un paquete (lo usa el escrow y el frontend).
    function getPackage(uint256 packageId) external view returns (Package memory) {
        return packages[packageId];
    }

    /// @notice Precio por unidad de un paquete (atajo usado por el escrow).
    function priceOf(uint256 packageId) external view returns (uint256) {
        return packages[packageId].price;
    }

    /// @notice Proveedor dueño de un paquete (atajo usado por el escrow / mercado secundario).
    function providerOf(uint256 packageId) external view returns (address) {
        return packages[packageId].provider;
    }

    /// @notice Cantidad de paquetes creados hasta ahora.
    function totalPackages() external view returns (uint256) {
        return _nextPackageId - 1;
    }
}
