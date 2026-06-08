// schema.ts
import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 20 }).notNull().unique(),
  // email: varchar().notNull().unique(),
  // password_hash: varchar().notNull(),
  course: varchar({ length: 20 }).notNull(),
  semester: integer().notNull(),
  // currentStack: varchar({ length: 20 }).array().notNull(),
  bio: text().notNull(),
});
