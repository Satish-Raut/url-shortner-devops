import { eq } from "drizzle-orm";
import { db } from "../Config/drizzleDB.js";
import { userTable } from "../drizzle/schema.js";


// * New user data inserted into the database *
export const saveUserdata = async ({ name, email, password }) => {
  const insertData = await db
    .insert(userTable)
    .values({ name, email, password });
  console.log("User Data saved Successfully in the database.");

  return insertData;
};

// * get the user data by their email *
export const getUserByEmail = async ({ email }) => {
  const userData = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email));

  //   console.log(userData);
  return userData;
};

// * get the user data by their id *
export const getUserById = async ({ id }) => {
  const userData = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, id));

  //   console.log(userData);
  return userData;
};

