const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  console.log("Seeding local database with realistic multi-tenant SaaS CRM and scraper data...");
  const connectionString = "postgresql://postgres:postgres@localhost:5432/postgres";
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  // Clean existing data to avoid unique constraints
  console.log("Clearing existing data...");
  await prisma.lead.deleteMany({});
  await prisma.scrapeJob.deleteMany({});
  
  // 1. Seed Scrape Jobs
  console.log("Seeding ScrapeJobs...");
  const job1 = await prisma.scrapeJob.create({
    data: {
      targetUrl: "https://www.activefitnessgyms.com/locations",
      status: "COMPLETED",
      leadsFound: 4,
      config: { selectors: { name: "h3.title", email: "span.email", phone: "a.phone" } },
      startedAt: new Date(Date.now() - 3600000 * 2),
      completedAt: new Date(Date.now() - 3600000 * 1.8),
    }
  });

  const job2 = await prisma.scrapeJob.create({
    data: {
      targetUrl: "https://www.mumbaicityhospitals.org/contact",
      status: "COMPLETED",
      leadsFound: 3,
      config: { selectors: { name: "div.doctor-name", email: "a.doc-email" } },
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3600000 * 0.9),
    }
  });

  const job3 = await prisma.scrapeJob.create({
    data: {
      targetUrl: "https://www.luxehotelgroup.com/events",
      status: "PENDING",
      leadsFound: 0,
      config: { selectors: { name: ".event-coordinator", email: ".contact-email" } },
    }
  });

  const job4 = await prisma.scrapeJob.create({
    data: {
      targetUrl: "https://www.retro-clothing-mall.com/tenants",
      status: "FAILED",
      leadsFound: 0,
      error: "Timeout of 30000ms exceeded while waiting for selector",
      startedAt: new Date(Date.now() - 1800000),
      completedAt: new Date(Date.now() - 1795000),
    }
  });

  // 2. Seed Leads
  console.log("Seeding Leads...");
  const leads = [
    {
      name: "Rajesh Kumar (Apollo Hospital Mumbai)",
      age: 42,
      email: "r.kumar@apollohospitals.org",
      phone: "+91-98765-43210",
      source: "https://www.mumbaicityhospitals.org/contact",
      status: "CONVERTED",
    },
    {
      name: "Dr. Ananya Sharma (Leelavati Hospital)",
      age: 38,
      email: "ananya.sharma@leelavati.in",
      phone: "+91-87654-32109",
      source: "https://www.mumbaicityhospitals.org/contact",
      status: "CONTACTED",
    },
    {
      name: "Amit Patel (Gold Gym Franchise)",
      age: 33,
      email: "amit.patel@goldsgym-mumbai.com",
      phone: "+91-76543-21098",
      source: "https://www.activefitnessgyms.com/locations",
      status: "EMAIL_SENT",
      emailSentAt: new Date(Date.now() - 3600000),
    },
    {
      name: "Sarah D'Souza (Fitness First Inorbit)",
      age: 29,
      email: "s.dsouza@fitnessfirst.co.in",
      phone: "+91-65432-10987",
      source: "https://www.activefitnessgyms.com/locations",
      status: "NEW",
    },
    {
      name: "Vikram Malhotra (Taj Lands End Events)",
      age: 45,
      email: "v.malhotra@tajhotels.com",
      phone: "+91-54321-09876",
      source: "https://www.luxehotelgroup.com/events",
      status: "EMAIL_QUEUED",
    },
    {
      name: "Sneha Reddy (Cult Fit Bandra)",
      age: 27,
      email: "sneha.reddy@cultfit.in",
      phone: "+91-43210-98765",
      source: "https://www.activefitnessgyms.com/locations",
      status: "NEW",
    },
    {
      name: "John Doe (Fortis Health Care)",
      age: 51,
      email: "j.doe@fortishealthcare.com",
      phone: "+91-32109-87654",
      source: "https://www.mumbaicityhospitals.org/contact",
      status: "EMAIL_FAILED",
    }
  ];

  for (const lead of leads) {
    await prisma.lead.create({ data: lead });
  }

  console.log("Clearing connections...");
  await prisma.$disconnect();
  await pool.end();
  console.log("Database seeded successfully!");
}

main().catch(err => {
  console.error("Failed to seed database:", err);
});
