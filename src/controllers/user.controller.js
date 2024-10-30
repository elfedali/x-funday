import bcrypt from "bcrypt";
import passport from "passport";
import {
  getUserByUsername,
  getUserById,
  createUser,
} from "../models/user.model.js";

// Handle user registration
export async function registerUser(req, res) {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await createUser(username, email, hashedPassword);
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(
        "An error occurred during registration. <a href='/register'>Try again</a>"
      );
  }
}

// Handle user login
export function loginUser(req, res, next) {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
}

// Handle user logout
export function logoutUser(req, res) {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/");
    }
    res.redirect("/login");
  });
}

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
