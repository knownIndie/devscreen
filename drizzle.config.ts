/*
 - drizzle.config.ts: Defines the connection details, schema path, and migration settings for Drizzle ORM CLI.
 - This config file is required for running Drizzle tools like migrations and code generation.
*/
import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: '.env' });

export default defineConfig({
  schema: "./app/db/schema/*.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

