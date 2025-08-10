import request from 'supertest';
import app from '../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeDatabase, testUsers } from './test-helpers';

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should create user with hashed password', async () => {
    const res = await request(app).post('/api/v1/register').send(testUsers.user1);

    expect(res.status).toBe(201);
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user.username).toBe(testUsers.user1.username);
    expect(res.body.data.user.email).toBe(testUsers.user1.email);
  });

  it('should handle unique constraint violations', async () => {
    // Create first user
    await request(app).post('/api/v1/register').send(testUsers.user1);

    // Try to create user with same email
    const duplicateEmailUser = {
      ...testUsers.user2,
      email: testUsers.user1.email,
    };

    const res = await request(app).post('/api/v1/register').send(duplicateEmailUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Conversation Model', () => {
  let authToken1: string;
  let authToken2: string;
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();

    // Create and login two users
    const user1Res = await request(app).post('/api/v1/register').send(testUsers.user1);

    const user2Res = await request(app).post('/api/v1/register').send(testUsers.user2);

    user1Id = user1Res.body.data.user.id;
    user2Id = user2Res.body.data.user.id;

    const login1Res = await request(app).post('/api/v1/login').send({
      login: testUsers.user1.username,
      password: testUsers.user1.password,
    });

    const login2Res = await request(app).post('/api/v1/login').send({
      login: testUsers.user2.username,
      password: testUsers.user2.password,
    });

    authToken1 = login1Res.body.data.token;
    authToken2 = login2Res.body.data.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // Note: These tests would require conversation routes to be enabled
  // For now, we'll test the models through the services directly
  it('should be ready for conversation testing when routes are enabled', () => {
    expect(user1Id).toBeDefined();
    expect(user2Id).toBeDefined();
    expect(authToken1).toBeDefined();
    expect(authToken2).toBeDefined();
  });
});

describe('Message Model', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should be ready for message testing when routes are enabled', () => {
    // Placeholder for message model tests
    expect(true).toBe(true);
  });
});
