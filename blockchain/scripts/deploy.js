const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando despliegue de MielBierzoDPP1155 (Arquitectura Relayer + Oráculo)...");

  const signers = await hre.ethers.getSigners();
  const defaultAdmin = signers[0];
  const defaultRelayer = signers.length > 1 ? signers[1] : defaultAdmin;
  const defaultConsejo = signers.length > 2 ? signers[2] : defaultAdmin;
  const defaultApicultor = signers.length > 3 ? signers[3] : defaultAdmin;

  const adminAddress = process.env.ADMIN_ADDRESS || defaultAdmin.address;
  const relayerAddress = process.env.RELAYER_ADDRESS || defaultRelayer.address;
  const consejoAddress = process.env.CONSEJO_REGULADOR_ADDRESS || defaultConsejo.address;

  console.log(`👤 Admin / Owner: ${adminAddress}`);
  console.log(`⚡ Relayer (Operador Web3): ${relayerAddress}`);
  console.log(`🏛️ Consejo Regulador / Oráculo: ${consejoAddress}`);
  console.log(`👨‍🌾 Apicultor Ejemplo: ${defaultApicultor.address}`);

  const ContractFactory = await hre.ethers.getContractFactory("MielBierzoDPP1155");
  // Constructor: admin, relayer, consejoRegulador
  const contract = await ContractFactory.deploy(adminAddress, relayerAddress, consejoAddress);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`\n✅ MielBierzoDPP1155 desplegado exitosamente en: ${contractAddress}`);
  console.log(`🔑 Roles asignados: RELAYER_ROLE y ORACULO_ROLE configurados para ${relayerAddress}`);

  console.log("\n📋 Variables recomendadas para actualizar en api/.env:");
  console.log(`CONTRACT_ADDRESS_1155=${contractAddress}`);
  if (!process.env.RELAYER_ADDRESS && defaultRelayer.address === "0x70997970C51812dc3A010C7d01b50e0d17dc79C8") {
    console.log(`RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d # Cuenta local #1 de Hardhat`);
  } else {
    console.log(`RELAYER_PRIVATE_KEY=<clave_privada_de_${relayerAddress}>`);
  }
}

main().catch((error) => {
  console.error("❌ Error durante el despliegue:", error);
  process.exitCode = 1;
});
