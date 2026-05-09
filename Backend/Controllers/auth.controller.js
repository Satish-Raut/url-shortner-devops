import {
  getUserByEmail,
  getUserById,
  saveUserdata,
} from "../Models/usersModel.model.js";
import {
  comparePassword,
  createEmailVerificationLink,
  generateRandomToken,
  hashPassword,
  hybridAuth,
} from "../Services/auth.service.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../Validators/auth-validator.js";
import { clearUserSession, insertEmailVarificationToken } from "../Models/urlModelDrizzle.model.js";
import { sendEmail } from "../lib/nodemailer.js";

// "Both the get page are handled by the Frontend"

// export const getRegisterPage = (req, res) => {
//   res.render("auth/register");
// };

// export const getLoginPage = (req, res) => {
//   res.render("auth/login");
// };

export const postLogin = async (req, res) => {
  // {1. Verify the data given by the user i.e already registerd or not}
  // const { email, password } = req.body;

  // {Validation using Zod}
  /*Note: 
                'loginUserSchema.safeParse(req.body)'

      {i} "This function returns a object with 2 parameter: success, data"
      {ii} "If the Validation is successfull -> success: true"
      {ii} "And the data params contains the validated data -> data: {email, password}"
  
  */
  const parsed = loginUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];

    return res.status(400).json({
      success: false,
      message: firstError || "Validation failed",
      redirectTo: "/login",
      errors,
    });
  }

  // {Now get the data}
  const { email, password } = parsed.data;

  try {
    // {Get the user details using user email}
    const [validUser] = await getUserByEmail({ email });

    console.log("Logged In Valid User:", validUser);

    // {2. If the user already registered then redirect to Home page}
    if (validUser) {
      // {3. Verify the password matches here before logging them in!}
      let isPasswordValid = false;
      try {
        isPasswordValid = await comparePassword(password, validUser.password);
      } catch (error) {
        console.error("Password comparison error:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error during authentication",
        });
      }

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Incorrect email & password. Please try again.",
        });
      }

      // "----💡 Session Authentication Approach-------"
      //{4. Set the cookie only upon successful login}
      // res.cookie("isLoggedIn", true); // Login Status
      // res.cookie("userId", validUser.id); // To know which user logged In
      // console.log("cookie is saved in the browser");

      // "---- 🚀 JWT Authentication Approach-------"
      // { i. Define the token }
      // const token = generateTocken({
      //   id: validUser.id,
      //   name: validUser.name,
      //   email: validUser.email,
      // });

      // { ii. Set the cookie here with a token }
      // const isProduction = process.env.NODE_ENV === "production";
      // res.cookie("access_token", token, {
      //   httpOnly: true,
      //   secure: isProduction,
      //   sameSite: isProduction ? "none" : "lax",
      //   maxAge: 30 * 24 * 60 * 60 * 1000,
      // });

      // return res.status(200).json({
      //   success: true,
      //   message: "Logged in successfully",
      //   redirectTo: "/", // redirect to home page
      //   user: { email: email },
      //   token: token, // { NOTE: Return token for Bearer authentication }
      // });

      // "---- 🚀 Hybrid Authentication Approach-------"

      await hybridAuth({ req, res, user: validUser });

      // {vi. After completion of login send the sucess message and the the page path to redirect.}
      res.status(200).json({
        success: true,
        message: "Logged in successfully",
        redirectTo: "/", // redirect to home page
        user: { email: email },
      });
    } else {
      //{4. Otherwise redirect them to registration page}
      // A 404 Not Found error tells the frontend the resource (user) doesn't exist
      return res.status(404).json({
        success: false,
        message: "Account not found. Please create an account.",
        redirectTo: "/register",
      });
    }
  } catch (error) {
    console.error("Login DB error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to connect to the database. Please try again later.",
    });
  }
};

