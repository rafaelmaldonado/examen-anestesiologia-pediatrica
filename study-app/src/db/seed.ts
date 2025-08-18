import { db, pool } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not set in .env.local');
  }

  console.log('--- Create Admin User ---');
  const email = await new Promise<string>(resolve => {
    rl.question('Enter admin email: ', resolve);
  });

  const password = await new Promise<string>(resolve => {
    rl.question('Enter admin password (will be hashed): ', resolve);
  });

  rl.close();

  if (!email || !password) {
    console.error('Email and password cannot be empty.');
    process.exit(1);
  }

  console.log(`\nCreating admin user for ${email}...`);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      email,
      passwordHash,
    });
    console.log('✅ Admin user created successfully!');
  } catch (error: any) {
    if (error.code === '23505') { // Postgres unique violation
        console.error('❌ Error: A user with this email already exists.');
    } else {
        console.error('❌ Failed to create admin user:', error);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Connection pool closed.');
  }
}

main();
