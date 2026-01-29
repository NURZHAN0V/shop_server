import { Router } from 'express';
import { validate } from '../middleware/validate';
import { updateMeSchema } from '../schemas/user';
import prisma, { isPrismaNotFoundError } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/users/me — текущий пользователь по JWT (без пароля), требует JWT
router.get(
  '/me',
  async (req, res) => {
    const auth = (req as { auth?: { sub?: number } }).auth;
    const id = auth?.sub;
    if (id == null) {
      return res.status(401).json({ error: 'Invalid or missing token' });
    }
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!user) {
      logger.warn({ userId: id }, 'User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _p, ...rest } = user;
    res.json(rest);
  }
);

// PATCH /api/users/me — обновление текущего пользователя (name из body, id из JWT), требует JWT
router.patch(
  '/me',
  validate(updateMeSchema),
  async (req, res) => {
    const auth = (req as { auth?: { sub?: number } }).auth;
    const id = auth?.sub;
    if (id == null) {
      return res.status(401).json({ error: 'Invalid or missing token' });
    }
    const data = req.body;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
    });
    const { password: _p, ...rest } = user;
    res.json(rest);
  }
);

// DELETE /api/users/me — удаление текущего пользователя по JWT, требует JWT
router.delete(
  '/me',
  async (req, res) => {
    const auth = (req as { auth?: { sub?: number } }).auth;
    const id = auth?.sub;
    if (id == null) {
      return res.status(401).json({ error: 'Invalid or missing token' });
    }
    try {
      await prisma.user.delete({
        where: { id: Number(id) },
      });
      logger.info({ userId: id }, 'User deleted');
      res.status(204).send();
    } catch (error: unknown) {
      if (isPrismaNotFoundError(error)) {
        logger.warn({ userId: id }, 'User not found on delete');
        return res.status(404).json({ error: 'User not found' });
      }
      logger.error({ error, userId: id }, 'Error deleting user');
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
