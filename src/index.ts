import 'dotenv/config';
import express from 'express';
import prisma from './lib/prisma';

const app = express();

app.use(express.json());

app.get('/', async (_, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ message: 'Prisma подключена!', usersCount: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Соединение с базой данных разорвано' });
  }
});

app.listen(1480, () => console.log('Сервер запущен на порту 1480 ✅'));