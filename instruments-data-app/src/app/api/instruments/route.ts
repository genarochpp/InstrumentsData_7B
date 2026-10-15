import { NextResponse } from "next/server";
import { ensureInstrumentsTable, getSql } from "@/lib/db";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  console.error("Instrument API error:", error);
  const missingConnection =
    error instanceof Error && error.message.startsWith("Falta POSTGRES_URL");
  return NextResponse.json(
    {
      error: missingConnection
        ? "Conecta Neon Postgres y configura POSTGRES_URL para usar el inventario."
        : "No se pudo acceder al inventario. Revisa la conexión de la base de datos.",
    },
    { status: missingConnection ? 503 : 500 },
  );
}

export async function GET() {
  try {
    await ensureInstrumentsTable();
    const sql = getSql();
    const instruments = await sql`
      SELECT id, person_name, instrument_name, part_number, serial_number,
        photo_url, created_at, updated_at
      FROM instruments
      ORDER BY updated_at DESC
    `;
    return NextResponse.json(instruments);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const personName = String(body.personName ?? "").trim();
    const instrumentName = String(body.instrumentName ?? "").trim();
    const partNumber = String(body.partNumber ?? "").trim();
    const serialNumber = String(body.serialNumber ?? "").trim();
    const photoUrl = String(body.photoUrl ?? "").trim();

    if (!personName || !instrumentName || !partNumber || !serialNumber) {
      return NextResponse.json(
        { error: "Completa todos los campos obligatorios." },
        { status: 400 },
      );
    }
    if (personName.length > 160 || instrumentName.length > 160 || partNumber.length > 100 || serialNumber.length > 100) {
      return NextResponse.json(
        { error: "Uno o más campos exceden la longitud permitida." },
        { status: 400 },
      );
    }

    await ensureInstrumentsTable();
    const sql = getSql();
    const [instrument] = await sql`
      INSERT INTO instruments (person_name, instrument_name, part_number, serial_number, photo_url)
      VALUES (${personName}, ${instrumentName}, ${partNumber}, ${serialNumber}, ${photoUrl || null})
      RETURNING id, person_name, instrument_name, part_number, serial_number,
        photo_url, created_at, updated_at
    `;

    return NextResponse.json(instrument, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}