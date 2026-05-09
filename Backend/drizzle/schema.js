import { relations } from "drizzle-orm";
import {
  int,
  mysqlTable,
  timestamp,
  varchar,
  boolean,
  text,
} from "drizzle-orm/mysql-core";

// "----------------💡 Schema for Users data table -----------"
export const userTable = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isEmailValid: boolean("is_email_valid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// "----------------💡 Schema for Email Vrification table -----------"
export const emailVerificationTable = mysqlTable("email_verification", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" })
    .unique(), // one active token per user
  token: varchar("token", { length: 8 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// "----------------💡Schema for URL table ------------------"
export const urlTable = mysqlTable("shortLinks", {
  id: int("id").primaryKey().autoincrement(),
  shortCode: varchar("short_code", { length: 225 }).unique().notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  clicks: int("clicks").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId: int("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }), //{ This is foregin key which conncts to the user table}
});

// "----------------💡Hybrid Authentication approach.--------------"
// Schema for Refresh_Tocken
export const sessionTable = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  valid: boolean("valid").default(true).notNull(),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// "------------💡Defining the relation between the tables. ---------"
// {1. A single user can have multiple short urls and multiple sessions.}
export const usersRelation = relations(userTable, ({ many }) => ({
  shortLinks: many(urlTable),
  session: many(sessionTable),
}));

// {2. A single short link belongs to a single user.}
export const urlRelation = relations(urlTable, ({ one }) => ({
  user: one(userTable, {
    fields: [urlTable.userId],
    references: [userTable.id],
  }),
}));

// {3. A single session belongs to a single user only.}
export const sessionRelation = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId], // Foreign Key
    references: [userTable.id],
  }),
}));
