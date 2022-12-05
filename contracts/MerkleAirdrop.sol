// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MerkleAirdrop {
    using SafeERC20 for IERC20;
    address public immutable TOKEN;
    bytes32 public immutable MERKLE_ROOT;

    mapping(address => bool) public claimed;
    event Claim(address indexed claimer);

    constructor(address token, bytes32 merkleRoot) {
        TOKEN = token;
        MERKLE_ROOT = merkleRoot;
    }
    
    function claim(bytes32[] calldata proof) external {
        require(canClaim(msg.sender, proof), "MerkleAirdrop: address is not a candidate for claim");
        claimed[msg.sender] = true;

        IERC20(TOKEN).safeTransfer(msg.sender, 1e18);
    }

    function canClaim(address claimer, bytes32[] calldata proof) public view returns (bool) {
        return !claimed[claimer] && MerkleProof.verify(proof, MERKLE_ROOT, keccak256(abi.encodePacked(claimer)));
    }

}