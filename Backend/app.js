import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import requestIp from "request-ip"

import { shortnerRouter } from "./Routes/urlRoutes.routes.js";
import { authRoutes } from "./Routes/auth.routes.js";

//{ NOTE: Create the Express-Server}
const app = express();

// { NOTE: Important for cookies to work on Render/Vercel behind a proxy }
app.set("trust proxy", 1);

//{ NOTE: Write the usefull middlewares}
app.use(express.json()); // Enable JSON parsing
app.use(express.urlencoded({ extended: true }));

//{ NOTE: Correcting common CORS mistake: remove trailing slash from FRONTEND_URL if present}
const allowedOrigin = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/$/, "");

app.use(
  cors({
    // origin: process.env.FRONTEND_URL || "http://localhost:5173
    origin: allowedOrigin,
    credentials: true,
  }),
);

// {Cookie Parser middleware}
app.use(cookieParser());

// {Request-Ip Middleware}
app.use(requestIp.mw());   // Now we can access the ip address of any request through `req.clintIp`

//* Health check endpoint — Jenkins uses this to verify deployment
//* MUST be before shortnerRouter (which has a catch-all /:shortId route)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// {NOTE: The purpose of this Middleware is to define the routes}
app.use(authRoutes);
app.use(shortnerRouter);

//{ NOTE: Finally listen the app at a particular port}
// console.log(process.env.PORT);
app.listen(process.env.PORT, () => {
  console.log(`Server Running at PORT: ${process.env.PORT}`);
});
