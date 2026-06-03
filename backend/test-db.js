process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dns = require('dns');
const originalLookup = dns.lookup;

dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (typeof options === 'object') {
    options = { ...options, family: 6 };
  } else {
    options = { family: 6 };
  }
  return originalLookup.call(this, hostname, options, callback);
};

const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function main() {
  console.log("Connecting to Supabase Database via direct IPv6 hostname with global DNS IPv6 patch...");
  
  const client = new Client({
    host: 'db.rnuqitvjoqdqbpzzuvwx.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Lighter@#$qwert',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  await client.connect();
  console.log("pg client connected. Initializing Prisma client...");
  
  const adapter = new PrismaPg(client);
  const prisma = new PrismaClient({ adapter });
  
  console.log("Prisma client initialized. Querying leads...");
  const leads = await prisma.lead.findMany();
  console.log(`Successfully fetched ${leads.length} leads from Supabase!`);
  console.log(leads);
  
  await prisma.$disconnect();
  await client.end();
}

main().catch(err => {
  console.error("Execution failed:", err);
});
