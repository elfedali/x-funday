import db from '../src/knex/knex.js';

export async function setupTestDatabase(): Promise<void> {
  // Run migrations
  await db.migrate.latest();

  // Run seeds for test data
  await db.seed.run();
}

export async function cleanupTestDatabase(): Promise<void> {
  // Clean up all tables
  await db('messages').del();
  await db('conversation_users').del();
  await db('conversations').del();
  await db('users').del();
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}

// Test user fixtures
export const testUsers = {
  user1: {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!',
    name: 'Test User1',
  },
  user2: {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'TestPass456@',
    confirmPassword: 'TestPass456@',
    name: 'Test User2',
  },
  user3: {
    username: 'testuser3',
    email: 'test3@example.com',
    password: 'TestPass789#',
    confirmPassword: 'TestPass789#',
    name: 'Test User3',
  },
};
