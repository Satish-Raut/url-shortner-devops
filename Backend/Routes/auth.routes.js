import { Router } from "express";
import * as authoController from "../Controllers/auth.controller.js";
import { requireAuth } from "../Middleware/auth.middleware.js";

const router = Router();

// router.get("/regester", authoController.getRegisterPage);
// router.get("/login", authoController.getLoginPage);
// router.post("/login", authoController.getLoginPost);

router
  .route("/register")
  // .get(authoController.getRegisterPage)
  .post(authoController.postRegister);

router
  .route("/login")
  // .get(authoController.getLoginPage)
  .post(authoController.postLogin);

// Route to check the user is logged in or not (Used for logout feature handling at Frontend)
router.get("/auth/me", requireAuth, authoController.getCurrentUser);

router.post("/verify-email", requireAuth, authoController.sendVerificationLink);
router.post("/verify-email-token", authoController.verifyEmailToken);

// Logout the user
router.post("/logout", requireAuth, authoController.logoutUser);
export const authRoutes = router;
