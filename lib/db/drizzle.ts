/*
src/db/drizzle.ts
This file is the main entry point for the application's database client.
It is used to connect to the database and execute queries when the app is running by using `db object` that is initialized in this file.
*/
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema/schema";

config({ path: ".env" }); // or .env.local
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// export const db = drizzle(process.env.DATABASE_URL!);
export const db = drizzle({
  connection: connectionString,
  casing: "snake_case",
  schema,
});
