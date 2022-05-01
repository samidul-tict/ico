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
    spaceCoinICO = (await spaceCoinICOFactory.connect(owner).deploy(treasury.address, ethers.utils.parseEther("0.001"), whitelist)) as SpaceCoinICO;
    await spaceCoinICO.deployed();
    console.log("contract address: ", spaceCoinICO.address);
  });
  
  it("allows contributions during seed phase of whitelisted addressed", async function() {
    await expect(spaceCoinICO.connect(bob).contribute({value:ethers.utils.parseEther("500")}))
      .to.be.revertedWith("not in seed whitelist");
    await spaceCoinICO.connect(addrs[0]).contribute({value:ethers.utils.parseEther("500")});
    expect (await spaceCoinICO.contributions(whitelist[0]))
      .to.equal(ethers.utils.parseEther("500"))

    await expect(spaceCoinICO.connect(addrs[0]).contribute({value:ethers.utils.parseEther("1000")}))
      .to.be.revertedWith("reached individual limit");
  });

  it("allows contributions during the general phase from anyone", async function() {
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(bob).contribute({value:ethers.utils.parseEther("500")});
    await expect(spaceCoinICO.connect(bob).contribute({value:ethers.utils.parseEther("500")}))
      .to.be.revertedWith("reached individual limit");
  });

  it("allows the owner to advance the phases", async function() {
    await spaceCoinICO.connect(owner).advancePhase();
    expect (await spaceCoinICO.currentPhase())
      .to.equal(1)
    await spaceCoinICO.connect(owner).advancePhase();
    expect (await spaceCoinICO.currentPhase())
      .to.equal(2)
  })

  it("allows open phase contributions and immediately transfers coins -- NO TAX", async function() {
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(bob).contribute({value:ethers.utils.parseEther("500")});
    expect (await spaceCoinICO.balanceOf(bob.address)).to.equal(500*5);
  });

  it("mints seed contributions when phase open begins -- NO TAX", async function() {
    await spaceCoinICO.connect(addrs[0]).contribute({value:ethers.utils.parseEther("500")});
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(owner).advancePhase();
    expect (await spaceCoinICO.balanceOf(whitelist[0])).to.equal(500*5);
  });

  it("mints general phase contributions when phase open begins -- NO TAX", async function() {
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(bob).contribute({value:ethers.utils.parseEther("500")});
    await spaceCoinICO.connect(owner).advancePhase();
    expect (await spaceCoinICO.balanceOf(bob.address)).to.equal(500*5);
  });

  it("respect total contribution limits at each phase", async function() {
    for (var i = 0 ;i < 10; i++) {
      await spaceCoinICO.connect(addrs[i]).contribute({value:ethers.utils.parseEther("1499")});
    }
    await expect(spaceCoinICO.connect(addrs[10]).contribute({value:ethers.utils.parseEther("500")}))
      .to.be.revertedWith("reached phase limit");
    
    await spaceCoinICO.connect(owner).advancePhase();

    for (var i = 10; i < 25; i++) {
      await spaceCoinICO.connect(addrs[i]).contribute({value:ethers.utils.parseEther("999")});
    }

    await expect(spaceCoinICO.connect(addrs[25]).contribute({value:ethers.utils.parseEther("500")}))
      .to.be.revertedWith("reached phase limit");
    
    await spaceCoinICO.connect(owner).advancePhase();

    await spaceCoinICO.connect(addrs[25]).contribute({value:ethers.utils.parseEther("70024")})
    await expect(spaceCoinICO.connect(addrs[25]).contribute({value:ethers.utils.parseEther("1")}))
      .to.be.revertedWith("max supply reached");
    
  });

  it("calculates tax correctly", async function() {
    await spaceCoinICO.connect(owner).setTaxEnabled(true);
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(owner).advancePhase();
    await spaceCoinICO.connect(bob).contribute({value:ethers.utils.parseEther("500")});
    await spaceCoinICO.connect(bob).transfer(alice.address, 2500);
    expect (await spaceCoinICO.balanceOf(bob.address)).to.equal(0);
    expect (await spaceCoinICO.balanceOf(alice.address)).to.equal(2500 * 0.98);
    expect (await spaceCoinICO.balanceOf(treasury.address)).to.equal(2500 * 0.02);
  });

  it("allows owner to withdraw in open phase", async function() {
    await spaceCoinICO.connect(addrs[0]).contribute({value:ethers.utils.parseEther("500")});
    await expect(spaceCoinICO.connect(bob).withdrawFunds(ethers.utils.parseEther("500")))
      .to.be.revertedWith("not owner");
      await expect(spaceCoinICO.connect(owner).withdrawFunds(ethers.utils.parseEther("500")))
      .to.be.revertedWith("not Open Phase");
    await spaceCoinICO.connect(owner).advancePhase();
    await expect(spaceCoinICO.connect(owner).withdrawFunds(ethers.utils.parseEther("500")))
      .to.be.revertedWith("not Open Phase");

    await spaceCoinICO.connect(owner).advancePhase();
    await expect(spaceCoinICO.connect(owner).withdrawFunds(ethers.utils.parseEther("600")))
      .to.be.revertedWith("not enough funds");

    const ownerBeforeAmount = await ethers.provider.getBalance(owner.address);
    await spaceCoinICO.connect(owner).withdrawFunds(ethers.utils.parseEther("500"));
    const ownerAfterAmount = await ethers.provider.getBalance(owner.address);
    expect(ownerAfterAmount.sub(ownerBeforeAmount)).to.be.below(ethers.utils.parseEther("500"));
    expect(ownerAfterAmount.sub(ownerBeforeAmount)).to.be.above(ethers.utils.parseEther("499.99"));

  });
});