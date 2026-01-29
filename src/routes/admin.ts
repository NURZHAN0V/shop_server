import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  updateUserSchema,
  getUserSchema,
  type GetUserParams,
} from '../schemas/user';
import prisma, { isPrismaNotFoundError } from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

/** Все маршруты используют requireAdmin при монтировании в index. Префикс: /api/admin/users */

// GET /api/admin/users — список всех пользователей (без паролей), только admin
router.get(
  '/',
  async (_req, res) => {
    const users = await prisma.user.findMany();
    const safe = users.map(({ password: _p, ...u }) => u);
    res.status(200).json(safe);
  }
);

// GET /api/admin/users/:id — получение одного пользователя по id, только admin
router.get(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params as unknown as GetUserParams;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      logger.warn({ userId: id }, 'User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _p, ...rest } = user;
    res.json(rest);
  }
);

// PATCH /api/admin/users/:id — обновление пользователя по id (name), только admin
router.patch(
  '/:id',
  validate(updateUserSchema),
  async (req, res) => {
    const { id } = req.params as unknown as GetUserParams;
    const data = req.body;
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    const { password: _p, ...rest } = user;
    res.json(rest);
  }
);

// DELETE /api/admin/users/:id — удаление пользователя по id, только admin
router.delete(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params as unknown as GetUserParams;
    try {
      await prisma.user.delete({
        where: { id },
      });
      logger.info({ userId: id }, 'User deleted by admin');
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
