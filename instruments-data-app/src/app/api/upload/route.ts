import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Configura Vercel Blob con BLOB_READ_WRITE_TOKEN para habilitar las imágenes." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "La imagen debe ser JPG, PNG o WEBP." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 4 MB." },
        { status: 400 },
      );
    }

    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await put(`instruments/${Date.now()}-${safeName}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      url = blob.url;
    } else {
      const extensionByType: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const filename = `${randomUUID()}.${extensionByType[file.type]}`;
      const uploadDirectory = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(path.join(uploadDirectory, filename), Buffer.from(await file.arrayBuffer()));
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar la imagen." },
      { status: 500 },
    );
  }
}