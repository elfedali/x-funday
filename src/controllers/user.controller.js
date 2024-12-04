import { deleteUser, getUserById, updateUser } from "../models/user.model.js"; // Import the function to retrieve user data

export const actionGetConnectedUser = async (req, res) => {
  try {
    // Ensure the user is authenticated
    const userId = req.user?.id; // Extract user ID from `req.user`
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch the user's full details from the database
    const user = await getUserById(userId);
    console.log("user", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // delete user.password; // Remove password from user data
    // delete user.verify_token; // Remove verification token from user data
    user.password = undefined; // Remove password from user data
    user.verify_token = undefined; // Remove verification token from user data
    // Respond with user data
    res.status(200).json({ message: "This is protected data", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while retrieving user data" });
  }
};

export const actionGetUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // delete user.password; // Remove password from user data
    // delete user.verify_token; // Remove verification token from user data
    user.password = undefined; // Remove password from user data
    user.verify_token = undefined; // Remove verification token from user data
    res.status(200).json({ message: "User data", user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while retrieving user data" });
  }
};

export const actionUpdateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the user is authenticated
    if (user.id !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Update user data
    const updatedUser = await updateUser(userId, req.body);

    delete updatedUser.password; // Remove password from user data
    delete updatedUser.verify_token; // Remove verification token from user data
    res.status(200).json({ message: "User data updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating user data" });
  }
};

export const actionDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the user is authenticated
    if (user.id !== req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Delete user
    await deleteUser(userId);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting user data" });
  }
};
