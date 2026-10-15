# Arco · Inventario de instrumentos

Aplicación CRUD en español para registrar personas, instrumentos, números de parte y serie, y fotografías. Está construida con Next.js, Neon Postgres (integración de base de datos de Vercel Marketplace) y Vercel Blob para las imágenes.

## Requisitos

- Node.js 20.9 o posterior.
- Una base Neon Postgres conectada al proyecto de Vercel.
- Un almacén Vercel Blob conectado al proyecto.

## Desarrollo local

1. Copia `.env.example` como `.env.local`.
2. Completa `POSTGRES_URL` y `BLOB_READ_WRITE_TOKEN` con los valores de las integraciones. No publiques estos secretos.
3. Desde esta carpeta, ejecuta `npm install` y `npm run dev`.
4. Abre `http://localhost:3000`. La tabla se crea automáticamente en la primera petición; el DDL está también en `db/schema.sql`.

La app acepta `POSTGRES_URL` o `DATABASE_URL` para la conexión de Neon.

## Despliegue en Vercel

1. Importa el repositorio en Vercel y configura **Root Directory** como `instruments-data-app` (la carpeta que contiene este README y `package.json`).
2. En Vercel Storage/Marketplace, crea y conecta una base **Neon Postgres** al proyecto y un almacén **Blob**.
3. Confirma que las integraciones hayan añadido `POSTGRES_URL` y `BLOB_READ_WRITE_TOKEN` al entorno de producción (y a Preview/Development si se necesitan).
4. Selecciona Node.js 20.x en Project Settings → Build and Development Settings. La versión mínima configurada para el proyecto es Node 20.9.
5. Despliega. No hace falta ejecutar migraciones manuales para iniciar: la tabla `instruments` se crea al primer acceso a la API.

Endpoints CRUD: `GET/POST /api/instruments`, `PATCH/DELETE /api/instruments/:id`; carga de imagen: `POST /api/upload`. Se admiten fotos JPG, PNG y WEBP de hasta 4 MB.

## Seguridad antes de producción

La app no incluye inicio de sesión: las rutas CRUD son accesibles a quien pueda abrir el sitio. Antes de guardar datos reales, protege el proyecto con autenticación/autorización (o limita el acceso mediante controles de Vercel apropiados). Las fotos se guardan como blobs públicos, por lo que sus URL pueden ser compartidas.