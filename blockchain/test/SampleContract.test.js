const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SampleContract", function () {
  let sampleContract;
  let owner;
  let otherAccount;
  const initialMessage = "Mensaje Inicial de Prueba";

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const SampleContractFactory = await ethers.getContractFactory("SampleContract");
    sampleContract = await SampleContractFactory.deploy(initialMessage);
    await sampleContract.waitForDeployment();
  });

  describe("Despliegue", function () {
    it("Deberia asignar el owner correctamente", async function () {
      expect(await sampleContract.owner()).to.equal(owner.address);
    });

    it("Deberia establecer el mensaje inicial", async function () {
      expect(await sampleContract.getMessage()).to.equal(initialMessage);
    });

    it("Deberia iniciar el contador en 0", async function () {
      expect(await sampleContract.counter()).to.equal(0);
    });
  });

  describe("Interacciones", function () {
    it("Deberia permitir actualizar el mensaje y emitir el evento", async function () {
      const newMessage = "Nuevo Mensaje";
      await expect(sampleContract.setMessage(newMessage))
        .to.emit(sampleContract, "MessageUpdated")
        .withArgs(owner.address, newMessage);

      expect(await sampleContract.getMessage()).to.equal(newMessage);
    });

    it("Deberia incrementar el contador y emitir el evento", async function () {
      await expect(sampleContract.incrementCounter())
        .to.emit(sampleContract, "CounterIncremented")
        .withArgs(owner.address, 1);

      expect(await sampleContract.counter()).to.equal(1);
    });

    it("Solo el owner deberia poder reiniciar el contador", async function () {
      await sampleContract.incrementCounter();
      expect(await sampleContract.counter()).to.equal(1);

      // Intento por no-owner
      await expect(
        sampleContract.connect(otherAccount).resetCounter()
      ).to.be.revertedWith("Solo el propietario puede ejecutar esta accion");

      // Intento por owner
      await sampleContract.resetCounter();
      expect(await sampleContract.counter()).to.equal(0);
    });
  });
});
