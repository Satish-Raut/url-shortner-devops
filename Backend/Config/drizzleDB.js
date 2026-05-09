import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";

// The Drizzle and MySQl connection is created here
// console.log("Using DB:", process.env.DATABASE_URL);
export const db = drizzle(process.env.DATABASE_URL);
