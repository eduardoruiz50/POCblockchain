# POCblockchain

Prueba de Concepto (POC) modular que integra una API REST construida en **Node.js / Express.js** con contratos inteligentes desarrollados en **Solidity** utilizando el entorno de desarrollo **Hardhat** y la librería **ethers.js (v6)**.

---

##  Estructura del Proyecto

El repositorio está organizado en una arquitectura monorepo desacoplada en dos módulos principales:

```text
POCblockchain/
├── .gitignore
├── README.md                                # Documentación principal del proyecto
│
├── api/                                     # Módulo Backend (Express.js + Ethers.js)
│   ├── .env.example                         # Plantilla de variables de entorno de la API
│   ├── package.json                         # Dependencias (express, ethers, cors, morgan, etc.)
│   ├── pnpm-lock.yaml                       # Archivo de bloqueo de dependencias (pnpm)
│   ├── README.md                            # Documentación específica de la API
│   └── src/
│       ├── config/index.js                  # Configuración centralizada de variables y RPC
│       ├── controllers/
│       │   └── healthController.js          # Controlador de estado y monitoreo de la API
│       ├── middlewares/
│       │   └── errorHandler.js              # Middleware global para captura y manejo de errores
│       ├── routes/
│       │   └── healthRoutes.js             # Definición de rutas REST (/api/health)
│       ├── services/
│       │   └── blockchainService.js        # Servicio base ethers.js para interactuar con la Web3
│       └── server.js                        # Punto de entrada principal y servidor Express
│
└── blockchain/                              # Módulo Smart Contracts (Solidity + Hardhat)
    ├── .env.example                         # Plantilla de variables para RPC, llaves y Etherscan
    ├── package.json                         # Dependencias de Hardhat y Hardhat Toolbox
    ├── hardhat.config.js                    # Configuración de compilador, redes (localhost, Sepolia)
    ├── README.md                            # Documentación específica del módulo Blockchain
    ├── contracts/
    │   └── SampleContract.sol               # Contrato inteligente en Solidity (^0.8.24)
    ├── scripts/
    │   └── deploy.js                        # Script automatizado de despliegue
    └── test/
        └── SampleContract.test.js           # Suite de pruebas unitarias con Mocha y Chai
```

---

##  Tecnologías Utilizadas

- **Blockchain & Smart Contracts:**
  - **Solidity (^0.8.24):** Lenguaje para contratos inteligentes.
  - **Hardhat (^2.22.8):** Entorno de desarrollo, compilación, pruebas y redes locales.
  - **Hardhat Toolbox (@nomicfoundation/hardhat-toolbox):** Suite de herramientas para Ether.js, Chai y Mocha.
- **Backend & API:**
  - **Node.js & Express.js (^4.19.2):** Servidor HTTP y enrutamiento REST.
  - **Ethers.js (v6.13.2):** Abstracción y cliente Web3 para conexión RPC y gestión de wallets.
  - **Morgan & CORS:** Middleware para logging de peticiones HTTP y habilitación de peticiones cruzadas.
  - **Nodemon:** Hot-reloading durante el desarrollo.

---

## 📄 Detalle de Componentes

### 1. Smart Contracts (`/blockchain`)
- **`SampleContract.sol`**:
  - **Estado:**
    - `address public owner`: Dirección del propietario/creador del contrato.
    - `string private message`: Mensaje almacenado en el estado del contrato.
    - `uint256 public counter`: Contador numérico.
  - **Funciones:**
    - `constructor(string initialMessage)`: Inicializa el propietario y el mensaje inicial.
    - `setMessage(string newMessage)`: Actualiza el mensaje emitido por el evento `MessageUpdated`.
    - `getMessage()`: Consulta el mensaje actual (view).
    - `incrementCounter()`: Incrementa el contador en 1 y emite `CounterIncremented`.
    - `resetCounter()`: Reinicia el contador a 0 (restringido únicamente al `owner` mediante modifier `onlyOwner`).
  - **Eventos:**
    - `MessageUpdated(address indexed updater, string newMessage)`
    - `CounterIncremented(address indexed updater, uint256 newCounter)`

### 2. API REST (`/api`)
- **`BlockchainService` (`src/services/blockchainService.js`)**:
  - `getCurrentBlock()`: Retorna el número de bloque actual del nodo configurado.
  - `getBalance(address)`: Retorna el saldo en ETH/token nativo formatado.
  - Configuración flexible de `JsonRpcProvider` y `Wallet` firmante según variables de entorno.
- **Endpoints:**
  - `GET /`: Endpoint raíz con información básica y lista de endpoints disponibles.
  - `GET /api/health`: Estado de salud de la API (`online`, `uptime`, `timestamp`, `service`).

---

##  Variables de Entorno

### Módulo `api/.env`
```ini
PORT=3000
NODE_ENV=development
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
# PRIVATE_KEY=0x...
```

### Módulo `blockchain/.env`
```ini
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000000
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

---

## 🚀 Guía de Instalación y Ejecución

### Paso 1: Configurar y Probar Smart Contracts
```bash
cd blockchain

# Instalar dependencias
npm install

# Compilar los contratos en Solidity
npx hardhat compile

# Ejecutar las pruebas unitarias
npx hardhat test
```

### Paso 2: Despliegue en Nodo Local Hardhat
En una terminal:
```bash
cd blockchain
npx hardhat node
```

En otra terminal, desplegar el contrato en la red local:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### Paso 3: Configurar y Levantar la API REST
```bash
cd api

# Instalar dependencias
npm install

# Crear archivo .env desde la plantilla
cp .env.example .env

# Iniciar servidor en modo desarrollo
npm run dev
```

El servidor API estará disponible en `http://localhost:3000`.

---

##  Comandos Rápidos

| Módulo | Comando | Descripción |
| :--- | :--- | :--- |
| **blockchain** | `npm run compile` | Compila los contratos Solidity |
| **blockchain** | `npm run test` | Ejecuta la suite de pruebas unitarias |
| **blockchain** | `npm run node` | Inicia un nodo de pruebas local Hardhat |
| **blockchain** | `npm run deploy:local` | Despliega los contratos en la red local |
| **blockchain** | `npm run deploy:sepolia` | Despliega los contratos en la red Sepolia |
| **api** | `npm run dev` | Inicia el servidor API con hot-reloading (nodemon) |
| **api** | `npm run start` | Inicia el servidor API en modo producción |

