const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MielBierzoDPP1155 Smart Contract", function () {
  let contract;
  let admin;
  let consejoRegulador;
  let apicultor;
  let tienda;
  let otroUsuario;

  const loteId = "L-2026-CAST01";
  const gtin = "08412345678905";
  const cantidadTarros = 500;
  const ipfsURI = "ipfs://bafybeigx47xmj2l3qkm7v2y2pynfxs44u67aov3h3y33sq543wlzc5aqaq";
  const regaHash = ethers.id("REGA-ES190010000123");
  const tracesHash = ethers.id("TRACES-ES-BIO-001");
  const certHash = ethers.id("CERT-DOP-LAB-9921");

  beforeEach(async function () {
    [admin, consejoRegulador, apicultor, tienda, otroUsuario] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("MielBierzoDPP1155");
    contract = await ContractFactory.deploy(admin.address, consejoRegulador.address);
    await contract.waitForDeployment();

    // Asignar rol APICULTOR_ROLE
    const APICULTOR_ROLE = await contract.APICULTOR_ROLE();
    await contract.connect(admin).grantRole(APICULTOR_ROLE, apicultor.address);
  });

  describe("Despliegue y Roles", function () {
    it("Debería asignar roles iniciales a admin y consejo regulador", async function () {
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const CONSEJO_ROLE = await contract.CONSEJO_REGULADOR_ROLE();
      const APICULTOR_ROLE = await contract.APICULTOR_ROLE();

      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await contract.hasRole(CONSEJO_ROLE, consejoRegulador.address)).to.be.true;
      expect(await contract.hasRole(APICULTOR_ROLE, apicultor.address)).to.be.true;
    });
  });

  describe("Fase 1: Registro y Minado Masivo (Apicultor)", function () {
    it("Debería permitir al apicultor minar el lote y acuñar los tokens ERC-1155", async function () {
      await expect(
        contract.connect(apicultor).mintDPPBatch(
          apicultor.address,
          loteId,
          gtin,
          cantidadTarros,
          ipfsURI,
          regaHash,
          tracesHash
        )
      ).to.emit(contract, "BatchMinted");

      const loteData = await contract.getLoteByLoteId(loteId);
      expect(loteData.tokenId).to.equal(1n);
      expect(loteData.gtin).to.equal(gtin);
      expect(loteData.cantidadTarros).to.equal(BigInt(cantidadTarros));
      expect(Number(loteData.estado)).to.equal(0); // PENDIENTE_CERTIFICACION

      // Verificar balance ERC-1155 del apicultor
      const balance = await contract.balanceOf(apicultor.address, 1);
      expect(balance).to.equal(BigInt(cantidadTarros));
    });

    it("Debería rechazar el minado si no tiene el rol de apicultor", async function () {
      await expect(
        contract.connect(otroUsuario).mintDPPBatch(
          otroUsuario.address,
          loteId,
          gtin,
          cantidadTarros,
          ipfsURI,
          regaHash,
          tracesHash
        )
      ).to.be.reverted;
    });
  });

  describe("Fase 2: Certificación D.O.P. (Consejo Regulador)", function () {
    beforeEach(async function () {
      await contract.connect(apicultor).mintDPPBatch(
        apicultor.address,
        loteId,
        gtin,
        cantidadTarros,
        ipfsURI,
        regaHash,
        tracesHash
      );
    });

    it("Debería permitir al Consejo Regulador certificar un lote", async function () {
      await expect(
        contract.connect(consejoRegulador).certifyLot(loteId, certHash, true)
      ).to.emit(contract, "BatchCertified");

      const loteData = await contract.getLoteByLoteId(loteId);
      expect(Number(loteData.estado)).to.equal(1); // CERTIFICADO_DOP_BIERZO
      expect(loteData.dopCertHash).to.equal(certHash);
    });

    it("Debería rechazar si otro usuario intenta certificar", async function () {
      await expect(
        contract.connect(apicultor).certifyLot(loteId, certHash, true)
      ).to.be.reverted;
    });
  });

  describe("Fase 3: Transferencia ERC-1155 a Comercio", function () {
    beforeEach(async function () {
      await contract.connect(apicultor).mintDPPBatch(
        apicultor.address,
        loteId,
        gtin,
        cantidadTarros,
        ipfsURI,
        regaHash,
        tracesHash
      );
    });

    it("Debería transferir tarros del apicultor a la tienda", async function () {
      const cantidadATransferir = 50;
      await contract.connect(apicultor).safeTransferFrom(
        apicultor.address,
        tienda.address,
        1,
        cantidadATransferir,
        "0x"
      );

      const balTienda = await contract.balanceOf(tienda.address, 1);
      const balApicultor = await contract.balanceOf(apicultor.address, 1);

      expect(balTienda).to.equal(BigInt(cantidadATransferir));
      expect(balApicultor).to.equal(BigInt(cantidadTarros - cantidadATransferir));
    });
  });
});
