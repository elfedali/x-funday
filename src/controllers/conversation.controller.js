import {
  getAllConversationWhereUserIs,
  getConversationById,
  getConversationMembers,
  createConversation,
  updateConversation,
  deleteConversation,
} from "../models/conversation.model.js";
import { createConversationUser } from "../models/conversation_user.model.js";
export const actionGetAllConversationsByConnectedUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await getAllConversationWhereUserIs(userId);
    res.status(200).json({ conversations });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching conversations" });
  }
};

export const actionGetConversationById = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const members = await getConversationMembers(conversationId);
    conversation.members = members;
    res.status(200).json({ conversation });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching conversation" });
  }
};

export const actionCreateConversation = async (req, res) => {
  try {
    const { name, description, is_group, members } = req.body;
    const userId = req.user.id;
    var conversation = await createConversation({
      name,
      description,
      is_group,
      owner_id: userId,
    });
    // conversation is an array, so we take the first element
    conversation = conversation[0];
    console.log("conversation", conversation);
    if (!conversation) {
      return res
        .status(500)
        .json({ message: "An error occurred while creating conversation" });
    }
    // Add conversation creator as a
    const conversation_user = await createConversationUser({
      conversation_id: conversation.id,
      user_id: userId,
    });

    // // Add conversation members
    // await Promise.all(
    // members.map((memberId) =>
    //     createConversationUser({
    //     conversation_id: conversation.id,
    //     user_id: memberId,
    //     })
    // )
    // );

    res.status(201).json({ message: "Conversation created", conversation });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while creating conversation" });
  }
};

export const actionUpdateConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const userId = req.user.id;
    if (conversation.owner_id !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const updatedConversation = await updateConversation(
      conversationId,
      req.body
    );
    res.status(200).json({
      message: "Conversation updated",
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating conversation" });
  }
};

export const actionDeleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const userId = req.user.id;
    if (conversation.owner_id !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await deleteConversation(conversationId);
    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting conversation" });
  }
};
