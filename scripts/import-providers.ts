import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from '../src/db/client.js';
import { providers, notes, statuses, users } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const FLAGS: Record<string, string> = {};
const POSITIONAL: string[] = [];
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, ...rest] = a.slice(2).split('=');
    FLAGS[k] = rest.join('=') || 'true';
  } else {
    POSITIONAL.push(a);
  }
}

const CSV_PATH = resolve(POSITIONAL[0] || resolve(__dirname, '..', '..', '..', 'providers.csv'));
const DRY_RUN = FLAGS.dryRun === 'true' || FLAGS.dry === 'true';
const BATCH_SIZE = 1000;

const DIRECT_MAP: Record<string, string> = {
  NPI: 'npi',
  FIRST: 'firstName',
  MID: 'middleName',
  LAST: 'lastName',
  SUFFIX: 'suffix',
  SPECIALTY: 'specialization',
  PHONE: 'phone',
  EMAIL: 'email',
};

const NOTE_FIELDS = [
  'TITLE', 'GENDER', 'SPECIALTY CODE', 'SPECIALTY2',
  'COUNTY', 'MSA', 'FAX', 'LICENSE NUMBER', 'LICENSE STATE',
  'MEDICAL SCHOOL', 'RESIDENCY TRAINING', 'GRADUATION YEAR', 'CERTIFICATIONS',
];

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
    else cur += ch;
  }
  fields.push(cur);
  return fields;
}

function getVal(row: string[], header: string[], col: string): string {
  const idx = header.indexOf(col);
  return idx === -1 ? '' : row[idx];
}

function buildAddressLine(row: string[], header: string[]): string {
  const parts: string[] = [];
  const a1 = getVal(row, header, 'ADDRESS1');
  const a2 = getVal(row, header, 'ADDRESS2');
  const city = getVal(row, header, 'CITY');
  const state = getVal(row, header, 'STATE');
  const zip = getVal(row, header, 'ZIP');
  if (a1) parts.push(a1);
  if (a2) parts.push(a2);
  const suffix = [city, state, zip].filter(Boolean).join(' ');
  if (suffix) parts.push(suffix);
  return parts.length ? `Address: ${parts.join(', ')}` : '';
}

function buildNoteText(row: string[], header: string[]): string {
  const lines: string[] = [];

  const addr = buildAddressLine(row, header);
  if (addr) lines.push(addr);

  for (const fieldName of NOTE_FIELDS) {
    const val = getVal(row, header, fieldName);
    if (!val) continue;
    lines.push(`${fieldName}: ${val}`);
  }

  return lines.join('<br/>');
}

function sanitizePhone(val: string): string {
  return val.replace(/\D/g, '');
}

function buildDirectPayload(row: string[], header: string[]): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const [csvCol, dbCol] of Object.entries(DIRECT_MAP)) {
    let val = getVal(row, header, csvCol);
    if (val) {
      if (dbCol === 'phone') val = sanitizePhone(val);
      payload[dbCol] = val;
    }
  }
  return payload;
}

async function main() {
  const db = initDb({
    MYSQL_HOST: FLAGS.host,
    MYSQL_USER: FLAGS.user,
    MYSQL_PASSWORD: FLAGS.password,
    MYSQL_DATABASE: FLAGS.database
  });

  const [systemUser] = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.firstName, 'System'), eq(users.lastName, 'Import')))
    .execute();

  if (!systemUser) {
    console.error('User "System Import" not found. Ensure a user with firstName="System" and lastName="Import" exists.');
    process.exit(1);
  }
  const USER_ID = systemUser.id;

  const [dunhillStatus] = await db.select({ id: statuses.id })
    .from(statuses)
    .where(eq(statuses.status, 'Dunhill'))
    .execute();

  if (!dunhillStatus) {
    console.error('Status "Dunhill" not found. Ensure a status with value "Dunhill" exists.');
    process.exit(1);
  }
  const DUNHILL_STATUS_ID = dunhillStatus.id;

  let totalRows = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let notesCreated = 0;
  let errors = 0;

  const rl = createInterface({
    input: createReadStream(CSV_PATH, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let header: string[] = [];
  let lineNum = 0;
  let batch: Array<{ fields: string[]; lineNum: number }> = [];

  function buildUpdateData(record: any, directPayload: Record<string, string>): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [dbCol, val] of Object.entries(directPayload)) {
      const currentVal = (record as any)[dbCol];
      if (currentVal === null || currentVal === '') {
        data[dbCol] = val;
      }
    }
    if (record.statusId !== DUNHILL_STATUS_ID) {
      data.statusId = DUNHILL_STATUS_ID;
    }
    return data;
  }

  async function processBatch(rows: Array<{ fields: string[]; lineNum: number }>) {
    await Promise.all(rows.map(async ({ fields, lineNum }) => {
      const npi = getVal(fields, header, 'NPI');

      if (!npi) {
        skipped++;
        return;
      }

      const noteText = buildNoteText(fields, header);
      const directPayload = buildDirectPayload(fields, header);

      try {
        const existing = await db.select().from(providers).where(eq(providers.npi, npi)).execute();
        const record = existing[0];

        if (record) {
          const updateData = buildUpdateData(record, directPayload);
          const hasChanges = Object.keys(updateData).length > 0;

          if (hasChanges) {
            if (!DRY_RUN) {
              await db.update(providers)
                .set(updateData)
                .where(eq(providers.id, record.id))
                .execute();
              console.log(`Row ${lineNum} (NPI ${npi}): updated provider ID ${record.id}`);
            }
            updated++;
          }

          if (noteText) {
            if (!DRY_RUN) {
              if ((await db.select().from(notes).where(eq(notes.providerId, record.id)).execute()).length === 0) {
                await db.insert(notes).values({
                  providerId: record.id,
                  userId: USER_ID,
                  note: noteText,
                }).execute();
              }
              notesCreated++;
              console.log(`Row ${lineNum} (NPI ${npi}): added note for provider ID ${record.id}`);
            }
          }
        } else {
          if (!directPayload.firstName || !directPayload.lastName) {
            console.warn(`Row ${lineNum} (NPI ${npi}): missing firstName or lastName, skipping insert`);
            skipped++;
            return;
          }

          if (!DRY_RUN) {
            const result = await db.insert(providers).values({
              ...directPayload,
              statusId: DUNHILL_STATUS_ID,
            } as any).execute();
            const newId = result[0].insertId;

            if (noteText) {
              await db.insert(notes).values({
                providerId: newId,
                userId: USER_ID,
                note: noteText,
              }).execute();
              notesCreated++;
            }

            console.log(`Row ${lineNum} (NPI ${npi}): created provider ID ${newId}${noteText ? ' with note' : ''}`);
          } else if (noteText) {
            notesCreated++;
          }
          created++;
        }
      } catch (e) {
        errors++;
        console.error(`Error processing row ${lineNum} (NPI ${npi}):`, (e as Error).message);
      }
    }));
  }

  for await (const line of rl) {
    lineNum++;
    if (line.trim().length === 0) continue;

    const fields = parseCsvLine(line);

    if (header.length === 0) {
      header = fields;
      continue;
    }

    totalRows++;

    batch.push({ fields, lineNum });

    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
  }

  console.log('\n--- Import Complete ---');
  console.log(`Total rows processed: ${totalRows}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Notes created: ${notesCreated}`);
  console.log(`Skipped (no NPI or missing fields): ${skipped}`);
  console.log(`Errors: ${errors}`);
  if (DRY_RUN) console.log('(dry run — no changes written)');

  process.exit(errors > 0 ? 1 : 0);
}

main();
