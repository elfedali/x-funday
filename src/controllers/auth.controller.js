import {
  getUserByUsername,
  createUser,
  getUserByEmail,
} from "../models/user.model.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import env from "../helpers/env.js";

// Handle user registration
export const registerUser = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validate passwords
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if username or email already exists
    const [existingUser, existingEmail] = await Promise.all([
      getUserByUsername(username),
      getUserByEmail(email),
    ]);

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    await createUser({ username, email, password: hashedPassword });
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while processing the request" });
  }
};

// Handle user login
export const loginUser = async (req, res) => {
  const { login, password } = req.body; // `login` can be username or email

  try {
    // Attempt to find user by username or email
    const user =
      (await getUserByUsername(login)) || (await getUserByEmail(login));

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRED || "1d" }
    );

    return res.json({ access_token: token });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while processing the login" });
  }
};
