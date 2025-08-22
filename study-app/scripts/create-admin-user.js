import { adminAuth } from '../src/lib/firebase/admin.js';

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node create-admin-user.js <email> <password>');
    console.error('Example: node create-admin-user.js admin@example.com mypassword123');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters long');
    process.exit(1);
  }

  try {
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      emailVerified: true,
    });

    console.log('✅ Successfully created admin user:');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', userRecord.email);
    console.log('   Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
    console.log('\n🔑 You can now login with:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.error('This email is already registered');
    }
  }
}

createAdminUser();
