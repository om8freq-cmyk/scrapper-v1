const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  console.log("Connecting to local PostgreSQL database via pg adapter...");
  const connectionString = "postgresql://postgres:@localhost:5432/postgres";
  
  const client = new Client({ connectionString });
  await client.connect();
  console.log("pg connected! Initializing Prisma client...");
  
  const adapter = new PrismaPg(client);
  const prisma = new PrismaClient({ adapter });
  
  console.log("Querying leads...");
  const leads = await prisma.lead.findMany();
  console.log(`Fetched ${leads.length} leads locally!`);
  console.log(leads);
  
  await prisma.$disconnect();
  await client.end();
}

main().catch(err => {
  console.error("Local connection failed:", err);
});
