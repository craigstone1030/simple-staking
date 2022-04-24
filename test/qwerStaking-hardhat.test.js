const { expect } = require("chai");
const { MockProvider } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const { time } = require('openzeppelin-test-helpers');

require("@nomiclabs/hardhat-ethers");
const assert = require('assert').strict;

require('dotenv').config({ path: '.env' });
const managerRole = process.env.MANAGER_ROLE;

function sleep(milliseconds) {
   const date = Date.now();
   let currentDate = null;
   do {
      currentDate = Date.now();
   } while (currentDate - date < milliseconds)
}


contract("qwerStaking", (accounts) => {
   let token;

   before(async () => {

      [owner, ...accounts] = await ethers.getSigners();
      Erc20 = await hre.ethers.getContractFactory("uvwToken");
      token = await Erc20.deploy("uvwToken", "UVWT");

      await token.deployed("uvwToken", "UVWT");
      console.log("uvwToken deployed to:", token.address);

      qwerStaking = await hre.ethers.getContractFactory("qwerStaking");
      qwerStaked = await qwerStaking.deploy(token.address);

      await qwerStaked.deployed();
      console.log("staking deployed to:", qwerStaked.address);
      const approveAmount = await token.totalSupply()
      token.approve(qwerStaked.address, approveAmount)
      await token.approve(qwerStaked.address, approveAmount)

      await token.connect(accounts[0]).approve(qwerStaked.address, 1000000000000);
      await token.connect(accounts[1]).approve(qwerStaked.address, 2000000000000);
      await token.connect(accounts[2]).approve(qwerStaked.address, 3000000000000);
      await token.connect(accounts[3]).approve(qwerStaked.address, 4000000000000);
      await token.connect(accounts[4]).approve(qwerStaked.address, 5000000000000);
   });

   it('Check Manager Role', async () => {

      expect(await qwerStaked.hasRole(managerRole, owner.address)).to.equal(true);
      console.log("Owner " + owner.address + " is Manager");
   });

   it('Check Account Balances Before Staking', async () => {

      await token.setRole("MINTER_ROLE", owner.address);
      await token.mint(owner.address, 21000000000000);

      await token.transfer(accounts[0].address, 1000000000000);
      await token.transfer(accounts[1].address, 2000000000000);
      await token.transfer(accounts[2].address, 3000000000000);
      await token.transfer(accounts[3].address, 4000000000000);
      await token.transfer(accounts[4].address, 5000000000000);
      await token.transfer(accounts[5].address, 6000000000000);

      const balanceOfAccount0 = await token.balanceOf(accounts[0].address);
      const balanceOfAccount1 = await token.balanceOf(accounts[1].address);
      const balanceOfAccount2 = await token.balanceOf(accounts[2].address);
      const balanceOfAccount3 = await token.balanceOf(accounts[3].address);
      const balanceOfAccount4 = await token.balanceOf(accounts[4].address);
      const balanceOfAccount5 = await token.balanceOf(accounts[5].address);

      console.log("accounts 1 : " + balanceOfAccount0);
      console.log("accounts 2 : " + balanceOfAccount1);
      console.log("accounts 3 : " + balanceOfAccount2);
      console.log("accounts 4 : " + balanceOfAccount3);
      console.log("accounts 5 : " + balanceOfAccount4);
      console.log("accounts 6 : " + balanceOfAccount5);

      const ownerBalance = await token.balanceOf(owner.address);
      console.log("Owner balance after transfer : " + ownerBalance.toNumber());
   });


   it('Account0 try to deposit before manager accept deposit', async () => {
      let balanceOfAccount0 = await token.balanceOf(accounts[0].address);

      await expect(qwerStaked.connect(accounts[0]).addDeposit(balanceOfAccount0)).to.be.reverted;

      expect(await qwerStaked.getIsActive()).to.equal(false);
      
      balanceOfAccount0 = await token.balanceOf(accounts[0].address);
      expect(balanceOfAccount0).to.equal(1000000000000);
      console.log("balance of account0 : ", balanceOfAccount0.toNumber());
   });


   it('Manager starts acceptDeposit', async () => {

      await qwerStaked.startStaking(30, 24);

      expect(await qwerStaked.getIsActive()).to.equal(true);
      expect(await qwerStaked.getPeriodStaking()).to.equal(30);
      expect(await qwerStaked.getTimeAccepting()).to.equal(24);
   });


   it('Accounts deposit after started deposit', async () => {
      let balanceOfAccount0 = await token.balanceOf(accounts[0].address);
      let balanceOfAccount1 = await token.balanceOf(accounts[1].address);
      let balanceOfAccount2 = await token.balanceOf(accounts[2].address);
      let balanceOfAccount3 = await token.balanceOf(accounts[3].address);
      let balanceOfAccount4 = await token.balanceOf(accounts[4].address);
      console.log("Before deposit");
      console.log("Balance of account0 : ", balanceOfAccount0.toNumber());
      console.log("Balance of account1 : ", balanceOfAccount1.toNumber());
      console.log("Balance of account2 : ", balanceOfAccount2.toNumber());
      console.log("Balance of account3 : ", balanceOfAccount3.toNumber());
      console.log("Balance of account4 : ", balanceOfAccount4.toNumber());

      let balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(0);
      console.log("Balance of contract : ", balanceOfContract.toNumber());

      console.log("About to sleep for 2 hours. Account0 deposits")
      sleep(500)
      await time.increase(2 * 60 * 60);
      await expect(qwerStaked.connect(accounts[0]).addDeposit(balanceOfAccount0)).to.be.not.reverted;

      console.log("About to sleep for 4 hours. Account1 deposits")
      sleep(500)
      await time.increase(4 * 60 * 60);
      await expect(qwerStaked.connect(accounts[1]).addDeposit(balanceOfAccount1)).to.be.not.reverted;

      console.log("About to sleep for 6 hours. Account2 deposits")
      sleep(500)
      await time.increase(6 * 60 * 60);
      await expect(qwerStaked.connect(accounts[2]).addDeposit(balanceOfAccount2)).to.be.not.reverted;

      console.log("About to sleep for 8 hours. Account3 deposits")
      sleep(500)
      await time.increase(8 * 60 * 60);
      await expect(qwerStaked.connect(accounts[3]).addDeposit(balanceOfAccount3)).to.be.not.reverted;

      console.log("About to sleep for 3 hours. Account4 deposits")
      sleep(500)
      await time.increase(3 * 60 * 60);
      await expect(qwerStaked.connect(accounts[4]).addDeposit(balanceOfAccount4)).to.be.not.reverted;

      balanceOfAccount0 = await token.balanceOf(accounts[0].address);
      balanceOfAccount1 = await token.balanceOf(accounts[1].address);
      balanceOfAccount2 = await token.balanceOf(accounts[2].address);
      balanceOfAccount3 = await token.balanceOf(accounts[3].address);
      balanceOfAccount4 = await token.balanceOf(accounts[4].address);
      expect(balanceOfAccount0).to.equal(0);
      expect(balanceOfAccount1).to.equal(0);
      expect(balanceOfAccount2).to.equal(0);
      expect(balanceOfAccount3).to.equal(0);
      expect(balanceOfAccount4).to.equal(0);
      console.log("After deposit");
      console.log("Balance of account0 : ", balanceOfAccount0.toNumber());
      console.log("Balance of account1 : ", balanceOfAccount1.toNumber());
      console.log("Balance of account2 : ", balanceOfAccount2.toNumber());
      console.log("Balance of account3 : ", balanceOfAccount3.toNumber());
      console.log("Balance of account4 : ", balanceOfAccount4.toNumber());

      balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(15000000000000);
      console.log("Balance of contract : ", balanceOfContract.toNumber());
   });

   it('Account5 deposit after end of acceptingDeposit', async () => {
      let balanceOfAccount5 = await token.balanceOf(accounts[5].address);
      console.log("Before deposit");
      console.log("Balance of account5 : ", balanceOfAccount5.toNumber());

      let balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(15000000000000);
      console.log("Balance of contract : ", balanceOfContract.toNumber());  

      console.log("About to sleep for 3 hours. Account5 deposits")
      sleep(500)
      await time.increase(3 * 60 * 60);
      await expect(qwerStaked.connect(accounts[5]).addDeposit(balanceOfAccount5)).to.be.reverted;

      balanceOfAccount5 = await token.balanceOf(accounts[5].address);
      expect(balanceOfAccount5).to.equal(6000000000000);
      console.log("After deposit");
      console.log("Balance of account5 : ", balanceOfAccount5.toNumber());

      balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(15000000000000);
      console.log("Balance of contract : ", balanceOfContract.toNumber());
      console.log("Account5 failed to deposit, cuz ended acceptinig deposit.");
   });


   it('Manager tries to start acceptDeposit again', async () => {
      console.log("About to sleep for 10 days.")
      sleep(500)
      await time.increase(10 * 24 * 60 * 60);

      await expect(qwerStaked.startStaking(60, 24)).to.be.reverted;

      expect(await qwerStaked.getIsActive()).to.equal(true);
      expect(await qwerStaked.getPeriodStaking()).to.equal(30);
      expect(await qwerStaked.getTimeAccepting()).to.equal(24);

      console.log("Manager failed to start acceptDeposit.")
   });


   it('Manager tries distribute rewards before end of staking period', async () => {
      console.log("About to sleep for 10 days.")
      sleep(500)
      await time.increase(10 * 24 * 60 * 60);

      const reward = 10000000000000;
      await token.mint(owner.address, reward);
      await token.transfer(qwerStaked.address, reward);

      console.log("Before deposit");
      let balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(25000000000000);
      console.log("Balance of contract : ", balanceOfContract.toNumber());

      await expect(qwerStaked.distributeReward(reward)).to.be.reverted;

      console.log("After deposit");
      balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(25000000000000);
      console.log("Balance of contract : ", balanceOfContract.toNumber());
      console.log("Manager failed to distribute rewards.");

   });


   it('Manager distribute rewards', async () => {
      console.log("About to sleep for 9 days and 22 hours.")
      sleep(500)
      await time.increase(9 * 24 * 60 * 60 + 22 * 60 * 60);

      const reward = 10000000000000;
      await token.mint(owner.address, reward);
      await token.transfer(qwerStaked.address, reward);

      let balanceOfAccount0 = await token.balanceOf(accounts[0].address);
      let balanceOfAccount1 = await token.balanceOf(accounts[1].address);
      let balanceOfAccount2 = await token.balanceOf(accounts[2].address);
      let balanceOfAccount3 = await token.balanceOf(accounts[3].address);
      let balanceOfAccount4 = await token.balanceOf(accounts[4].address);
      console.log("Before deposit");
      console.log("Balance of account0 : ", balanceOfAccount0.toNumber());
      console.log("Balance of account1 : ", balanceOfAccount1.toNumber());
      console.log("Balance of account2 : ", balanceOfAccount2.toNumber());
      console.log("Balance of account3 : ", balanceOfAccount3.toNumber());
      console.log("Balance of account4 : ", balanceOfAccount4.toNumber());

      let balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(35000000000000);
      console.log("Balance of contract : ", balanceOfContract.toNumber());

      await expect(qwerStaked.distributeReward(reward)).to.be.not.reverted;

      balanceOfAccount0 = await token.balanceOf(accounts[0].address);
      balanceOfAccount1 = await token.balanceOf(accounts[1].address);
      balanceOfAccount2 = await token.balanceOf(accounts[2].address);
      balanceOfAccount3 = await token.balanceOf(accounts[3].address);
      balanceOfAccount4 = await token.balanceOf(accounts[4].address);
      expect(balanceOfAccount0).to.equal(1666666666666);
      expect(balanceOfAccount1).to.equal(3333333333333);
      expect(balanceOfAccount2).to.equal(5000000000000);
      expect(balanceOfAccount3).to.equal(6666666666666);
      expect(balanceOfAccount4).to.equal(8333333333333);
      console.log("After deposit");
      console.log("Balance of account0 : ", balanceOfAccount0.toNumber());
      console.log("Balance of account1 : ", balanceOfAccount1.toNumber());
      console.log("Balance of account2 : ", balanceOfAccount2.toNumber());
      console.log("Balance of account3 : ", balanceOfAccount3.toNumber());
      console.log("Balance of account4 : ", balanceOfAccount4.toNumber());

      balanceOfContract = await token.balanceOf(qwerStaked.address);
      expect(balanceOfContract).to.equal(10000000000002);
      console.log("Balance of contract : ", balanceOfContract.toNumber());

   });


})
