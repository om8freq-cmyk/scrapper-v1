const { Client } = require('pg');

async function testPassword(password) {
  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@localhost:5432/postgres`;
  const client = new Client({ connectionString });
  try {
    console.log(`Testing password: "${password}"...`);
    await client.connect();
    console.log(`Success! Password "${password}" works.`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for "${password}":`, err.message);
    return false;
  }
}

async function main() {
  const passwords = ["Lighter@#$qwert", "postgres", "admin", "1234", "password", "root", ""];
  for (const pwd of passwords) {
    const success = await testPassword(pwd);
    if (success) {
      console.log(`Found working password: "${pwd}"`);
      break;
    }
  }
}

main().catch(err => console.error(err));
