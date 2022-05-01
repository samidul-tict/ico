import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {SpaceCoinICO} from "../typechain/";

describe("SpaceCoin ICO", function () {
  let spaceCoinICO: SpaceCoinICO;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let whitelist: string[];

  this.beforeEach(async function() {
    [owner, treasury, alice, bob, ...addrs] = await ethers.getSigners();
    
    whitelist = [addrs[0].address, addrs[1].address, addrs[2].address, 
                addrs[3].address, addrs[4].address, addrs[5].address,
                addrs[6].address, addrs[7].address, addrs[8].address,
                addrs[9].address, addrs[10].address];

    const spaceCoinICOFactory = await ethers.getContractFactory("SpaceCoinICO");
    spaceCoinICO = (await spaceCoinICOFactory.connect(owner).deploy(treasury.address, ethers.utils.parseEther("0.1"), whitelist)) as SpaceCoinICO;
    await spaceCoinICO.deployed();
    console.log("contract address: ", spaceCoinICO.address);

    const totalBalance = await spaceCoinICO.connect(owner).balanceOf(treasury.address);
    console.log("total treasury balance: ", totalBalance);
  });

  describe("toggle tax flag", function () {
    it("toggle tax flag, by owner", async function() {
      const unresolvedReceipt = await spaceCoinICO.connect(owner).toggleTaxFlag();
      const resolvedReceipt = await unresolvedReceipt.wait();
      const event = resolvedReceipt.events?.find(event => event.event === "ToggleTaxFlag");
      const argsList = event?.args?.slice().pop();
      console.log("current tax flag: ", argsList);

      const unresolvedReceipt1 = await spaceCoinICO.connect(owner).toggleTaxFlag();
      const resolvedReceipt1 = await unresolvedReceipt1.wait();
      const event1 = resolvedReceipt1.events?.find(event => event.event === "ToggleTaxFlag");
      const argsList1 = event1?.args?.slice().pop();
      console.log("tax flag after change: ", argsList1);
    });
    it("toggle tax flag, by someone other than owner", async function() {
      await expect(spaceCoinICO.connect(alice).toggleTaxFlag()).to.be.revertedWith("not a valid owner");
    });
  });

  describe("toggle ico status", function () {
    it("toggle ico status, by owner", async function() {
      const unresolvedReceipt = await spaceCoinICO.connect(owner).toggleICOStatus();
      const resolvedReceipt = await unresolvedReceipt.wait();
      const event = resolvedReceipt.events?.find(event => event.event === "ToggleICOStatus");
      const argsList = event?.args?.slice().pop();
      //const argsList = event?.args?.values().next().value;
      console.log("current ico status: ", argsList);

      const unresolvedReceipt1 = await spaceCoinICO.connect(owner).toggleICOStatus();
      const resolvedReceipt1 = await unresolvedReceipt1.wait();
      const event1 = resolvedReceipt1.events?.find(event => event.event === "ToggleICOStatus");
      const argsList1 = event1?.args?.slice().pop();
      console.log("ico status after change: ", argsList1);
    });
    it("toggle ico status, by someone other than owner", async function() {
      await expect(spaceCoinICO.connect(alice).toggleICOStatus()).to.be.revertedWith("not a valid owner");
    });
  });

  describe("change ico phase", function () {
    it("change ico phase, by owner", async function() {
      const unresolvedReceipt = await spaceCoinICO.connect(owner).changeICOStage();
      const resolvedReceipt = await unresolvedReceipt.wait();
      const event = resolvedReceipt.events?.find(event => event.event === "ChangeICOStage");
      const argsList = event?.args?.slice().pop();
      console.log("ico phase after first change [expected GENERAL i.e. 1]: ", argsList);

      const unresolvedReceipt1 = await spaceCoinICO.connect(owner).changeICOStage();
      const resolvedReceipt1 = await unresolvedReceipt1.wait();
      const event1 = resolvedReceipt1.events?.find(event => event.event === "ChangeICOStage");
      const argsList1 = event1?.args?.slice().pop();
      console.log("ico phase after second change [expected OPEN i.e. 2]: ", argsList1);

      const unresolvedReceipt2 = await spaceCoinICO.connect(owner).changeICOStage();
      const resolvedReceipt2 = await unresolvedReceipt2.wait();
      const event2 = resolvedReceipt2.events?.find(event => event.event === "ChangeICOStage");
      const argsList2 = event2?.args?.slice().pop();
      console.log("ico phase after third change [expected OPEN i.e. 2]: ", argsList2);
    });
    it("change ico phase, by someone other than owner", async function() {
      await expect(spaceCoinICO.connect(alice).changeICOStage()).to.be.revertedWith("not a valid owner");
    });
  });

  describe("transfer token", function () {
    describe("transfer during SEED phase", function () {
      it("transfer by owner", async function() {
        await expect(spaceCoinICO.connect(owner).transfer(alice.address, 50)).to.be.revertedWith("token cannot be transferred");
      });
      it("transfer by someone other than owner", async function() {
        await expect(spaceCoinICO.connect(alice).transfer(bob.address, 50)).to.be.revertedWith("token cannot be transferred");
      });
    });
    
    describe("transfer during GENERAL phase", function () {
      it("transfer by owner", async function() {
        // move to GENERAL phase
        await spaceCoinICO.connect(owner).changeICOStage();
        await expect(spaceCoinICO.connect(owner).transfer(alice.address, 50)).to.be.revertedWith("token cannot be transferred");
      });
      it("transfer by someone other than owner", async function() {
        // move to GENERAL phase
        await spaceCoinICO.connect(owner).changeICOStage();
        await expect(spaceCoinICO.connect(alice).transfer(bob.address, 50)).to.be.revertedWith("token cannot be transferred");
      });
    });
    describe("transfer during OPEN phase, no TAX", function () {
      it("transfer by someone who has balance", async function() {
        // move to GENERAL phase
        await spaceCoinICO.connect(owner).changeICOStage();
        // move to OPEN phase

        const totalBalance = await spaceCoinICO.connect(owner).balanceOf(alice.address);
        console.log("alice's total balance before transfer: ", totalBalance);

        await spaceCoinICO.connect(treasury).transfer(alice.address, 50);
        const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(alice.address);
        console.log("alice's total balance after transfer: ", totalBalance1);

        const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(treasury.address);
        console.log("total treasury balance after transfer: ", totalBalance2);
      });
      it("transfer by someone who doesn't have balance", async function() {
        // move to GENERAL phase
        await spaceCoinICO.connect(owner).changeICOStage();
        // move to OPEN phase
        await expect(spaceCoinICO.connect(bob).transfer(alice.address, 50)).to.be.revertedWith("not enough balance");
      });
    });
    describe("transfer during OPEN phase, with TAX deduction", function () {
      it("transfer by someone who has balance", async function() {
        // move to GENERAL phase
        await spaceCoinICO.connect(owner).changeICOStage();
        // move to OPEN phase
        await spaceCoinICO.connect(owner).changeICOStage();
        // enabled TAX

        const totalBalance = await spaceCoinICO.connect(owner).balanceOf(alice.address);
        console.log("alice's total balance before transfer: ", totalBalance);

        await spaceCoinICO.connect(treasury).transfer(alice.address, 100);
        const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(alice.address);
        console.log("alice's total balance after transfer: ", totalBalance1);

        const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(treasury.address);
        console.log("total treasury balance after transfer: ", totalBalance2);
      });
      it("transfer by someone who doesn't have balance", async function() {
        // move to GENERAL phase
        await spaceCoinICO.connect(owner).changeICOStage();
        // move to OPEN phase
        await spaceCoinICO.connect(owner).changeICOStage();
        // enabled TAX

        await spaceCoinICO.connect(owner).toggleTaxFlag();
        await expect(spaceCoinICO.connect(bob).transfer(alice.address, 100)).to.be.revertedWith("not enough balance");
      });
    });
  });

  describe("invest in spc", function () {
    describe("invest when on hold", function () {
      it("invest by whitelisted person", async function() {
        // put ICO on hold
        await spaceCoinICO.connect(owner).toggleICOStatus();
        await expect(spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1")})).to.be.revertedWith("not ready for sell");
      });
      it("invest by not whitelisted person", async function() {
        // put ICO on hold
        await spaceCoinICO.connect(owner).toggleICOStatus();
        await expect(spaceCoinICO.connect(alice).investInSPC({value:ethers.utils.parseEther("1")})).to.be.revertedWith("not ready for sell");
      });
    });
    describe("invest when not on hold", function () {
      describe("invest by a whitelisted person", function () {
        it("via investInSPC() function", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance);

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1")});
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance1);

          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(treasury.address);
          console.log("total treasury balance after addrs[0]'s invest: ", totalBalance2);
        });
        it("via receive() function", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance);

          const tx = {
            to: spaceCoinICO.address,
            value: ethers.utils.parseEther("10.0")
          }
          await addrs[0].sendTransaction(tx);
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after invest: ", totalBalance1);

          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(treasury.address);
          console.log("total treasury balance after addrs[0]'s invest: ", totalBalance2);
        });
        it("a person who reached INDIV_LIMIT_SEED", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance);

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1000")});
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after first invest: ", totalBalance1);

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("500")});
          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after second invest: ", totalBalance2);

          await expect(spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("500")})).to.be.revertedWith("not eligible");
          const totalBalance3 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after third invest: ", totalBalance3);
        });
        it("a person who reached INDIV_LIMIT_GENERAL", async function() {
          // move to GENERAL phase
          await spaceCoinICO.connect(owner).changeICOStage();

          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance);

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1000")});
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after first invest: ", totalBalance1);

          await expect(spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("500")}))
          .to.be.revertedWith("not eligible");
          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after second invest: ", totalBalance2);
        });
        it("a who reached INDIV_LIMIT_SEED and then trying again in GENERAL stage", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance);

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1500")});
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after first invest: ", totalBalance1);
          
          // move to GENERAL phase
          await spaceCoinICO.connect(owner).changeICOStage();
          
          await expect(spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("500")}))
          .to.be.revertedWith("not eligible");
          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after second invest: ", totalBalance2);
        });
        it("a person who reached INDIV_LIMIT_SEED and then trying again in OPEN stage", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance before invest: ", totalBalance);

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1500")});
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after first invest: ", totalBalance1);
          
          // move to GENERAL phase
          await spaceCoinICO.connect(owner).changeICOStage();
          
          await expect(spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("500")}))
          .to.be.revertedWith("not eligible");
          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after second invest: ", totalBalance2);

          // move to OPEN phase
          await spaceCoinICO.connect(owner).changeICOStage();

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("10")});
          const totalBalance3 = await spaceCoinICO.connect(owner).balanceOf(addrs[0].address);
          console.log("addrs[0]'s total balance after third invest: ", totalBalance3);
        });
        it("change ICO phase automatically to GENERAL via invesment", async function() {
          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[1]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[2]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[3]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[4]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[5]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[6]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[7]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[8]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[9]).investInSPC({value:ethers.utils.parseEther("1500")});
          await spaceCoinICO.connect(addrs[10]).investInSPC({value:ethers.utils.parseEther("1000")});
        });
        it("change ICO phase automatically to OPEN via invesment", async function() {
          // move to GENERAL phase
          await spaceCoinICO.connect(owner).changeICOStage();

          await spaceCoinICO.connect(addrs[0]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[1]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[2]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[3]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[4]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[5]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[6]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[7]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[8]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[9]).investInSPC({value:ethers.utils.parseEther("1000")});
          await spaceCoinICO.connect(addrs[10]).investInSPC({value:ethers.utils.parseEther("1000")});
          // need to add another 20 to reach the GOAL
        });
      });
      describe("invest by not a whitelisted person", function () {
        it("during SEED/ GENERAL phase", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(alice.address);
          console.log("alice's total balance before invest: ", totalBalance);

          await expect(spaceCoinICO.connect(alice).investInSPC({value:ethers.utils.parseEther("1")})).to.be.revertedWith("not a whitelisted contributor");
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(alice.address);
          console.log("alice's total balance after invest during SEED phase: ", totalBalance1);

          // move to GENERAL phase
          await spaceCoinICO.connect(owner).changeICOStage();

          await expect(spaceCoinICO.connect(alice).investInSPC({value:ethers.utils.parseEther("1")})).to.be.revertedWith("not a whitelisted contributor");
          const totalBalance2 = await spaceCoinICO.connect(owner).balanceOf(alice.address);
          console.log("alice's total balance after invest during GENERAL phase: ", totalBalance2);
        });
        it("during OPEN phase", async function() {
          const totalBalance = await spaceCoinICO.connect(owner).balanceOf(alice.address);
          console.log("alice's total balance before invest: ", totalBalance);

          // move to GENERAL phase
          await spaceCoinICO.connect(owner).changeICOStage();
          // move to OPEN phase
          await spaceCoinICO.connect(owner).changeICOStage();

          await spaceCoinICO.connect(alice).investInSPC({value:ethers.utils.parseEther("1000")});
          const totalBalance1 = await spaceCoinICO.connect(owner).balanceOf(alice.address);
          console.log("alice's total balance after invest during OPEN phase: ", totalBalance1);
        });
      });
    });
  });
});