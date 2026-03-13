import { pgTable, text, serial, timestamp, integer, boolean, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const moduleKeyEnum = pgEnum("module_key", ["M1", "M2", "M3"]);

export const moduleSettingsTable = pgTable("module_settings", {
  moduleKey: moduleKeyEnum("module_key").primaryKey(),
  title: text("title").notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const moduleExtensionsTable = pgTable(
  "module_extensions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id),
    moduleKey: moduleKeyEnum("module_key").notNull(),
    extendedEndAt: timestamp("extended_end_at").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("ext_user_module").on(t.userId, t.moduleKey)],
);

export const moduleSubmissionsTable = pgTable(
  "module_submissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id),
    moduleKey: moduleKeyEnum("module_key").notNull(),
    score: integer("score").notNull().default(0),
    maxScore: integer("max_score").notNull(),
    submittedAt: timestamp("submitted_at"),
    submissionJson: text("submission_json"),
  },
  (t) => [unique("sub_user_module").on(t.userId, t.moduleKey)],
);

export const simulationRunsTable = pgTable("simulation_runs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  moduleKey: moduleKeyEnum("module_key").notNull(),
  runNumber: integer("run_number").notNull(),
  decisionsJson: text("decisions_json").notNull(),
  kpiJson: text("kpi_json").notNull(),
  score: integer("score").notNull().default(0),
  isFinal: boolean("is_final").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const configTable = pgTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type ModuleSettings = typeof moduleSettingsTable.$inferSelect;
export type ModuleExtension = typeof moduleExtensionsTable.$inferSelect;
export type ModuleSubmission = typeof moduleSubmissionsTable.$inferSelect;
export type SimulationRun = typeof simulationRunsTable.$inferSelect;

export const insertModuleExtensionSchema = createInsertSchema(moduleExtensionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertModuleExtension = z.infer<typeof insertModuleExtensionSchema>;
