import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "archived",
  "maintenance",
  "development",
  "planned",
]);

export const auditLogActionEnum = pgEnum("audit_log_action", [
  "create",
  "update",
  "delete",
  "reorder",
  "sync",
  "settings_change",
  "login",
  "logout",
]);

// ── Projects ───────────────────────────────────────────

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),

  // Identity
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description"),

  // GitHub link
  githubRepo: varchar("github_repo", { length: 200 }),
  githubOwner: varchar("github_owner", { length: 100 }),
  defaultBranch: varchar("default_branch", { length: 100 }).default("main"),

  // Branding
  colorPrimary: varchar("color_primary", { length: 7 }).default("#0000FF"),
  colorAccent: varchar("color_accent", { length: 7 }).default("#FF44CC"),
  colorBackground: varchar("color_background", { length: 7 }),
  iconUrl: text("icon_url"),
  iconEmoji: varchar("icon_emoji", { length: 10 }),

  // Organization
  status: projectStatusEnum("status").default("active").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  visible: boolean("visible").default(true).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),

  // URLs
  subdomainUrl: varchar("subdomain_url", { length: 500 }),
  productionUrl: varchar("production_url", { length: 500 }),

  // Custom data
  customSettings: jsonb("custom_settings")
    .$type<Record<string, unknown>>()
    .default({}),

  // Sync
  lastSyncedAt: timestamp("last_synced_at"),
  syncEnabled: boolean("sync_enabled").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Project Settings ───────────────────────────────────

export const projectSettings = pgTable(
  "project_settings",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 200 }).notNull(),
    value: text("value"),
    valueType: varchar("value_type", { length: 20 }).default("string"),
    category: varchar("category", { length: 100 }),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("project_settings_project_key_idx").on(
      table.projectId,
      table.key,
    ),
  ],
);

// ── User Preferences ───────────────────────────────────

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    key: varchar("key", { length: 200 }).notNull(),
    value: text("value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_preferences_user_key_idx").on(table.userId, table.key),
  ],
);

// ── GitHub Sync Cache ──────────────────────────────────

export const githubSyncCache = pgTable("github_sync_cache", {
  id: serial("id").primaryKey(),
  cacheKey: varchar("cache_key", { length: 500 }).notNull().unique(),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  owner: varchar("owner", { length: 100 }).notNull(),
  repo: varchar("repo", { length: 200 }),
  path: text("path"),
  responseData: jsonb("response_data").notNull(),
  etag: varchar("etag", { length: 200 }),
  ttlSeconds: integer("ttl_seconds").default(300).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Audit Log ──────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: auditLogActionEnum("action").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  entitySlug: varchar("entity_slug", { length: 200 }),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ──────────────────────────────────────────

export const projectsRelations = relations(projects, ({ many }) => ({
  settings: many(projectSettings),
}));

export const projectSettingsRelations = relations(
  projectSettings,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectSettings.projectId],
      references: [projects.id],
    }),
  }),
);
