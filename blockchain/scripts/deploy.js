const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando despliegue de MielBierzoDPP1155...");

  const [admin, consejoRegulador, apicultor] = await hre.ethers.getSigners();

  console.log(`👤 Admin / Deployer: ${admin.address}`);
  console.log(`🏛️ Consejo Regulador: ${consejoRegulador.address}`);
  console.log(`👨‍🌾 Apicultor: ${apicultor.address}`);

  const ContractFactory = await hre.ethers.getContractFactory("MielBierzoDPP1155");
  const contract = await ContractFactory.deploy(admin.address, consejoRegulador.address);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ MielBierzoDPP1155 desplegado exitosamente en: ${contractAddress}`);

  // Otorgar rol de APICULTOR al apicultor de pruebas
  const APICULTOR_ROLE = await contract.APICULTOR_ROLE();
  const txGrant = await contract.grantRole(APICULTOR_ROLE, apicultor.address);
  await txGrant.wait();
  console.log(`🔑 Rol APICULTOR_ROLE asignado a: ${apicultor.address}`);

  console.log("\n📋 Configuración para api/.env:");
  console.log(`CONTRACT_ADDRESS_1155=${contractAddress}`);
}

main().catch((error) => {
  console.error("❌ Error durante el despliegue:", error);
  process.exitCode = 1;
});
