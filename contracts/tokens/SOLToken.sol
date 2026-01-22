// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SOLToken
 * @notice Solana Token - Wrapped Solana on NBC Chain
 * @dev ERC20 token with 18 decimals
 * @notice Contract Address: 0xd5eECCC885Ef850d90AE40E716c3dFCe5C3D4c81
 */
contract SOLToken is ERC20, Ownable {
    uint8 private constant _decimals = 18;

    /**
     * @param initialSupply 初始供应量（wei 单位，18 位精度）
     * @param owner 合约所有者地址
     */
    constructor(
        uint256 initialSupply,
        address owner
    ) ERC20("Solana", "SOL") Ownable(owner) {
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }

    /**
     * @dev 返回代币精度
     */
    function decimals() public pure virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 铸造代币（仅所有者）
     * @param to 接收地址
     * @param amount 数量（wei 单位，18 位精度）
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币（仅所有者）
     * @param from 销毁地址
     * @param amount 数量（wei 单位，18 位精度）
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
