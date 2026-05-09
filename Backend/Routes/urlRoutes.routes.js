import { Router } from "express";

import {
  getAvailabledata,
  redirectToURL,
  insertNewData,
  deleteUrl,
  updateUrl,
  updateProfileName,
} from "../Controllers/urlController.js";

import { requireAuth } from "../Middleware/auth.middleware.js";

const router = Router();

// Route to fetch all shortened URLs (for initial frontend load)
router.get("/urlshortner", requireAuth, getAvailabledata);

// Route to add a new shortened URL to the database
router.post("/urlshortner", requireAuth, insertNewData);

// Route to update a URL by ID
router.put("/:id", requireAuth, updateUrl);

// Route to update a profile name by ID
router.put("/update-profile/:id", requireAuth, updateProfileName);

// Route to delete a URL by ID
router.delete("/:id", requireAuth, deleteUrl);

// Route to handle URL redirection (must be last)
router.get("/:shortcode", redirectToURL);

export const shortnerRouter = router;
