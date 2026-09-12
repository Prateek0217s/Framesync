/**
 * Backfill tenant ownership onto pre-existing data.
 *
 * Before this change there was no ownership concept at all, so every Client and
 * Project in the database predates the `ownerId` field. Adding the field makes
 * those rows invisible to every account (the board filters on ownerId), so this
 * script stamps them with an owner once.
 *
 * Usage:
 *   node scripts/backfill-ownership.js <admin-email> [--dry-run]
 *
 * Safe to re-run: it only ever touches rows that have no owner yet.
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// "No owner yet" covers both never-set and explicitly-null rows.
const UNOWNED = { $in: [null, undefined] };

const usage = () => {
  console.error('Usage: node scripts/backfill-ownership.js <admin-email> [--dry-run]');
};

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const email = args.find((a) => !a.startsWith('--'));

  if (!email) {
    usage();
    process.exit(1);
  }

  await connectDB();

  const owner = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
  if (!owner) {
    console.error(
      `No admin account found for "${email}". Pass the email of the account that should own the existing data.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(
    `${dryRun ? '[dry run] ' : ''}Assigning unowned data to ${owner.email} (${owner._id})\n`
  );

  const unownedClients = await Client.countDocuments({ ownerId: UNOWNED });
  const unownedProjects = await Project.countDocuments({ ownerId: UNOWNED });
  console.log(`Unowned clients:  ${unownedClients}`);
  console.log(`Unowned projects: ${unownedProjects}\n`);

  if (dryRun) {
    console.log('[dry run] No changes written.');
    await mongoose.disconnect();
    return;
  }

  // 1. Clients first — projects derive their owner from their client, so the
  //    client must be settled before we can pair them correctly.
  const clientResult = await Client.updateMany(
    { ownerId: UNOWNED },
    { $set: { ownerId: owner._id } }
  );

  // 2. Set each project's owner from its own client. Doing this per-client
  //    (rather than blanket-assigning) keeps the denormalized ownerId correct
  //    even if this is ever re-run with a different target account.
  const ownedClients = await Client.find({
    ownerId: { $nin: [null, undefined] },
  }).select('_id ownerId');

  let pairedProjects = 0;
  for (const client of ownedClients) {
    const result = await Project.updateMany(
      { clientId: client._id, ownerId: UNOWNED },
      { $set: { ownerId: client.ownerId } }
    );
    pairedProjects += result.modifiedCount;
  }

  // 3. Fallback: a project whose client is missing entirely (shouldn't happen –
  //    Project.clientId is required — but never leave a row unreachable).
  const orphanResult = await Project.updateMany(
    { ownerId: UNOWNED },
    { $set: { ownerId: owner._id } }
  );

  console.log(`Clients updated:       ${clientResult.modifiedCount}`);
  console.log(`Projects paired:       ${pairedProjects}`);
  console.log(`Orphan projects set:   ${orphanResult.modifiedCount}`);

  const remainingClients = await Client.countDocuments({ ownerId: UNOWNED });
  const remainingProjects = await Project.countDocuments({ ownerId: UNOWNED });
  console.log(`\nRemaining unowned — clients: ${remainingClients}, projects: ${remainingProjects}`);

  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error(`Backfill failed: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
