import { neon } from "@neondatabase/serverless";

export type InstrumentRecord = {
  id: string;
  person_name: string;
  instrument_name: string;
  part_number: string;
  serial_number: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export function getSql() {
  const connectionString =
    process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta POSTGRES_URL. Conecta una base de datos Neon desde Vercel Marketplace.",
    );
  }

  return neon(connectionString);
}

let tableReady: Promise<unknown> | undefined;

export function ensureInstrumentsTable() {
  if (!tableReady) {
    const sql = getSql();
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS instruments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        person_name VARCHAR(160) NOT NULL,
        instrument_name VARCHAR(160) NOT NULL,
        part_number VARCHAR(100) NOT NULL,
        serial_number VARCHAR(100) NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  }

  return tableReady;
}