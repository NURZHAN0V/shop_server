import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  type CreateUserInput,
} from '../schemas/user';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// Создание пользователя
router.post(
  '/',
  validate(createUserSchema), // Валидация перед обработкой
  async (req, res) => {
    const data: CreateUserInput = req.body;
    const user = await prisma.user.create({
      data,
    });

    res.status(201).json(user);
  }
);

// Получение пользователя
router.get(
  '/:id',
  validate(getUserSchema),
  async (req, res) => {
    const { id } = req.params;

    try {
      const user = await prisma.user.findUnique({
        where: { id: id as unknown as number },
      });

      if (!user) {
        logger.warn({ userId: id }, 'Пользователь не найден');
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      logger.debug({ userId: id }, 'Пользователь найден');
      res.json(user);
    } catch (error) {
      logger.error(
        { error, userId: id },
        'Ошибка при получении пользователя'
      );
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
);

// Обновление пользователя
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

    res.json(user);
  }
);

export default router;