# Contratos Blockchain POC (Solidity & Hardhat)

Módulo de contratos inteligentes para el proyecto POCblockchain utilizando **Solidity** y el entorno de desarrollo **Hardhat**.

## Estructura

```text
blockchain/
├── contracts/              # Contratos inteligentes en Solidity (.sol)
│   └── MielBierzoDPP1155.sol # Contrato ERC-1155 del Pasaporte Digital (DPP)
├── scripts/                # Scripts de automatización y despliegue
│   └── deploy.js
├── test/                   # Pruebas unitarias con Chai y Mocha
│   └── MielBierzoDPP1155.test.js
├── hardhat.config.js       # Configuración de compilador, redes y optimizaciones
├── .env.example
├── package.json
└── README.md
```

## Notas Técnicas

- **Solidity Version:** `0.8.24`
- **EVM Target:** `cancun`. Este requerimiento se debe al uso de la función `mcopy` (introducida en el hard fork de Cancun) utilizada en las últimas versiones de `@openzeppelin/contracts` (v5.6+).

## Instalación y Comandos

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Compilar contratos:
   ```bash
   npx hardhat compile
   ```

4. Ejecutar pruebas unitarias:
   ```bash
   npx hardhat test
   ```

5. Levantar un nodo local de pruebas:
   ```bash
   npx hardhat node
   ```

6. Desplegar en red local:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

7. Desplegar en testnet (ej. Sepolia):
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
