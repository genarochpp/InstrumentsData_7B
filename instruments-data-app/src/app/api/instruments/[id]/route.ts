import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ensureInstrumentsTable, getSql } from "@/lib/db";
import { deleteLocalInstrument, updateLocalInstrument } from "@/lib/local-store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Registro no válido." }, { status: 400 });
  }

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

    if (process.env.NODE_ENV !== "production" && !process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      const result = await updateLocalInstrument(id, {
        person_name: personName,
        instrument_name: instrumentName,
        part_number: partNumber,
        serial_number: serialNumber,
        photo_url: photoUrl || null,
      });
      if (!result) {
        return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });
      }
      return NextResponse.json(result.updated);
    }

    await ensureInstrumentsTable();
    const sql = getSql();
    const [previous] = await sql`
      SELECT photo_url FROM instruments WHERE id = ${id}
    `;
    if (!previous) {
      return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });
    }
    const [instrument] = await sql`
      UPDATE instruments
      SET person_name = ${personName}, instrument_name = ${instrumentName},
        part_number = ${partNumber}, serial_number = ${serialNumber},
        photo_url = ${photoUrl || null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, person_name, instrument_name, part_number, serial_number,
        photo_url, created_at, updated_at
    `;

    if (!instrument) {
      return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });
    }
    if (previous.photo_url && previous.photo_url !== instrument.photo_url && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(previous.photo_url);
      } catch (error) {
        console.error("Could not remove replaced instrument photo:", error);
      }
    }
    return NextResponse.json(instrument);
  } catch (error) {
    console.error("Instrument update error:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el registro." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Registro no válido." }, { status: 400 });
  }

  try {
    if (process.env.NODE_ENV !== "production" && !process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      const instrument = await deleteLocalInstrument(id);
      if (!instrument) {
        return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    await ensureInstrumentsTable();
    const sql = getSql();
    const [instrument] = await sql`
      DELETE FROM instruments WHERE id = ${id} RETURNING photo_url
    `;

    if (!instrument) {
      return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });
    }

    if (instrument.photo_url && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(instrument.photo_url);
      } catch (error) {
        console.error("Could not remove instrument photo:", error);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Instrument delete error:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el registro." },
      { status: 500 },
    );
  }
}