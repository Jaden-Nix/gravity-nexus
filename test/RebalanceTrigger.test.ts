import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

describe("Gravity Nexus: Reactive Rebalance Detailed Test", function () {
    let mockToken: any;
    let vault: any;
    let adapterA: any;
    let adapterB: any;
    let reactiveNexus: any;
    let owner: any;
    let user: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // 1. Deploy Mock Token
        const MockToken = await ethers.getContractFactory("MockToken");
        mockToken = await MockToken.deploy();
        await mockToken.waitForDeployment();

        // 2. Deploy NexusVault
        const NexusVault = await ethers.getContractFactory("NexusVault");
        vault = await NexusVault.deploy(await mockToken.getAddress());
        await vault.waitForDeployment();

        // 3. Deploy Mock Adapters
        const MockAdapter = await ethers.getContractFactory("MockAdapter");
        // Pool A: 5% APY (500 basis points)
        adapterA = await MockAdapter.deploy(await mockToken.getAddress(), 500);
        // Pool B: 5% APY (initial same yield)
        adapterB = await MockAdapter.deploy(await mockToken.getAddress(), 500);
        await adapterA.waitForDeployment();
        await adapterB.waitForDeployment();

        // 4. Add Adapters to Vault
        await vault.addAdapter(await adapterA.getAddress());
        await vault.addAdapter(await adapterB.getAddress());

        // 5. Deploy ReactiveNexus
        const ReactiveNexus = await ethers.getContractFactory("ReactiveNexus");
        reactiveNexus = await ReactiveNexus.deploy();
        await reactiveNexus.waitForDeployment();

        // 6. Setup Relationships
        await reactiveNexus.setVault(await vault.getAddress());
        await vault.transferOwnership(await reactiveNexus.getAddress());

        // 7. Initial Deposit
        const depositAmount = ethers.parseUnits("10", 18);
        await mockToken.mint(owner.address, depositAmount);
        await mockToken.approve(await vault.getAddress(), depositAmount);
        await vault.deposit(depositAmount);
    });

    it("should start with all funds in Pool A", async function () {
        expect(await adapterA.totalAssets()).to.equal(ethers.parseUnits("10", 18));
        expect(await adapterB.totalAssets()).to.equal(0n);
    });

    it("should NOT rebalance if yield difference is below threshold (1%)", async function () {
        // Set Pool B to 5.5% (gap is 0.5% < 1%)
        await adapterB.setSupplyRate(550);

        await reactiveNexus.checkYieldAndRebalance(ethers.parseUnits("10", 18));

        // Still in A
        expect(await adapterA.totalAssets()).to.equal(ethers.parseUnits("10", 18));
        expect(await adapterB.totalAssets()).to.equal(0n);
    });

    it("should trigger rebalance A -> B when B yield spikes (e.g. 10%)", async function () {
        // Gap is 5% (> 1% threshold)
        await adapterB.setSupplyRate(1000);

        const moveAmount = ethers.parseUnits("10", 18);

        await expect(reactiveNexus.checkYieldAndRebalance(moveAmount))
            .to.emit(reactiveNexus, "ActionTriggered")
            .withArgs("REBALANCE", 0, 1, moveAmount)
            .to.emit(reactiveNexus, "ActionExecuted")
            .withArgs("Rebalance Success");

        expect(await adapterA.totalAssets()).to.equal(0n);
        expect(await adapterB.totalAssets()).to.equal(moveAmount);
    });

    it("should rebalance BACK (B -> A) if A yield becomes superior", async function () {
        // First move A -> B
        await adapterB.setSupplyRate(1000);
        await reactiveNexus.checkYieldAndRebalance(ethers.parseUnits("10", 18));

        // Now A spikes to 15%, B stays at 10%
        await adapterA.setSupplyRate(1500);

        const moveAmount = ethers.parseUnits("10", 18);

        // This confirms the "Dynamic Detection" logic works
        await expect(reactiveNexus.checkYieldAndRebalance(moveAmount))
            .to.emit(reactiveNexus, "ActionTriggered")
            .withArgs("REBALANCE", 1, 0, moveAmount)
            .to.emit(reactiveNexus, "ActionExecuted")
            .withArgs("Rebalance Success");

        expect(await adapterA.totalAssets()).to.equal(moveAmount);
        expect(await adapterB.totalAssets()).to.equal(0n);
    });
});
