import { Router } from 'express';
import { validate } from '../middleware/validate';
import { updateUserSchema, getUserSchema } from '../schemas/user';
import prisma from '../lib/prisma';
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
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: id as unknown as number },
    });
    if (!user) {
      logger.warn({ userId: id }, 'Пользователь не найден');
      return res.status(404).json({ error: 'Пользователь не найден' });
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
    const { id } = req.params;
    const data = req.body;
    const user = await prisma.user.update({
      where: { id: id as unknown as number },
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
    const { id } = req.params;
    const numId = id as unknown as number;
    try {
      await prisma.user.delete({
        where: { id: numId },
      });
      logger.info({ userId: id }, 'Пользователь удалён администратором');
      res.status(204).send();
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        logger.warn({ userId: id }, 'Пользователь не найден при удалении');
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      logger.error({ error, userId: id }, 'Ошибка при удалении пользователя');
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

export default router;
