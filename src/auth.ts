import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-multi-agent';

interface User {
  id: string;
  email: string;
  name: string;
}

// In-memory user store for demo/initial implementation
const users: Map<string, User> = new Map();

/**
 * Authentication & OAuth User Service
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const id = 'usr_' + Date.now();
  const newUser: User = { id, email, name: name || email.split('@')[0] };
  users.set(id, newUser);

  const token = jwt.sign({ sub: id, email }, JWT_SECRET, { expiresIn: '24h' });
  return res.status(201).json({ user: newUser, token });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = Array.from(users.values()).find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  return res.json({ user, token });
});

router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.get(decoded.sub);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
