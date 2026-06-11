// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TourPackageNFT.sol";

/**
 * @title SecondaryMarket
 * @notice Reventa P2P de reservas con royalty forzoso al proveedor (RF-C02).
 *
 * Si un cliente no puede viajar, revende su reserva (NFT ERC-1155) a otro
 * viajero. El contrato aplica automáticamente:
 *   - un royalty al PROVEEDOR original (limita la especulación y le devuelve margen),
 *   - un fee a la PLATAFORMA OTC,
 *   - y el resto va al vendedor.
 *
 * Modelo de listado por aprobación: el vendedor aprueba al mercado
 * (setApprovalForAll) y, al concretarse la venta, el token se transfiere
 * directo del vendedor al comprador.
 */
contract SecondaryMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Reparto de la reventa en puntos básicos (10000 = 100%) ---
    uint256 public constant ROYALTY_BPS = 500; // 5% para el proveedor original
    uint256 public constant PLATFORM_BPS = 200; // 2% para la plataforma OTC
    uint256 public constant TOTAL_BPS = 10000;

    struct Listing {
        address seller;
        uint256 packageId;
        uint256 quantity;
        uint256 pricePerUnit; // en USDC (6 decimales)
        bool active;
    }

    IERC20 public immutable usdc;
    TourPackageNFT public immutable tourPackage;

    /// @notice Cuenta que recibe el fee de la plataforma en reventas.
    address public platformWallet;

    uint256 private _nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed packageId,
        uint256 quantity,
        uint256 pricePerUnit
    );
    event ListingCancelled(uint256 indexed listingId);
    event Resold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 quantity,
        uint256 sellerAmount,
        uint256 royaltyAmount,
        uint256 platformAmount
    );
    event PlatformWalletUpdated(address indexed wallet);

    constructor(address usdc_, address tourPackage_, address platformWallet_) Ownable(msg.sender) {
        require(usdc_ != address(0), "Market: usdc invalido");
        require(tourPackage_ != address(0), "Market: tourPackage invalido");
        require(platformWallet_ != address(0), "Market: wallet invalida");
        usdc = IERC20(usdc_);
        tourPackage = TourPackageNFT(tourPackage_);
        platformWallet = platformWallet_;
    }

    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Market: wallet invalida");
        platformWallet = wallet;
        emit PlatformWalletUpdated(wallet);
    }

    /**
     * @notice Publica una reserva (o varias unidades) para reventa.
     * @dev Requiere que el vendedor haya hecho setApprovalForAll(market, true)
     *      en el contrato TourPackageNFT.
     */
    function list(uint256 packageId, uint256 quantity, uint256 pricePerUnit)
        external
        returns (uint256 listingId)
    {
        require(quantity > 0, "Market: cantidad debe ser > 0");
        require(pricePerUnit > 0, "Market: precio debe ser > 0");
        require(
            tourPackage.balanceOf(msg.sender, packageId) >= quantity,
            "Market: saldo insuficiente del token"
        );
        require(
            tourPackage.isApprovedForAll(msg.sender, address(this)),
            "Market: falta aprobar el mercado"
        );

        listingId = _nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            packageId: packageId,
            quantity: quantity,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit Listed(listingId, msg.sender, packageId, quantity, pricePerUnit);
    }

    /// @notice El vendedor cancela su publicación.
    function cancelListing(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "Market: publicacion inactiva");
        require(l.seller == msg.sender, "Market: no sos el vendedor");
        l.active = false;
        emit ListingCancelled(listingId);
    }

    /**
     * @notice Compra una reventa. Aplica royalty al proveedor y fee a la plataforma.
     * @param listingId Publicación a comprar.
     * @param quantity  Unidades a comprar (<= disponibles en la publicación).
     *
     * Requiere que el comprador haya aprobado el gasto de USDC a este contrato.
     */
    function buy(uint256 listingId, uint256 quantity) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Market: publicacion inactiva");
        require(quantity > 0 && quantity <= l.quantity, "Market: cantidad invalida");
        require(msg.sender != l.seller, "Market: no podes comprarte a vos mismo");

        uint256 total = l.pricePerUnit * quantity;
        address provider = tourPackage.providerOf(l.packageId);

        uint256 royaltyAmount = (total * ROYALTY_BPS) / TOTAL_BPS;
        uint256 platformAmount = (total * PLATFORM_BPS) / TOTAL_BPS;
        uint256 sellerAmount = total - royaltyAmount - platformAmount;

        // Actualizamos la publicación antes de mover fondos/tokens (checks-effects-interactions).
        l.quantity -= quantity;
        if (l.quantity == 0) {
            l.active = false;
        }

        // El comprador paga; repartimos royalty, fee y resto al vendedor.
        usdc.safeTransferFrom(msg.sender, provider, royaltyAmount);
        usdc.safeTransferFrom(msg.sender, platformWallet, platformAmount);
        usdc.safeTransferFrom(msg.sender, l.seller, sellerAmount);

        // Transferimos la reserva tokenizada del vendedor al comprador.
        tourPackage.safeTransferFrom(l.seller, msg.sender, l.packageId, quantity, "");

        emit Resold(listingId, msg.sender, quantity, sellerAmount, royaltyAmount, platformAmount);
    }

    /// @notice Devuelve los datos de una publicación.
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /// @notice Cantidad de publicaciones creadas hasta ahora.
    function totalListings() external view returns (uint256) {
        return _nextListingId - 1;
    }
}
