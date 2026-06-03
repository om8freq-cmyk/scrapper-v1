const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const prisma = new PrismaClient({});

async function main() {
  console.log("Connecting to Supabase Database natively via Prisma bracketed IPv6...");
  console.log("Using Database URL:", process.env.DATABASE_URL);
  const leads = await prisma.lead.findMany();
  console.log(`Successfully fetched ${leads.length} leads natively!`);
  console.log(leads);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Native connection failed:", err);
});
