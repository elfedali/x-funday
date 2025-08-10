// Jest setup (CommonJS) to avoid ts-jest transforming this file
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret';
process.env.NODE_ENV = 'test';
process.env.DB_FILENAME = ':memory:';
process.env.PORT = process.env.PORT || '0';

// More lenient rate limiting for tests
process.env.RATE_LIMIT_WINDOW_MS = '60000'; // 1 minute
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // High limit for tests
