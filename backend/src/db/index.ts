import "dotenv/config";
import net from "node:net";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

// Uzoq (us-east-1) DB serveriga TCP handshake Node'ning standart 250ms
// happy-eyeballs limitidan uzoqroq davom etadi va ETIMEDOUT beradi.
net.setDefaultAutoSelectFamilyAttemptTimeout(3000);

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
