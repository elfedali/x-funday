// Jest setup to satisfy required env vars before env.ts is imported
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret';
process.env.NODE_ENV = 'test';
process.env.DB_FILENAME = ':memory:';
process.env.PORT = process.env.PORT || '0';
