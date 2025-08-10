import request from 'supertest';
import app from '../src/app';
import { setupTestDatabase, cleanupTestDatabase, closeDatabase, testUsers } from './test-helpers';

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/v1/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/v1/register').send(testUsers.user1);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.username).toBe(testUsers.user1.username);
      expect(res.body.data.user.email).toBe(testUsers.user1.email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = { ...testUsers.user1, email: 'invalid-email' };

      const res = await request(app).post('/api/v1/register').send(invalidUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with short password', async () => {
      const invalidUser = { ...testUsers.user1, password: '123' };

      const res = await request(app).post('/api/v1/register').send(invalidUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate username', async () => {
      // Register first user
      await request(app).post('/api/v1/register').send(testUsers.user1);

      // Try to register with same username
      const duplicateUser = { ...testUsers.user2, username: testUsers.user1.username };

      const res = await request(app).post('/api/v1/register').send(duplicateUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app).post('/api/v1/register').send(testUsers.user1);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/v1/login').send({
        login: testUsers.user1.username,
        password: testUsers.user1.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.username).toBe(testUsers.user1.username);
    });

    it('should login with email instead of username', async () => {
      const res = await request(app).post('/api/v1/login').send({
        login: testUsers.user1.email,
        password: testUsers.user1.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUsers.user1.email);
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app).post('/api/v1/login').send({
        login: testUsers.user1.username,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent user', async () => {
      const res = await request(app).post('/api/v1/login').send({
        login: 'nonexistent',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      await request(app).post('/api/v1/register').send(testUsers.user1);

      const loginRes = await request(app).post('/api/v1/login').send({
        login: testUsers.user1.username,
        password: testUsers.user1.password,
      });

      authToken = loginRes.body.data.token;
    });

    describe('GET /api/v1/profile', () => {
      it('should get user profile with valid token', async () => {
        const res = await request(app)
          .get('/api/v1/profile')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.username).toBe(testUsers.user1.username);
      });

      it('should reject request without token', async () => {
        const res = await request(app).get('/api/v1/profile');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should reject request with invalid token', async () => {
        const res = await request(app)
          .get('/api/v1/profile')
          .set('Authorization', 'Bearer invalid-token');

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          bio: 'Updated bio',
        };

        const res = await request(app)
          .put('/api/v1/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.name).toBe('Updated Name');
        expect(res.body.data.user.bio).toBe('Updated bio');
      });
    });

    describe('PUT /api/v1/change-password', () => {
      it('should change password with valid current password', async () => {
        const passwordData = {
          currentPassword: testUsers.user1.password,
          newPassword: 'NewPass123!',
          confirmNewPassword: 'NewPass123!',
        };

        const res = await request(app)
          .put('/api/v1/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Password changed successfully');
      });

      it('should reject password change with invalid current password', async () => {
        const passwordData = {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmNewPassword: 'newpassword123',
        };

        const res = await request(app)
          .put('/api/v1/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send(passwordData);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/logout', () => {
      it('should logout successfully', async () => {
        const res = await request(app)
          .post('/api/v1/logout')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Logout successful');
      });
    });

    describe('POST /api/v1/refresh-token', () => {
      it('should refresh token successfully', async () => {
        const res = await request(app)
          .post('/api/v1/refresh-token')
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');
        expect(typeof res.body.data.token).toBe('string');
      });
    });
  });
});
