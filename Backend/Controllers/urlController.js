import crypto from "crypto";
import { db } from "../Config/drizzleDB.js";
import { urlTable } from "../drizzle/schema.js";
import { eq, ne } from "drizzle-orm";

// {This imports for MySql}
// import {
//   saveLink,
//   findLinkByShortcode,
//   getAllLinks,
//   incrementClicks,
// } from "../Models/urlModel.model.js";

// {This imports for Prisma ORM}
// import {
//   saveLink,
//   findLinkByShortcode,
//   getAllLinks,
//   incrementClicks,
// } from "../Models/urlModelPrisma.model.js";

// {This imports for Drizzle ORM}
import {
  saveLink,
  findLinkByShortcode,
  getAllLinks,
  incrementClicks,
  deleteLink,
  updateLink,
  updateUserName,
} from "../Models/urlModelDrizzle.model.js";

export const getAvailabledata = async (req, res) => {
  try {
    //{ console.log("This user data comes from the middleware after validation: ", req.user) }
    const urls = await getAllLinks(req.user.id);
    // console.log(urls);
    res.json(urls);
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ error: "Failed to fetch links" });
  }
};

export const redirectToURL = async (req, res) => {
  try {
    const { shortcode } = req.params;
    const link = await findLinkByShortcode(shortcode);

    if (link) {
      await incrementClicks(shortcode);
      console.log("Redirection Successfull");
      return res.redirect(link.url);
    } else {
      return res.status(404).send("<h1>URL Not Found</h1>");
    }
  } catch (error) {
    console.error("Redirection error:", error);
    res.status(500).send("Server Error");
  }
};

export const insertNewData = async (req, res) => {
  try {
    console.log("This is before inserting the data: ", req.body);
    const { url, shortUrl } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Original URL is required!" });
    }

    // Generate shortcode if not provided
    const shortcode = shortUrl || crypto.randomBytes(4).toString("hex");

    // Check if shortcode is already taken
    const existing = await findLinkByShortcode(shortcode);
    if (existing !== null) {
      return res.status(400).json({ error: "Shortcode already exists!" });
    }

    // Save to database
    await saveLink(url, shortcode, req.user.id); // {Now here i have to pass the id also because to store as a foreign key}

    res.status(201).json({
      message: "URL Shortened Successfully!",
      originalUrl: url,
      shortUrl: shortcode,
    });
  } catch (error) {
    console.error("Error creating link:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a URL by ID
export const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "URL ID is required!" });
    }

    await deleteLink(parseInt(id));

    res.status(200).json({
      message: "URL deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ error: "Failed to delete URL" });
  }
};

// Update a URL by ID
export const updateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, shortUrl } = req.body;

    if (!id) {
      return res.status(400).json({ error: "URL ID is required!" });
    }

    if (!url && !shortUrl) {
      return res
        .status(400)
        .json({ error: "At least one field (url or shortUrl) is required!" });
    }

    // {Validate the request id is exst in the database or not}
    // Get the existing link
    const existingLink = await db
      .select()
      .from(urlTable)
      .where(eq(urlTable.id, parseInt(id)))
      .limit(1);
    console.log(existingLink);
    if (!existingLink || existingLink.length === 0) {
      return res.status(404).json({ error: "URL not found!" });
    }

    const currentLink = existingLink[0];
    const newUrl = url || currentLink.url;
    const newShortCode = shortUrl || currentLink.shortCode;

    // {Check if new shortcode is already taken by another URL}
    if (shortUrl && shortUrl !== currentLink.shortCode) {
      const existing = await findLinkByShortcode(shortUrl);
      if (existing !== null) {
        return res.status(400).json({ error: "Shortcode already exists!" });
      }
    }

    await updateLink(parseInt(id), newUrl, newShortCode);

    res.status(200).json({
      message: "URL updated successfully!",
      originalUrl: newUrl,
      shortUrl: newShortCode,
    });
  } catch (error) {
    console.error("Error updating link:", error);
    res.status(500).json({ error: "Failed to update URL" });
  }
};

export const updateProfileName = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await updateUserName(id, name);

    res.status(200).json({
      message: "Name Updated Successfully!",
      name,
    });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ error: "Failed to update name" });
  }
};
