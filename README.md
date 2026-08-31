# POCblockchain

Prueba de Concepto (POC) que integra una API REST construida en **Express.js** con contratos inteligentes desarrollados en **Solidity**.

## Estructura del Proyecto

```text
POCblockchain/
├── .gitignore
├── README.md
│
├── api/                                    # Módulo Backend (Express.js)
│   ├── .env.example                        # Variables de entorno de ejemplo
│   ├── package.json                        # Dependencias (express, ethers, cors, etc.)
│   ├── README.md
│   └── src/
│       ├── config/index.js                 # Configuración de variables y red
│       ├── controllers/healthController.js # Controlador de estado
│       ├── middlewares/errorHandler.js     # Manejador global de excepciones
│       ├── routes/healthRoutes.js          # Definición de rutas REST (/api/health)
│       ├── services/blockchainService.js   # Wrapper con ethers.js para interactuar con la red
│       └── server.js                       # Entrada y servidor Express
│
└── blockchain/                             # Módulo Smart Contracts (Solidity + Hardhat)
    ├── .env.example                        # Variables para RPC, llaves y Etherscan
    ├── package.json                        # Dependencias de Hardhat y Toolbox
    ├── hardhat.config.js                   # Configuración del compilador y redes
    ├── README.md
    ├── contracts/
    │   └── SampleContract.sol              # Contrato base de ejemplo en Solidity ^0.8.24
    ├── scripts/
    │   └── deploy.js                       # Script de despliegue automatizado
    └── test/
        └── SampleContract.test.js          # Suite de pruebas unitarias
```

## Primeros Pasos

### 1. Configuración de la Blockchain (Solidity / Hardhat)
Accede a la carpeta `blockchain`:
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
```

### 2. Configuración de la API (Express.js)
Accede a la carpeta `api`:
```bash
cd api
npm install
cp .env.example .env
npm run dev
```