export const postRegister = async (req, res) => {
  // {1. Get the data from the user}
  // const { name, email, password } = req.body;

  // {1. Validate the incoming user data}
  const parsed = registerUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0];

    return res.status(400).json({
      success: false,
      message: firstError || "Validation failed",
      redirectTo: "/register",
      errors,
    });
  }

  // {Now get the data}
  const { name, email, password } = parsed.data;
  console.log("validated data:", parsed.data);

  try {
    // {2. Verify whether the user already exists}
    const userExists = await getUserByEmail({ email });
    // console.log("userExists", userExists);

    if (userExists.length !== 0) {
      return res.status(409).json({
        success: false,
        message: "You have already registered.",
        redirectTo: "/login",
      });
    }

    // {3. Hash password and save new user}
    const hashedPassword = await hashPassword(password);
    const [user] = await saveUserdata({
      name,
      email,
      password: hashedPassword,
    });
    // console.log("User Data after registration: ", user.insertId)

    // {4. After the registration complete and the user data stored in database , directly logs in that user}

    await hybridAuth({ req, res, name, email, user });

    // {vi. After completion of login send the sucess message and the the page path to redirect.}

    return res.status(200).json({
      success: true,
      message: "Registered successfully",
      redirectTo: "/",
      user: { email },
    });
  } catch (error) {
    console.error("Register DB error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to connect to the database. Please try again later.",
    });
  }
};

// "----💡 Session Authentication Approach-------"
// export const getCurrentUser = async (req, res) => {
//   try {
//     const isLoggedIn = req.cookies.isLoggedIn;
//     const userId = req.cookies.userId;

//     if (isLoggedIn !== "true" || !userId) {
//       return res.json({ loggedIn: false });
//     }

//     const [user] = await getUserById({ id: Number(userId) });

//     if (!user) {
//       return res.json({ loggedIn: false });
//     }

//     return res.json({
//       loggedIn: true,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// "---- 🚀 JWT Authentication Approach-------"
export const getCurrentUser = async (req, res) => {
  try {
    // If requireAuth succeeds, req.user is guaranteed to be set correctly
    const [user] = await getUserById({ id: Number(req.user.id) });

    if (!user) {
      return res.json({ loggedIn: false });
    }

    return res.json({
      loggedIn: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailValid: user.isEmailValid,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in getCurrentUser:", err.message);
    return res.json({ loggedIn: false });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // "----💡 Session Authentication Approach-------"
    // res.clearCookie("isLoggedIn");
    // res.clearCookie("userId");

    // "---- 🚀 JWT Authentication Approach-------"
    // const isProduction = process.env.NODE_ENV === "production";
    // res.clearCookie("access_token", {
    //   httpOnly: true,
    //   secure: isProduction,
    //   sameSite: isProduction ? "none" : "lax",
    // });

    // "---- 🚀 Hybrid Authentication Approach-------"

    // {Here we need to clear the session from the database}
    // console.log(req.user)
    await clearUserSession(req.user.sessionId);

    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const sendVerificationLink = async (req, res) => {
  if (!req.user) return res.redirect("/");

  // {1. Generate the token}
  const token = await generateRandomToken(6);

  // {2. Store that token in database}
  await insertEmailVarificationToken({ userId: req.user.id, token });

  // {3. Create Varification link}
  const emailVerificationLink = await createEmailVerificationLink({
    email: req.user.email,
    token: token,
  });

  sendEmail({
    to: req.user.email,
    subject: "Verify your email",
    html: `<h1>Click the link below to verify your email</h1>
            <p>You can use this token: <code>${token}</code></p>
            <p><a href="${emailVerificationLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Click here to verify your email</a></p>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Or copy and paste this link in your browser: <br/> ${emailVerificationLink}</p>
    `,
  }).catch(console.error);

  res.status(200).json({
    message: "Verification email sent",
    email: emailVerificationLink,
    otp: token,
    redirectTo: "/verify-email"
  })
};

export const verifyEmailToken = async (req, res) => {
  const { token, email } = req.body;
  if (!token || !email) {
    return res.status(400).json({ success: false, message: "Token and email are required" });
  }

  try {
    const [user] = await getUserByEmail({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify token from DB
    const { eq, and } = await import("drizzle-orm");
    const { db } = await import("../Config/drizzleDB.js");
    const { emailVerificationTable } = await import("../drizzle/schema.js");
    
    // Look up active token
    const verificationRecord = await db.select()
      .from(emailVerificationTable)
      .where(
        and(
          eq(emailVerificationTable.userId, user.id),
          eq(emailVerificationTable.token, token)
        )
      );
      
    if (verificationRecord.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    
    // Valid token found! Mark user as verified
    // const { updateUserName } = await import("../Models/urlModelDrizzle.model.js");
    const { userTable } = await import("../drizzle/schema.js");
    await db.update(userTable).set({ isEmailValid: true }).where(eq(userTable.id, user.id));
    
    // Delete the used token
    // await db.delete(emailVerificationTable).where(eq(emailVerificationTable.id, verificationRecord[0].id));
    
    return res.status(200).json({
      success: true, 
      message: "Email verified successfully"
    });
    
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
