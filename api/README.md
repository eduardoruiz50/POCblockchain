# API POCblockchain (Express.js)

Módulo backend para la Prueba de Concepto (POC) que expone endpoints REST e interactúa con contratos inteligentes en la red Blockchain utilizando `ethers.js`.

## Estructura

```text
api/
├── src/
│   ├── config/             # Configuración centralizada
│   ├── controllers/        # Controladores de las rutas
│   ├── middlewares/        # Middlewares de Express
│   ├── routes/             # Definición de rutas
│   ├── services/           # Lógica de conexión con Blockchain
│   └── server.js           # Inicialización del servidor
├── .env.example
├── package.json
└── README.md
```

## Instalación y Ejecución

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

4. Ejecutar en modo producción:
   ```bash
   npm start
   ```

## Endpoints Principales

- `GET /`: Mensaje de bienvenida y listado básico de endpoints.
- `GET /api/health`: Estado de salud de la API.
