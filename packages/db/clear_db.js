import pg from "pg";
const { Client } = pg;

async function clearDb() {
  const client = new Client({ connectionString: "postgresql://neondb_owner:npg_6oIwbkm8teZT@ep-super-rice-am8iip6l-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  console.log("Cleared database schema!");
  await client.end();
}

clearDb().catch(console.error);
