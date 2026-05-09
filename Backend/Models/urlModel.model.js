
import db from "../Config/db.js"

/**
 * DATABASE FUNCTIONS
 */

// Save a new link
export const saveLink = async (url, shortcode) => {
  const [result] = await db.execute(
    "INSERT INTO links (url, shortcode) VALUES (?, ?)",
    [url, shortcode],
  );
  // console.log(result);
  return result;
};

// Find one link by shortcode
export const findLinkByShortcode = async (shortcode) => {
  const [rows] = await db.execute("SELECT * FROM links WHERE shortcode = ?", [
    shortcode,
  ]);
  console.log(rows);
  return rows[0]; // Returns the first row or undefined
};

// Get all links (for the frontend list)
export const getAllLinks = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM links ORDER BY created_at DESC",
  );
  // console.log(rows);
  return rows;
};

// Update click count
export const incrementClicks = async (shortcode) => {
  await db.execute("UPDATE links SET clicks = clicks + 1 WHERE shortcode = ?", [
    shortcode,
  ]);
};

export default db;
