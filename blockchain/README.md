# Contratos Blockchain POC (Solidity & Hardhat)

Módulo de contratos inteligentes para el proyecto POCblockchain utilizando **Solidity** y el entorno de desarrollo **Hardhat**.

## Estructura

```text
blockchain/
├── contracts/              # Contratos inteligentes en Solidity (.sol)
│   └── SampleContract.sol
├── scripts/                # Scripts de automatización y despliegue
│   └── deploy.js
├── test/                   # Pruebas unitarias con Chai y Mocha
│   └── SampleContract.test.js
├── hardhat.config.js       # Configuración de compilador, redes y optimizaciones
├── .env.example
├── package.json
└── README.md
```

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
