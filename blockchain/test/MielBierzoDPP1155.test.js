const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MielBierzoDPP1155 Smart Contract (Relayer & Oráculo Architecture)", function () {
  let contract;
  let admin;
  let relayer;
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
    [admin, relayer, consejoRegulador, apicultor, tienda, otroUsuario] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("MielBierzoDPP1155");
    contract = await ContractFactory.deploy(admin.address, relayer.address, consejoRegulador.address);
    await contract.waitForDeployment();
  });

  describe("Despliegue y Roles", function () {
    it("Debería asignar roles de RELAYER y APICULTOR al Relayer", async function () {
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const RELAYER_ROLE = await contract.RELAYER_ROLE();
      const APICULTOR_ROLE = await contract.APICULTOR_ROLE();
      const CONSEJO_ROLE = await contract.CONSEJO_REGULADOR_ROLE();
      const ORACULO_ROLE = await contract.ORACULO_ROLE();

      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await contract.hasRole(RELAYER_ROLE, relayer.address)).to.be.true;
      expect(await contract.hasRole(APICULTOR_ROLE, relayer.address)).to.be.true;
      expect(await contract.hasRole(CONSEJO_ROLE, consejoRegulador.address)).to.be.true;
      expect(await contract.hasRole(ORACULO_ROLE, relayer.address)).to.be.true;
    });
  });

  describe("Fase 1: Registro y Minado Masivo (Relayer)", function () {
    it("El Relayer debería minar el lote y asignar los tokens ERC-1155 a la wallet del Apicultor", async function () {
      await expect(
        contract.connect(relayer).mintDPPBatch(
          apicultor.address,
          loteId,
          gtin,
          cantidadTarros,
          ipfsURI,
          regaHash,
          tracesHash
        )
      ).to.emit(contract, "BatchMinted")
        .withArgs(1n, loteId, gtin, cantidadTarros, apicultor.address);

      const loteData = await contract.getLoteByLoteId(loteId);
      expect(loteData.tokenId).to.equal(1n);
      expect(loteData.gtin).to.equal(gtin);
      expect(loteData.cantidadTarros).to.equal(BigInt(cantidadTarros));
      expect(Number(loteData.estado)).to.equal(0); // PENDIENTE_CERTIFICACION

      // Verificar que el apicultor recibió los tokens físicos tokenizados
      const balance = await contract.balanceOf(apicultor.address, 1);
      expect(balance).to.equal(BigInt(cantidadTarros));
    });

    it("Debería rechazar el minado si no tiene el rol de Relayer o Apicultor", async function () {
      await expect(
        contract.connect(otroUsuario).mintDPPBatch(
          apicultor.address,
          loteId,
          gtin,
          cantidadTarros,
          ipfsURI,
          regaHash,
          tracesHash
        )
      ).to.be.revertedWith("Error: Requiere rol RELAYER_ROLE o APICULTOR_ROLE");
    });
  });

  describe("Fase 2: Certificación D.O.P. (Oráculo / Consejo Regulador)", function () {
    beforeEach(async function () {
      await contract.connect(relayer).mintDPPBatch(
        apicultor.address,
        loteId,
        gtin,
        cantidadTarros,
        ipfsURI,
        regaHash,
        tracesHash
      );
    });

    it("Debería permitir certificar vía Oráculo / Relayer", async function () {
      await expect(
        contract.connect(relayer).certifyLot(loteId, certHash, true)
      ).to.emit(contract, "BatchCertified");

      const loteData = await contract.getLoteByLoteId(loteId);
      expect(Number(loteData.estado)).to.equal(1); // CERTIFICADO_DOP_BIERZO
      expect(loteData.dopCertHash).to.equal(certHash);
    });

    it("Debería permitir certificar directamente al Consejo Regulador", async function () {
      await expect(
        contract.connect(consejoRegulador).certifyLot(loteId, certHash, true)
      ).to.emit(contract, "BatchCertified");

      const loteData = await contract.getLoteByLoteId(loteId);
      expect(Number(loteData.estado)).to.equal(1);
    });

    it("Debería rechazar si un usuario no autorizado intenta certificar", async function () {
      await expect(
        contract.connect(otroUsuario).certifyLot(loteId, certHash, true)
      ).to.be.revertedWith("Error: No autorizado para certificar lote");
    });
  });

  describe("Fase 3: Transferencia ERC-1155 a Comercio", function () {
    beforeEach(async function () {
      await contract.connect(relayer).mintDPPBatch(
        apicultor.address,
        loteId,
        gtin,
        cantidadTarros,
        ipfsURI,
        regaHash,
        tracesHash
      );
    });

    it("Debería transferir tarros del apicultor a la tienda con aprobación previa", async function () {
      const cantidadATransferir = 75;

      // El apicultor autoriza al relayer como operador
      await contract.connect(apicultor).setApprovalForAll(relayer.address, true);

      // El Relayer ejecuta la transferencia
      await contract.connect(relayer).safeTransferFrom(
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
