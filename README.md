# POCblockchain

Prueba de Concepto (POC) modular que integra una API REST construida en **Node.js / Express.js** con contratos inteligentes desarrollados en **Solidity** utilizando el entorno de desarrollo **Hardhat** y la librería **ethers.js (v6)**.

---

## 🌐 Producción (Desplegado en Render)

- **URL de Producción:** [https://dpp-mieldelbierzo.onrender.com](https://dpp-mieldelbierzo.onrender.com)
- **Estado del Servicio:** `online`
- **Configuración de Despliegue:** Render Web Service (Node.js, Frankfurt) con integración continua (CI/CD auto-deploy) conectada a la rama `master` (`rootDir: "api"`).

---

##  Estructura del Proyecto

El repositorio está organizado en una arquitectura monorepo desacoplada en dos módulos principales:

```text
POCblockchain/
├── .gitignore                               # Reglas de exclusión de seguridad (.env, .agents/mcp_config.json, qr_outputs)
├── README.md                                # Documentación principal del proyecto
│
├── .agents/                                 # Configuración de Agentes IA y MCP Servers
│   └── mcp_config.example.json              # Plantilla pública segura para integración con Render MCP
│
├── api/                                     # Módulo Backend (Express.js + Ethers.js + GS1 Resolver)
│   ├── .env.example                         # Plantilla de variables de entorno de la API
│   ├── package.json                         # Dependencias (express, ethers, cors, qrcode, morgan, etc.)
│   ├── pnpm-lock.yaml                       # Archivo de bloqueo de dependencias (pnpm)
│   ├── README.md                            # Documentación específica de la API
│   ├── scripts/
│   │   └── generate_qr.js                   # Generador automatizado de códigos QR GS1 (PNG, SVG, Terminal)
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
│       └── server.js                        # Entrada principal (Express, GS1 Resolver, Content Negotiation)
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
  - **Node.js & Express.js (^4.19.2):** Servidor HTTP, enrutamiento REST y resolución GS1 Digital Link.
  - **Ethers.js (v6.13.2):** Abstracción y cliente Web3 para conexión RPC y gestión de wallets.
  - **QRCode (^1.5.4):** Generación de códigos QR en alta resolución (PNG, SVG vectorial y vista previa en terminal).
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

### 2. API REST & Herramientas (`/api`)
- **`server.js`**:
  - **Negociación de Contenido (`Accept` header)**:
    - Retorna una **interfaz HTML visual responsiva** con tarjetas interactivas cuando se accede desde un navegador web (`text/html`).
    - Retorna una **estructura JSON/JSON-LD** limpia cuando es consultada programáticamente por clientes REST o inspectores API (`application/json`).
  - **Extracción Dinámica de Endpoints (`getDynamicEndpoints`)**: Lista automáticamente todas las rutas registradas en el servidor Express en tiempo real.
  - **GS1 Digital Link Resolver (`GET /01/:gtin/10/:lote`)**: Resuelve URLs estandarizadas GS1 para Pasaportes Digitales de Producto (DPP) consultando la prueba inmutable en la Blockchain (DOP Miel del Bierzo).
- **`scripts/generate_qr.js`**:
  - Generador automatizado de códigos QR apuntando al dominio de producción en Render (`https://dpp-mieldelbierzo.onrender.com`).
  - Exporta automáticamente versiones en alta definición PNG (`600px`), gráficos vectoriales SVG y renderizado ascii directo en la terminal de la consola.

---

## 🔒 Seguridad de Credenciales y Variables de Entorno

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

> [!IMPORTANT]
> **Protección de Llaves Sensibles:** Los archivos de credenciales como `.env` y `.agents/mcp_config.json` (que contienen claves privadas de wallets o API Keys de Render) están protegidos y excluidos explícitamente en el archivo `.gitignore` para evitar su publicación accidental en el repositorio remoto.

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

El servidor API estará disponible localmente en `http://localhost:3000`.

### Paso 4: Generar Códigos QR GS1 Digital Link
```bash
cd api
npm run generate:qr
```

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
| **api** | `npm run generate:qr` | Genera los códigos QR GS1 (PNG, SVG, Terminal) |



