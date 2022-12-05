import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
const {expect} = require("chai");
import {Wallet} from "ethers";
import {randomBytes} from "crypto";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";


describe("MerkleAirdrop Test", function () {

  async function deployFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    
    const randomAddresses = new Array(9).fill(0).map(() => new Wallet(randomBytes(32).toString('hex')).address);
    const merkleTree = new MerkleTree(randomAddresses.concat(otherAccount.address), keccak256, {hashLeaves:true, sortPairs:true})
    
    const merkleRoot = merkleTree.getHexRoot();

    const MerkleAirdropToken = await ethers.getContractFactory("MerkleAirdropToken");
    const merkleAirdropToken = await MerkleAirdropToken.deploy();

    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.deploy(merkleAirdropToken.address, merkleRoot);

    return { merkleAirdropToken, merkleAirdrop, owner, otherAccount, merkleTree };
  }

  it("Calculate MerkleTree proof to claim the ERC20 tokens", async function () {
    const {merkleAirdropToken, merkleAirdrop, owner, otherAccount, merkleTree } = await loadFixture(deployFixture);
    await merkleAirdropToken.transfer(merkleAirdrop.address, ethers.utils.parseEther("10"));

    const proof = merkleTree.getHexProof(keccak256(otherAccount.address));
    
    expect(await merkleAirdrop.claimed(otherAccount.address)).to.be.false;

    expect(await merkleAirdrop.canClaim(otherAccount.address, proof)).to.be.true;

    await expect(merkleAirdrop.connect(owner).claim(proof)).to.be.revertedWith("MerkleAirdrop: address is not a candidate for claim");

    await merkleAirdrop.connect(otherAccount).claim(proof);
    
    expect(await merkleAirdropToken.balanceOf(otherAccount.address)).to.be.eq(ethers.utils.parseEther("1"));
  });
});
