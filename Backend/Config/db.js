import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Robust .env loading (works from any directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });
/* 

  Note: Based on file structure 
    -> Current File: .../Backend/Models/urlModel.model.js
    -> __dirname:    .../Backend/Models
    -> ../           .../Backend
    -> ../../        .../ (Project Root where .env is)

*/

const DB_NAME = process.env.DB_NAME || "url_shortener";

const serverConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
};

// Step-1: Connect to MySQL Server (without database) to ensure DB exists
try {
  const tempConn = await mysql.createConnection(serverConfig);
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await tempConn.end();
} catch (err) {
  console.log(
    "Skipping DB creation (Standard for managed services like Aiven/Clever Cloud)",
  );
}

// Step-2: Connect to the specific Database
const db = await mysql.createConnection({ ...serverConfig, database: DB_NAME });
console.log(`Connected to MySQL database: ${DB_NAME}`);

// Step-2: Initialize Table
await db.execute(`
  CREATE TABLE IF NOT EXISTS links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url TEXT NOT NULL,
    shortcode VARCHAR(50) UNIQUE,
    clicks INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log("Database table 'links' is ready.");

export default db;