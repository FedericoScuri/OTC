// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Stablecoin de PRUEBA que imita a USDC para la demo local.
 *
 * En producción no se usa este contrato: el cliente paga con tarjeta y un
 * proveedor on-ramp (MoonPay / Transak) convierte el dinero a USDC real
 * (RF-D01). Acá lo simulamos para poder testear el flujo de pagos sin dinero
 * real. Igual que el USDC real, usa 6 decimales (no 18).
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {
        // Acuñamos 1,000,000 USDC al desplegador para repartir en los tests.
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @dev USDC real usa 6 decimales, no los 18 por defecto de ERC20.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Acuña USDC de prueba a cualquier cuenta (solo para la demo).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
