# POCblockchain

Prueba de Concepto (POC) que integra una API REST construida en **Express.js** con contratos inteligentes desarrollados en **Solidity**.

## Estructura del Proyecto

```text
POCblockchain/
├── api/                # Backend API en Express.js
│   ├── src/
│   │   ├── config/         # Configuración y variables de entorno
│   │   ├── controllers/    # Controladores de peticiones
│   │   ├── middlewares/    # Middlewares (ej. manejo de errores)
│   │   ├── routes/         # Definición de rutas REST
│   │   ├── services/       # Lógica de negocio e interacción con Blockchain
│   │   └── server.js       # Punto de entrada de la aplicación Express
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── blockchain/         # Entorno de contratos inteligentes en Solidity
│   ├── contracts/          # Smart Contracts (.sol)
│   ├── scripts/            # Scripts de despliegue y tareas Hardhat
│   ├── test/               # Pruebas unitarias de contratos
│   ├── hardhat.config.js   # Configuración de Hardhat
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── .gitignore
└── README.md
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
