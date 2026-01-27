import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  createUserSchema,
  type CreateUserInput,
} from '../schemas/user';
import prisma from '../lib/prisma';
import { comparePassword, hashPassword } from '../lib/password';
import { signAccessToken } from '../lib/jwt';

const router = Router();

// POST /api/auth/register — регистрация пользователя (email, name, password), без JWT
router.post(
  '/register',
  validate(createUserSchema),
  async (req, res) => {
    const data: CreateUserInput = req.body;
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        ...data,
        password: passwordHash,
      },
    });
    const { password: _p, ...rest } = user;
    res.status(201).json(rest);
  }
);

// POST /api/auth/login — вход по email и паролю, возвращает token и данные пользователя, без JWT
router.post(
  '/login',
  validate(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;

    const authUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!authUser) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const didMatch = await comparePassword(password, authUser.password);

    if (!didMatch) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = signAccessToken({
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
    });

    res.status(200).json({
      token,
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
      },
    });
  }
);

export default router;
