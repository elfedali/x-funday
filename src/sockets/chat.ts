import { Server as SocketServer, Socket } from 'socket.io';
import { socketAuthMiddleware } from '../middleware/auth.middleware.js';
import { MessageService } from '../services/message.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { updateUser } from '../models/user.model.js';
import { SocketUser, SocketMessage, TypingEvent, JwtUser, MessageType } from '../types/index.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/helpers.js';

// Store active users and their socket connections
const activeUsers = new Map<number, SocketUser>();
const userSockets = new Map<number, string[]>(); // User can have multiple connections
const typingUsers = new Map<number, Set<number>>(); // conversation_id -> Set of user_ids

export const setupChatSockets = (io: SocketServer): void => {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket: Socket) => {
    try {
      const user = socket.user as JwtUser;
      logger.info('User connected to socket', {
        userId: user.id,
        socketId: socket.id,
        username: user.username,
      });

      // Add user to active users
      const socketUser: SocketUser = {
        id: user.id,
        username: user.username,
        socketId: socket.id,
        isOnline: true,
        lastSeen: new Date(),
      };

      activeUsers.set(user.id, socketUser);

      // Add socket to user's socket list
      if (!userSockets.has(user.id)) {
        userSockets.set(user.id, []);
      }
      userSockets.get(user.id)!.push(socket.id);

      // Update user's last seen in database
      await updateUser(user.id, { last_seen: new Date() });

      // Join user to their personal room for notifications
      socket.join(`user:${user.id}`);

      // Get user's conversations and join those rooms
      try {
        const { conversations } = await ConversationService.getUserConversations(user.id, 1, 100);
        for (const conversation of conversations) {
          socket.join(`conversation:${conversation.id}`);
        }
      } catch (error) {
        logger.error('Error joining conversation rooms:', error);
      }

      // Notify other users that this user is online
      socket.broadcast.emit('user_online', {
        userId: user.id,
        username: user.username,
        lastSeen: new Date(),
      });

      // Handle sending messages
      socket.on(
        'send_message',
        async (data: {
          conversation_id: number;
          content: string;
          message_type?: MessageType;
          reply_to_id?: number;
        }) => {
          try {
            logger.info('Received message', {
              userId: user.id,
              conversationId: data.conversation_id,
              messageType: data.message_type || MessageType.TEXT,
            });

            // Create message using service
            const messagePayload: {
              conversation_id: number;
              content: string;
              message_type: MessageType;
              reply_to_id?: number;
            } = {
              conversation_id: data.conversation_id,
              content: data.content,
              message_type: data.message_type || MessageType.TEXT,
            };

            if (data.reply_to_id !== undefined) {
              messagePayload.reply_to_id = data.reply_to_id;
            }

            const message = await MessageService.createMessage(user.id, messagePayload);

            // Prepare socket message
            const socketMessage: SocketMessage = {
              id: message.id,
              conversation_id: message.conversation_id,
              sender_id: message.sender_id,
              content: message.content,
              message_type: message.message_type,
              created_at: message.created_at,
              sender: {
                id: user.id,
                username: user.username,
                name: user.username, // We'd get this from user profile
              },
            };

            // Send message to all users in the conversation
            io.to(`conversation:${data.conversation_id}`).emit('new_message', socketMessage);

            // Stop typing indicator for this user
            stopTyping(socket, data.conversation_id, user.id);

            logger.info('Message sent successfully', {
              messageId: message.id,
              userId: user.id,
              conversationId: data.conversation_id,
            });
          } catch (error) {
            logger.error('Error sending message:', error);
            socket.emit('message_error', {
              error: error instanceof AppError ? error.message : 'Failed to send message',
            });
          }
        }
      );

      // Handle joining conversations
      socket.on('join_conversation', async (data: { conversation_id: number }) => {
        try {
          // Verify user can access this conversation
          await ConversationService.getConversationDetails(data.conversation_id, user.id);

          socket.join(`conversation:${data.conversation_id}`);

          logger.info('User joined conversation room', {
            userId: user.id,
            conversationId: data.conversation_id,
          });

          socket.emit('joined_conversation', { conversation_id: data.conversation_id });
        } catch (error) {
          logger.error('Error joining conversation:', error);
          socket.emit('join_conversation_error', {
            conversation_id: data.conversation_id,
            error: error instanceof AppError ? error.message : 'Failed to join conversation',
          });
        }
      });

      // Handle leaving conversations
      socket.on('leave_conversation', (data: { conversation_id: number }) => {
        socket.leave(`conversation:${data.conversation_id}`);

        // Stop typing if user was typing
        stopTyping(socket, data.conversation_id, user.id);

        logger.info('User left conversation room', {
          userId: user.id,
          conversationId: data.conversation_id,
        });
      });

      // Handle typing indicators
      socket.on('start_typing', (data: { conversation_id: number }) => {
        startTyping(socket, data.conversation_id, user.id, user.username);
      });

      socket.on('stop_typing', (data: { conversation_id: number }) => {
        stopTyping(socket, data.conversation_id, user.id);
      });

      // Handle marking messages as read
      socket.on('mark_messages_read', async (data: { conversation_id: number }) => {
        try {
          await MessageService.markMessagesAsRead(data.conversation_id, user.id);

          // Notify other users in conversation
          socket.to(`conversation:${data.conversation_id}`).emit('messages_read', {
            conversation_id: data.conversation_id,
            user_id: user.id,
            read_at: new Date(),
          });

          logger.info('Messages marked as read', {
            userId: user.id,
            conversationId: data.conversation_id,
          });
        } catch (error) {
          logger.error('Error marking messages as read:', error);
        }
      });

      // Handle user status updates
      socket.on('update_status', async (data: { status: 'online' | 'away' | 'busy' }) => {
        try {
          // Update user status in memory
          if (activeUsers.has(user.id)) {
            const socketUser = activeUsers.get(user.id)!;
            socketUser.lastSeen = new Date();
            activeUsers.set(user.id, socketUser);
          }

          // Broadcast status update
          socket.broadcast.emit('user_status_update', {
            userId: user.id,
            status: data.status,
            lastSeen: new Date(),
          });
        } catch (error) {
          logger.error('Error updating user status:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async reason => {
        try {
          logger.info('User disconnected from socket', {
            userId: user.id,
            socketId: socket.id,
            reason,
          });

          // Remove socket from user's socket list
          const userSocketList = userSockets.get(user.id);
          if (userSocketList) {
            const index = userSocketList.indexOf(socket.id);
            if (index > -1) {
              userSocketList.splice(index, 1);
            }

            // If user has no more active sockets, mark as offline
            if (userSocketList.length === 0) {
              activeUsers.delete(user.id);
              userSockets.delete(user.id);

              // Update last seen in database
              await updateUser(user.id, { last_seen: new Date() });

              // Notify other users that this user is offline
              socket.broadcast.emit('user_offline', {
                userId: user.id,
                lastSeen: new Date(),
              });

              // Clear typing indicators for this user
              for (const [conversationId, typingUserSet] of typingUsers.entries()) {
                if (typingUserSet.has(user.id)) {
                  typingUserSet.delete(user.id);
                  socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                    conversation_id: conversationId,
                    user_id: user.id,
                    username: user.username,
                  });
                }
              }
            }
          }
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });
    } catch (error) {
      logger.error('Error in socket connection:', error);
      socket.disconnect();
    }
  });
};

