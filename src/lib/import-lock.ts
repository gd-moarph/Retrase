import { Client } from "pg";

export async function withImportLock<T>(source: string, task: () => Promise<T>): Promise<T | null> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const locked = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_lock(hashtext($1)) AS locked", [`retrase:${source}`]);
    if (!locked.rows[0]?.locked) return null;
    try {
      return await task();
    } finally {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [`retrase:${source}`]);
    }
  } finally {
    await client.end();
  }
}
