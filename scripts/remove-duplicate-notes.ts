import { initDb } from '../src/db/client.js';
import { notes } from '../src/db/schema.js';
import { sql } from 'drizzle-orm';

const args = process.argv.slice(2);
const FLAGS: Record<string, string> = {};
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, ...rest] = a.slice(2).split('=');
    FLAGS[k] = rest.join('=') || 'true';
  }
}

const DRY_RUN = FLAGS.dryRun === 'true' || FLAGS.dry === 'true';

async function main() {
  const db = initDb({
    MYSQL_HOST: FLAGS.host,
    MYSQL_USER: FLAGS.user,
    MYSQL_PASSWORD: FLAGS.password,
    MYSQL_DATABASE: FLAGS.database,
  });

  // --- 1. Count duplicates (DRY RUN safe)
  const rows = await db.execute<{ count: number }[]>(sql`
    SELECT COUNT(*) AS count
    FROM ${notes} n1
    JOIN ${notes} n2
      ON n1.id > n2.id
     AND n1.user_id = n2.user_id
     AND n1.note = n2.note
     AND (
          n1.provider_id <=> n2.provider_id
       OR n1.practice_id <=> n2.practice_id
     )
  `);

  const count = rows[0][0].count;

  if (count === 0) {
    console.log('No duplicate notes found.');
    return;
  }

  console.log(`Found ${count} duplicate note(s).`);

  // --- 2. Delete duplicates (fastest possible MySQL method)
  if (!DRY_RUN && count > 0) {
    await db.execute(sql`
      DELETE n1
      FROM ${notes} n1
      JOIN ${notes} n2
        ON n1.id > n2.id
       AND n1.user_id = n2.user_id
       AND n1.note = n2.note
       AND (
            n1.provider_id <=> n2.provider_id
         OR n1.practice_id <=> n2.practice_id
       )
    `);

    console.log(`Deleted ${count} duplicate note(s).`);
  } else if (DRY_RUN) {
    console.log('(dry run — no changes written)');
  }

  return 0;
}

main();
