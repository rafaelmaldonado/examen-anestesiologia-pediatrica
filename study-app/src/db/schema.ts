import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// Users table for admin login
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

// Certifications (or Sections)
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  isAdobe: boolean("is_adobe").default(false).notNull(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id")
    .notNull()
    .references(() => certifications.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
});

// Options for each question
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
  explanation: text("explanation"), // To explain why this is the correct/incorrect answer
});

// Test results to track progress
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  certificationId: integer("certification_id")
    .notNull()
    .references(() => certifications.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // Percentage, e.g., 85
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
