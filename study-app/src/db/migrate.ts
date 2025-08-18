import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { db, pool } from '@/db';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'src/db/migrations' });
  console.log('Migrations completed successfully!');
  // The pool must be closed when the script is finished, or it will hang
  await pool.end();
  console.log('Connection pool closed.');
}

main().catch(err => {
  console.error('Migration failed:');
  console.error(err);
  process.exit(1);
});