// Helper functions
function startTyping(
  socket: Socket,
  conversationId: number,
  userId: number,
  username: string
): void {
  if (!typingUsers.has(conversationId)) {
    typingUsers.set(conversationId, new Set());
  }

  const typingUserSet = typingUsers.get(conversationId)!;
  if (!typingUserSet.has(userId)) {
    typingUserSet.add(userId);

    socket.to(`conversation:${conversationId}`).emit('user_started_typing', {
      conversation_id: conversationId,
      user_id: userId,
      username,
    });

    logger.debug('User started typing', { userId, conversationId });
  }
}

function stopTyping(socket: Socket, conversationId: number, userId: number): void {
  const typingUserSet = typingUsers.get(conversationId);
  if (typingUserSet && typingUserSet.has(userId)) {
    typingUserSet.delete(userId);

    socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
      conversation_id: conversationId,
      user_id: userId,
    });

    logger.debug('User stopped typing', { userId, conversationId });
  }
}

// Export helper functions for other modules
export const getActiveUsers = (): Map<number, SocketUser> => {
  return activeUsers;
};

export const isUserOnline = (userId: number): boolean => {
  return activeUsers.has(userId);
};

export const getOnlineUsersCount = (): number => {
  return activeUsers.size;
};

export const getUserSocketIds = (userId: number): string[] => {
  return userSockets.get(userId) || [];
};
