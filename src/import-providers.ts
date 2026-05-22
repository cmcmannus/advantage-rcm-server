import { createReadStream } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { initDb } from "./db/client.js";
import { practices, providers, locations, practiceLocations, providerPracticeLocations, notes } from "./db/schema.js";
import { eq, and } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, "../../../providers.csv");
const BATCH_SIZE = 100;

const db = initDb();

const practiceCache = new Map<string, number>();
const providerCache = new Map<string, number>();

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function getOrCreatePractice(name: string, specialization: string | null): Promise<number> {
  const key = name.toLowerCase().trim();
  if (practiceCache.has(key)) return practiceCache.get(key)!;

  const existing = await db.select({ id: practices.id }).from(practices).where(eq(practices.name, name)).limit(1);
  if (existing.length > 0) {
    practiceCache.set(key, existing[0].id);
    return existing[0].id;
  }

  const result: any = await db.insert(practices).values({ name, specialization });
  const id = result[0].insertId;
  practiceCache.set(key, id);
  return id;
}

async function lookupLocation(address1: string, address2: string | null, city: string, state: string, zip: string): Promise<number | null> {
  const query = db.select({ id: locations.id }).from(locations).where(
    and(
      eq(locations.address1, address1),
      eq(locations.city, city),
      eq(locations.state, state),
      eq(locations.zip, zip),
    )
  ).limit(1).$dynamic();

  if (address2) {
    query.where(and(eq(locations.address2, address2)));
  }

  const existing = await query.execute();
  return existing.length > 0 ? existing[0].id : null;
}

async function getOrCreateProvider(npi: string, data: {
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  specialization: string | null;
  email: string | null;
  phone: string | null;
}): Promise<number> {
  if (providerCache.has(npi)) return providerCache.get(npi)!;

  const existing = await db.select({ id: providers.id }).from(providers).where(eq(providers.npi, npi)).limit(1);
  if (existing.length > 0) {
    providerCache.set(npi, existing[0].id);
    return existing[0].id;
  }

  const result: any = await db.insert(providers).values(data);
  const id = result[0].insertId;
  providerCache.set(npi, id);
  return id;
}

async function main() {
  const userId = process.argv[2] ? Number(process.argv[2]) : 1;

  const fileStream = createReadStream(CSV_PATH, { encoding: "utf-8" });
  const rl = createInterface({ input: fileStream });

  let headers: string[] = [];
  let rowCount = 0;
  let errorCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (headers.length === 0) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = values[i] ?? ""; });

    const npi = row["NPI"];
    const fullName = row["FULL NAME"];
    const firstName = row["FIRST"];
    const middleName = row["MID"] || null;
    const lastName = row["LAST"];
    const suffix = row["SUFFIX"] || null;
    const specialization = row["SPECIALTY"] || null;
    const address1 = row["ADDRESS1"] || null;
    const address2 = row["ADDRESS2"] || null;
    const city = row["CITY"] || null;
    const state = row["STATE"] || null;
    const zip = row["ZIP"] || null;
    const phone = row["PHONE"] || null;
    const email = row["EMAIL"] || null;
    const fax = row["FAX"] || null;

    try {
      const practiceId = await getOrCreatePractice(fullName, specialization);

      let locationId: number | null | undefined;
      if (address1 && city && state && zip) {
        locationId = await lookupLocation(address1, address2, city, state, zip);
        if (!locationId) {
          const locResult: any = await db.insert(locations).values({
            address1,
            address2: address2 || null,
            city,
            state,
            zip,
          });
          locationId = locResult[0].insertId;
        }
      }

      let practiceLocationId: number | undefined;
      if (locationId) {
        const plResult: any = await db.insert(practiceLocations).values({
          practiceId,
          locationId,
          phone: phone || null,
          fax: fax || null,
        });
        practiceLocationId = plResult[0].insertId;
      }

      const providerId = await getOrCreateProvider(npi, {
        firstName,
        middleName,
        lastName,
        suffix,
        specialization,
        email,
        phone,
      });

      if (practiceLocationId) {
        const existing = await db.select({ providerId: providerPracticeLocations.providerId })
          .from(providerPracticeLocations)
          .where(and(
            eq(providerPracticeLocations.providerId, providerId),
            eq(providerPracticeLocations.practiceLocationId, practiceLocationId)
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(providerPracticeLocations).values({
            providerId,
            practiceLocationId,
            isPrimary: 1,
          });
        }
      }

      const noteParts: string[] = [];
      const noteFields: [string, string][] = [
        ["TITLE", "Title"],
        ["GENDER", "Gender"],
        ["SPECIALTY CODE", "Specialty Code"],
        ["SPECIALTY2", "Specialty2"],
        ["LICENSE NUMBER", "License Number"],
        ["LICENSE STATE", "License State"],
        ["MEDICAL SCHOOL", "Medical School"],
        ["RESIDENCY TRAINING", "Residency Training"],
        ["GRADUATION YEAR", "Graduation Year"],
        ["CERTIFICATIONS", "Certifications"],
        ["MSA", "MSA"],
      ];

      for (const [csvCol, label] of noteFields) {
        const val = row[csvCol];
        if (val) {
          noteParts.push(`${label}: "${val}"`);
        }
      }

      if (noteParts.length > 0) {
        const noteContent = noteParts.join("\n");
        await db.insert(notes).values({
          practiceId,
          providerId,
          userId,
          note: noteContent,
        });
      }

      rowCount++;
      if (rowCount % BATCH_SIZE === 0) {
        console.log(`Processed ${rowCount} rows...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`Error processing NPI ${npi} (${fullName}):`, (err as Error).message);
    }
  }

  console.log(`\nImport complete. ${rowCount} rows processed, ${errorCount} errors.`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
