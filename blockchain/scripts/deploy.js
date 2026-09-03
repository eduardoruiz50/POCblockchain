const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando despliegue de MielBierzoDPP1155 (Arquitectura Relayer + Oráculo)...");

  const [admin, relayer, consejoRegulador, apicultor] = await hre.ethers.getSigners();

  console.log(`👤 Admin / Owner: ${admin.address}`);
  console.log(`⚡ Relayer (Operador Web3): ${relayer.address}`);
  console.log(`🏛️ Consejo Regulador / Oráculo: ${consejoRegulador.address}`);
  console.log(`👨‍🌾 Apicultor Productor: ${apicultor.address}`);

  const ContractFactory = await hre.ethers.getContractFactory("MielBierzoDPP1155");
  // Constructor: admin, relayer, consejoRegulador
  const contract = await ContractFactory.deploy(admin.address, relayer.address, consejoRegulador.address);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ MielBierzoDPP1155 desplegado exitosamente en: ${contractAddress}`);
  console.log(`🔑 Roles asignados: RELAYER_ROLE y ORACULO_ROLE configurados para ${relayer.address}`);

  console.log("\n📋 Variables para api/.env:");
  console.log(`CONTRACT_ADDRESS_1155=${contractAddress}`);
  console.log(`RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
}

main().catch((error) => {
  console.error("❌ Error durante el despliegue:", error);
  process.exitCode = 1;
});
