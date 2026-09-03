# API POCblockchain (Express.js & GS1 Digital Link)

Módulo backend para la Prueba de Concepto (POC) que expone endpoints REST, implementa la resolución del estándar **GS1 Digital Link** para Pasaportes Digitales de Producto (DPP) e interactúa con contratos inteligentes en la red Blockchain utilizando `ethers.js (v6)`.

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
│   ├── controllers/        # Controladores de las rutas REST
│   ├── middlewares/        # Middlewares de Express (CORS, Morgan, ErrorHandler)
│   ├── routes/             # Definición de rutas (/api/health)
│   ├── services/           # Lógica Web3 de conexión con Blockchain
│   └── server.js           # Inicialización del servidor y registro de rutas/middlewares
├── .env.example
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

- `GET /`: Mensaje de bienvenida con **negociación de contenido** (Dashboard HTML visual para navegadores / Payload JSON con listado dinámico de endpoints para APIs).
- `GET /api/health`: Estado de salud, tiempo de actividad (*uptime*) y diagnóstico del servidor.
- `POST /api/dpp/fase1/registro`: **Registro en Origen (Fase 1)** - Procesamiento de datos del lote, subida a IPFS y generación del DPP en Blockchain.
- `GET /01/:gtin/10/:lote`: **GS1 Digital Link Resolver** - Consulta y verificación inmutable del Pasaporte Digital de Producto (DPP) en la Blockchain de la DOP Miel del Bierzo (soporta HTML consumidor y JSON/JSON-LD estructurado).
- `GET /api/v1/siex/explotacion/:id`: **Mock SIEX** - Simulación del Sistema de Información de Explotaciones Agrícolas en España.
- `GET /v1/operators/:id`: **Mock TRACES NT** - Simulación del Trade Control and Expert System New Technology de la UE.

