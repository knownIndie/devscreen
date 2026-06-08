// schema.ts
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 20 }).notNull(),
  // email: varchar().notNull().unique(),
  // password_hash: varchar().notNull(),
  course: varchar({ length: 20 }).notNull(),
  currentStack: varchar({ length: 20 }).array().notNull(),
  bio: varchar({ length: 600 }).notNull(),
});
