/*
 - drizzle.config.ts: Defines the connection details, schema path, and migration settings for Drizzle ORM CLI.
 - This config file is required for running Drizzle tools like migrations and code generation.
*/
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
export default defineConfig({
  schema: "./lib/db/schema/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
