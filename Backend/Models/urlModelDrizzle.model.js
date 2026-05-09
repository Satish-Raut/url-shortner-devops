import { eq, gt, sql } from "drizzle-orm";
import { db } from "../Config/drizzleDB.js";
import {
  emailVerificationTable,
  sessionTable,
  urlTable,
  userTable,
} from "../drizzle/schema.js";
import { CURRENT_TIME, EMAIL_EXPIRY_TIME } from "../Config/constants.js";

// Get all links (for the frontend list)
export const getAllLinks = async (id) => {
  console.log("Data request for the user with id: ", id);
  const data = await db.select().from(urlTable).where(eq(urlTable.userId, id));
  return data;
};

// Find one link by shortcode
export const findLinkByShortcode = async (shortcode) => {
  const links = await db
    .select()
    .from(urlTable)
    .where(eq(urlTable.shortCode, shortcode));

  return links[0] || null;
};

// Save a new link
export const saveLink = async (url, shortcode, id) => {
  const insertUrl = await db.insert(urlTable).values({
    url: url,
    shortCode: shortcode,
    userId: id,
  });

  return insertUrl;
};

export const incrementClicks = async (shortcode) => {
  await db
    .update(urlTable)
    .set({ clicks: sql`${urlTable.clicks} + 1` })
    .where(eq(urlTable.shortCode, shortcode));
};

// Delete a link by ID
export const deleteLink = async (id) => {
  const result = await db.delete(urlTable).where(eq(urlTable.id, id));
  return result;
};

// Update a link by ID
export const updateLink = async (id, newUrl, newShortCode) => {
  const result = await db
    .update(urlTable)
    .set({
      url: newUrl,
      shortCode: newShortCode,
    })
    .where(eq(urlTable.id, id));
  return result;
};

// Update userName by id
export const updateUserName = async (id, name) => {
  await db.update(userTable).set({ name: name }).where(eq(userTable.id, id));
};

// Get the session id for genereting a new access token
export const getSessionById = async (sessionId) => {
  const session = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.id, sessionId));

  return session;
};

// Get the user data by their id
export const findUserById = async (userId) => {
  const userData = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId));

  return userData;
};

// This function is basically used during Logout
export const clearUserSession = async (sessionId) => {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
};

export const insertEmailVarificationToken = async ({ userId, token }) => {
  // Remove any existing token for this specific user before generating a new one
  // because the schema enforces a unique constraint on userId.
  await db
    .delete(emailVerificationTable)
    .where(eq(emailVerificationTable.userId, userId));

  return await db.insert(emailVerificationTable).values({
    userId,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
  });
};
