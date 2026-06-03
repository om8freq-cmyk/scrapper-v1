const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  console.log("Connecting to local PostgreSQL database via pg Pool adapter...");
  const connectionString = "postgresql://postgres:postgres@localhost:5432/postgres";
  
  const pool = new Pool({ connectionString });
  console.log("pg Pool created. Initializing Prisma client...");
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  console.log("Querying leads...");
  try {
    const leads = await prisma.lead.findMany();
    console.log(`Fetched ${leads.length} leads locally!`);
    console.log(leads);
  } catch (err) {
    console.error("Querying leads failed:", err);
  }
  
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error("Local connection failed:", err);
});
