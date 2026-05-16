/**
 * Script per creare o aggiornare l'account admin.
 * Uso: node createAdmin.js
 * Variabili d'ambiente opzionali:
 *   ADMIN_USERNAME  (default: admin)
 *   ADMIN_EMAIL     (default: admin@biblioteca.it)
 *   ADMIN_PASSWORD  (default: Admin1234!)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@biblioteca.it';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234!';

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/biblioteca';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existing) {
      // Upgrade existing user to admin
      existing.role = 'admin';
      existing.username = ADMIN_USERNAME;
      existing.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await existing.save();
      console.log(`✅ Admin account updated: ${ADMIN_EMAIL}`);
    } else {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({ username: ADMIN_USERNAME, email: ADMIN_EMAIL, passwordHash, role: 'admin' });
      console.log(`✅ Admin account created: ${ADMIN_EMAIL}`);
    }

    console.log(`\n📋 Credenziali admin:`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n⚠️  Cambia la password dopo il primo accesso!\n`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
