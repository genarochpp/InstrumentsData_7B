# Chiarappa · Inventario de aviónica

Aplicación CRUD en español para gestionar equipos e instrumentos de aviónica, con responsable o técnico asignado, modelo, números de parte (P/N) y serie (S/N), y fotografías. Está construida con Next.js, Neon Postgres (integración de base de datos de Vercel Marketplace) y Vercel Blob para las imágenes.

## Requisitos

- Node.js 20.9 o posterior para el entorno de producción.
- Para producción: una base Neon Postgres y un almacén Vercel Blob conectados al proyecto de Vercel.

## Desarrollo local

1. Desde la raíz del repositorio, ejecuta `npm run dev` (o desde esta carpeta ejecuta `npm install` y `npm run dev`).
2. Abre `http://localhost:3000`. Sin variables de entorno la app usa un archivo local para los registros y `public/uploads` para las imágenes; no hace falta configurar una base de datos para probarla.
3. Para usar Neon/Blob también en desarrollo, copia `.env.example` a `.env.local` y completa las variables. No publiques estos secretos.

La app acepta `POSTGRES_URL` o `DATABASE_URL` para la conexión de Neon. La tabla se crea automáticamente en la primera petición; el DDL está también en `db/schema.sql`.

## Despliegue en Vercel

1. Importa `https://github.com/genarochpp/InstrumentsData_7B` en Vercel y configura **Root Directory** como `instruments-data-app`.
2. En Vercel Storage/Marketplace, crea y conecta Neon Postgres y Vercel Blob al proyecto.
3. Verifica que Vercel tenga `POSTGRES_URL` y `BLOB_READ_WRITE_TOKEN` en **Production** (y Preview/Development si los usarás allí). La app no usa almacenamiento local en producción.
4. Selecciona Node.js 20.x en Project Settings → Build and Development Settings. La versión mínima configurada para el proyecto es Node 20.9.
5. Despliega. No hacen falta migraciones manuales: la tabla `instruments` se crea en el primer acceso a la API.

Endpoints CRUD: `GET/POST /api/instruments`, `PATCH/DELETE /api/instruments/:id`; carga de imagen: `POST /api/upload`. Se admiten fotos JPG, PNG y WEBP de hasta 4 MB. Los nombres de tabla y campos conservan los identificadores internos actuales para no perder compatibilidad con los registros existentes.

## Seguridad antes de producción

La app no incluye inicio de sesión: las rutas CRUD son accesibles a quien pueda abrir el sitio. Antes de guardar datos reales, protege el proyecto con autenticación/autorización (o limita el acceso mediante controles de Vercel apropiados). Las fotos se guardan como blobs públicos, por lo que sus URL pueden ser compartidas.