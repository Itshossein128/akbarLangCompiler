Here is the complete production-ready implementation plan and source code for the User Authentication Module built with **TypeScript**, **Express**, **PostgreSQL**, **JWT tokens**, and **Google OAuth2**.

---

## 1. System Architecture & Database Schema

### Architecture Overview
- **Access Tokens**: Short-lived stateless JWTs (`15m`) passed in the `Authorization: Bearer <token>` header for authenticating protected API endpoints.
- **Refresh Tokens**: Long-lived tokens (`7d`) stored in HTTP-only cookies or request body, tracked in PostgreSQL using cryptographically secure SHA-256 hashes for rotation and multi-device revocation.
- **OAuth Integration**: Integrates Google OAuth 2.0 via Google's official `google-auth-library` to verify ID tokens or auth codes and map Google profiles to internal user accounts.

### Database Schema (`schema.sql`)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for OAuth-only users
    full_name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens Table (Supports multi-device session tracking & revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

---

## 2. Directory Structure

```text
src/
├── config/
│   └── env.ts
├── db/
│   └── index.ts
├── interfaces/
│   └── auth.interface.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── repositories/
│   ├── user.repository.ts
│   └── refreshToken.repository.ts
├── services/
│   ├── auth.service.ts
│   └── google.service.ts
├── controllers/
│   └── auth.controller.ts
├── routes/
│   └── auth.routes.ts
├── utils/
│   ├── jwt.utils.ts
│   └── password.utils.ts
├── app.ts
└── server.ts
```

---

## 3. Implementation Code

### Package Dependencies (`package.json`)

```json
{
  "name": "express-auth-module",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "google-auth-library": "^9.10.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.12",
    "@types/pg": "^8.11.6",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

---

### Configuration (`src/config/env.ts`)

```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'auth_db',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'super-secret-access-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    accessExpiresIn: '15m',
    refreshExpiresInDays: 7,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
```

---

### Database Connection (`src/db/index.ts`)

```typescript
import { Pool } from 'pg';
import { config } from '../config/env';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database client error:', err);
});
```

---

### Interfaces (`src/interfaces/auth.interface.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  google_id?: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  device_info?: string;
  ip_address?: string;
  expires_at: Date;
  is_revoked: boolean;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

---

### Password & Token Utilities (`src/utils/password.utils.ts` & `src/utils/jwt.utils.ts`)

#### `src/utils/password.utils.ts`
```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class PasswordUtils {
  private static SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
```

#### `src/utils/jwt.utils.ts`
```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { JwtPayload } from '../interfaces/auth.interface';

export class JwtUtils {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
  }
}
```

---

### Repositories (`src/repositories/user.repository.ts` & `src/repositories/refreshToken.repository.ts`)

#### `src/repositories/user.repository.ts`
```typescript
import { pool } from '../db';
import { User } from '../interfaces/auth.interface';

export class UserRepository {
  static async findById(id: string): Promise<User | null> {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const res = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return res.rows[0] || null;
  }

  static async create(user: {
    email: string;
    passwordHash?: string;
    fullName: string;
    googleId?: string;
    isEmailVerified?: boolean;
  }): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, full_name, google_id, is_email_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      user.email,
      user.passwordHash || null,
      user.fullName,
      user.googleId || null,
      user.isEmailVerified || false,
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async linkGoogleId(userId: string, googleId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET google_id = $1, is_email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [googleId, userId]
    );
  }
}
```

#### `src/repositories/refreshToken.repository.ts`
```typescript
import { pool } from '../db';
import { RefreshToken } from '../interfaces/auth.interface';

export class RefreshTokenRepository {
  static async create(data: {
    userId: string;
    tokenHash: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      data.userId,
      data.tokenHash,
      data.deviceInfo || null,
      data.ipAddress || null,
      data.expiresAt,
    ]);
    return res.rows[0];
  }

  static async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const res = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    return res.rows[0] || null;
  }

  static async revokeToken(id: string): Promise<void> {
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [id]);
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await pool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);
  }
}
```

---

### External OAuth Service (`src/services/google.service.ts`)

```typescript
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env';

const googleClient = new OAuth2Client(config.google.clientId);

export class GoogleService {
  static async verifyIdToken(idToken: string) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google Token payload');
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      emailVerified: payload.email_verified || false,
      fullName: payload.name || 'Google User',
    };
  }
}
```

---

### Core Auth Service (`src/services/auth.service.ts`)

