# API POCblockchain (Express.js & GS1 Digital Link)

Módulo backend para la Prueba de Concepto (POC) que expone endpoints REST, implementa la resolución del estándar **GS1 Digital Link** para Pasaportes Digitales de Producto (DPP) e interactúa con el contrato inteligente `MielBierzoDPP1155` (ERC-1155 Multi-Token) en la red Blockchain utilizando `ethers.js (v6)`.

---

## 🌐 Entornos de Ejecución

- **Producción (Render):** [https://dpp-mieldelbierzo.onrender.com](https://dpp-mieldelbierzo.onrender.com)
- **Desarrollo Local:** `http://localhost:3000`

---

## Estructura

```text
api/
├── scripts/
│   └── generate_qr.js      # Generador automatizado de códigos QR GS1 (PNG, SVG, Consola)
├── src/
│   ├── config/             # Configuración centralizada de variables de entorno y RPC
│   ├── controllers/        # Controladores (dppController, fase1Registro, health, etc.)
│   ├── middlewares/        # Middlewares de Express (CORS, Morgan, ErrorHandler)
│   ├── routes/             # Definición de rutas (/api/dpp, /01/:gtin/10/:lote, /api/health)
│   ├── services/           # Lógica Web3 de conexión con Smart Contract ERC-1155
│   └── server.js           # Inicialización del servidor y registro de rutas/middlewares
├── .env.example            # Variables para contratos, RPC y llaves de roles
├── package.json
└── README.md
```

---

## Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Ejecutar en modo desarrollo (hot-reloading):
   ```bash
   npm run dev
   ```

4. Ejecutar en modo producción:
   ```bash
   npm start
   ```

5. Generar códigos QR para GS1 Digital Link:
   ```bash
   npm run generate:qr
   ```

---

## Endpoints Principales

### 🏷️ Resolver GS1 Digital Link & Bienvenida
- `GET /`: Mensaje de bienvenida con **negociación de contenido** (Dashboard HTML visual para navegadores / Payload JSON con listado dinámico de endpoints para APIs).
- `GET /api/health`: Estado de salud, tiempo de actividad (*uptime*) y diagnóstico del servidor.
- `GET /01/:gtin/10/:lote`: **GS1 Digital Link Resolver** - Consulta y verificación inmutable del Pasaporte Digital de Producto (DPP) en la Blockchain de la DOP Miel del Bierzo (soporta HTML interactivo para el consumidor y JSON/JSON-LD estructurado).

### 🍯 Ciclo de Vida del DPP (Fases 1 a 4)
- `POST /api/dpp/fase1/registro`: **Fase 1 (Apicultor)** - Registro en origen, empaquetado y subida de metadatos a IPFS, y minado en Smart Contract (`mintDPPBatch`).
- `POST /api/dpp/fase2/certificar`: **Fase 2 (Consejo Regulador)** - Emisión de dictamen oficial de la D.O.P. y registro inmutable del hash de laboratorio (`certifyLot`).
- `POST /api/dpp/fase3/transferir`: **Fase 3 (Comercio Local)** - Transferencia y trazabilidad de tarros físicos acuñados vía tokens ERC-1155 (`safeTransferFrom`).
- `GET /api/dpp/lote/:loteId`: **Fase 4 (Consulta On-Chain)** - Lectura directa de estado, metadatos, evidencias criptográficas y stock actual sin consumo de gas.

### 🏛️ Mocks de Servicios Oficiales
- `GET /api/v1/siex/explotacion/:id`: **Mock SIEX** - Simulación del Sistema de Información de Explotaciones Agrícolas en España.
- `GET /v1/operators/:id`: **Mock TRACES NT** - Simulación del Trade Control and Expert System New Technology de la UE.
