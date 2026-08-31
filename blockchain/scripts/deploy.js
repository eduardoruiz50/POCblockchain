const hre = require("hardhat");

async function main() {
  console.log("Iniciando despliegue de contratos...");

  const initialMessage = "¡Hola desde POCblockchain!";
  const sampleContract = await hre.ethers.deployContract("SampleContract", [initialMessage]);

  await sampleContract.waitForDeployment();

  const contractAddress = await sampleContract.getAddress();
  console.log(`✅ SampleContract desplegado exitosamente en: ${contractAddress}`);
  console.log(` Mensaje inicial configurado: "${initialMessage}"`);
}

main().catch((error) => {
  console.error("Error durante el despliegue:", error);
  process.exitCode = 1;
});