```typescript
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';
import { PasswordUtils } from '../utils/password.utils';
import { JwtUtils } from '../utils/jwt.utils';
import { GoogleService } from './google.service';
import { config } from '../config/env';
import { TokenPair, User } from '../interfaces/auth.interface';

export class AuthService {
  private static async issueTokens(
    user: User,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    const accessToken = JwtUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const rawRefreshToken = JwtUtils.generateRefreshToken();
    const tokenHash = PasswordUtils.hashRefreshToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresInDays);

    await RefreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  static async register(email: string, password: string, fullName: string): Promise<User> {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email already in use');
    }

    const passwordHash = await PasswordUtils.hash(password);
    const newUser = await UserRepository.create({
      email,
      passwordHash,
      fullName,
    });

    return newUser;
  }

  static async login(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await PasswordUtils.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.issueTokens(user, deviceInfo, ipAddress);

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  static async googleLogin(
    idToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const googleUser = await GoogleService.verifyIdToken(idToken);

    let user = await UserRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await UserRepository.findByEmail(googleUser.email);
      if (user) {
        await UserRepository.linkGoogleId(user.id, googleUser.googleId);
      } else {
        user = await UserRepository.create({
          email: googleUser.email,
          fullName: googleUser.fullName,
          googleId: googleUser.googleId,
          isEmailVerified: googleUser.emailVerified,
        });
      }
    }

    const tokens = await this.issueTokens(user, deviceInfo, ipAddress);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  static async refreshTokens(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<TokenPair> {
    const tokenHash = PasswordUtils.hashRefreshToken(refreshToken);
    const storedToken = await RefreshTokenRepository.findByHash(tokenHash);

    if (!storedToken || storedToken.is_revoked || new Date() > new Date(storedToken.expires_at)) {
      throw new Error('Invalid or expired refresh token');
    }

    // Revoke old refresh token (Token Rotation Strategy)
    await RefreshTokenRepository.revokeToken(storedToken.id);

    const user = await UserRepository.findById(storedToken.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.issueTokens(user, deviceInfo, ipAddress);
  }

  static async logout(refreshToken: string): Promise<void> {
    const tokenHash = PasswordUtils.hashRefreshToken(refreshToken);
    const storedToken = await RefreshTokenRepository.findByHash(tokenHash);
    if (storedToken) {
      await RefreshTokenRepository.revokeToken(storedToken.id);
    }
  }

  static async logoutAll(userId: string): Promise<void> {
    await RefreshTokenRepository.revokeAllUserTokens(userId);
  }
}
```

---

### Middlewares (`src/middlewares/auth.middleware.ts` & `src/middlewares/error.middleware.ts`)

#### `src/middlewares/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt.utils';
import { JwtPayload } from '../interfaces/auth.interface';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJwt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = JwtUtils.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Access token expired or invalid' });
  }
};
```

#### `src/middlewares/error.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Unhandled Error:', err.message);
  return res.status(400).json({
    error: err.message || 'An unexpected error occurred',
  });
};
```

---

### Controller & Express Routes (`src/controllers/auth.controller.ts` & `src/routes/auth.routes.ts`)

#### `src/controllers/auth.controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and fullName are required' });
      }
      const user = await AuthService.register(email, password, fullName);
      const { password_hash, ...safeUser } = user;
      return res.status(201).json({ message: 'User registered successfully', user: safeUser });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const result = await AuthService.login(email, password, deviceInfo, ipAddress);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: 'Google ID token is required' });
      }
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const result = await AuthService.googleLogin(idToken, deviceInfo, ipAddress);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;

      const tokens = await AuthService.refreshTokens(refreshToken, deviceInfo, ipAddress);
      return res.status(200).json(tokens);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.logoutAll(req.user!.userId);
      return res.status(200).json({ message: 'Logged out from all devices successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserRepository.findById(req.user!.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password_hash, ...safeUser } = user;
      return res.status(200).json({ user: safeUser });
    } catch (err) {
      next(err);
    }
  }
}
```

#### `src/routes/auth.routes.ts`
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected Routes
router.get('/me', authenticateJwt, AuthController.me);
router.post('/logout-all', authenticateJwt, AuthController.logoutAll);

export default router;
```

---

### Application Entry Point (`src/app.ts` & `src/server.ts`)

#### `src/app.ts`
```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth Module Routes
app.use('/api/auth', authRoutes);

// Global Error Middleware
app.use(errorHandler);

export default app;
```

#### `src/server.ts`
```typescript
import app from './app';
import { config } from './config/env';

app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
});
```

---

## 4. Verification & Testing Instructions

1. **Database Setup**:
   - Create a PostgreSQL database (e.g., `auth_db`).
   - Run the SQL DDL statements in `schema.sql`.

2. **Environment Configuration (`.env`)**:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=auth_db
   JWT_ACCESS_SECRET=access_secret_key_123
   JWT_REFRESH_SECRET=refresh_secret_key_123
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

3. **API Endpoints Testing Workflow**:
   - **Register**: `POST /api/auth/register` with `{ "email": "user@example.com", "password": "securepassword", "fullName": "Jane Doe" }`.
   - **Login**: `POST /api/auth/login` with credentials to obtain `accessToken` and `refreshToken`.
   - **Authenticated Request**: `GET /api/auth/me` with `Authorization: Bearer <accessToken>`.
   - **Token Rotation**: `POST /api/auth/refresh` with `{ "refreshToken": "<refreshToken>" }` to receive a new token pair and invalidate the old refresh token.
   - **Logout**: `POST /api/auth/logout` or `POST /api/auth/logout-all` to revoke session tokens.