import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { InstrumentRecord } from "@/lib/db";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "instruments.json");
let writeQueue: Promise<void> = Promise.resolve();

async function readRecords(): Promise<InstrumentRecord[]> {
  try {
    const contents = await readFile(dataFile, "utf8");
    const records: unknown = JSON.parse(contents);
    return Array.isArray(records) ? (records as InstrumentRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeRecords(records: InstrumentRecord[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  const { rename } = await import("node:fs/promises");
  await rename(temporaryFile, dataFile);
}

async function updateRecords<T>(operation: (records: InstrumentRecord[]) => T) {
  const result = writeQueue.then(async () => {
    const records = await readRecords();
    const value = operation(records);
    await writeRecords(records);
    return value;
  });
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function listLocalInstruments() {
  await writeQueue;
  return (await readRecords()).sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

export function createLocalInstrument(input: Omit<InstrumentRecord, "id" | "created_at" | "updated_at">) {
  return updateRecords((records) => {
    const now = new Date().toISOString();
    const instrument: InstrumentRecord = {
      ...input,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };
    records.push(instrument);
    return instrument;
  });
}

export function updateLocalInstrument(
  id: string,
  input: Omit<InstrumentRecord, "id" | "created_at" | "updated_at">,
) {
  return updateRecords((records) => {
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return null;
    const previous = records[index];
    const updated: InstrumentRecord = {
      ...previous,
      ...input,
      updated_at: new Date().toISOString(),
    };
    records[index] = updated;
    return { previous, updated };
  });
}

export function deleteLocalInstrument(id: string) {
  return updateRecords((records) => {
    const index = records.findIndex((record) => record.id === id);
    if (index === -1) return null;
    return records.splice(index, 1)[0];
  });
}
