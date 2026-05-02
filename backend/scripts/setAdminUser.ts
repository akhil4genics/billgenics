/**
 * Promote a user to admin by email.
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/setAdminUser.ts user@example.com
 *   npx tsx scripts/setAdminUser.ts user@example.com false   # revoke admin
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';

async function main() {
  const email = process.argv[2];
  const flag = process.argv[3] !== 'false';

  if (!email) {
    console.error('Usage: npx tsx scripts/setAdminUser.ts <email> [true|false]');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { adminUser: flag } },
    { new: true }
  ).lean();

  if (!result) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  console.log(`✓ ${result.email} adminUser = ${flag}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
