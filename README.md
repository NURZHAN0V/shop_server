# Backend для интернет магазина

## Технический стек
- Node v24.13.0
- NPM 11.6.2
- Prisma 7.2.0

## Архититекрутра проекта

```
SHOP_BACKEND/
│
├── .env                  → Файл с секретами (например, URL базы данных)
├── .gitignore            → Что не нужно отправлять в GitHub
├── package.json          → Список всех библиотек и команд проекта
├── package-lock.json     → Точные версии библиотек (автоматически)
├── tsconfig.json         → Настройки TypeScript
├── prisma.config.ts      → Конфигурация Prisma (как подключаться к БД)
├── README.md             → Инструкция по запуску и о проекте
│
├── .temp/                → Временная папка для базы данных (если используешь SQLite)
│   └── database.db       → Сама база данных (файл)
│
├── node_modules/         → Папка с установленными библиотеками (не трогать!)
│
├── prisma/               → Папка для работы с базой данных через Prisma
│   ├── schema.prisma     → Здесь описываем таблицы (модели) базы данных
│   ├── migrations/       → История изменений базы данных (как лог изменения)
│   └── generated/        → Автоматически созданный код для работы с БД (не редактируем!)
│
├── src/                  → Главная папка с нашим кодом
│   ├── lib/              → Вспомогательные файлы (библиотеки)
│   │   ├── prisma.ts     → Подключение к базе данных (Prisma Client)
│   │   └── index.ts      → Экспортируем всё из lib (если нужно)
│   │
│   └── index.ts          → Главный файл сервера (здесь запускается Express)
│
└── public/               → Если будут статические файлы (картинки, HTML) — но пока не нужно
```

## Команды

### Быстрый старт

Установите зависимости

```bash
npm install
```

Создайте файл `.env` в корне проекта и добавьте URL базы данных:

```bash
DATABASE_URL="file:./.temp/database.db"
```

Создайте/обновите базу данных и сгенерируйте клиент Prisma:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Запустите приложение:

```bash
npm run dev
```

### Установка зависимостей

```bash
# Установить основные зависимости
npm install

# Установить Prisma (если ещё не установлен)
npm install prisma @prisma/client
npm install -D prisma

# Установить адаптер для SQLite (обязательно!)
npm install @prisma/adapter-better-sqlite3 better-sqlite3

# Установить dotenv (для переменных окружения)
npm install dotenv
npm install -D dotenv
```

### Работа с базой данных

```bash
# Сгенерировать миграции (создать/обновить схему БД)
npx prisma migrate dev --name init

# Сгенерировать клиент Prisma (после изменений в schema.prisma)
npx prisma generate

# Открыть Prisma Studio (визуальный интерфейс для БД)
npx prisma studio

# Сбросить базу данных (удалить всё и применить миграции заново)
npx prisma migrate reset

# Применить миграции без создания новой
npx prisma migrate deploy
```

### Запуск приложения

```bash
# Запустить в режиме разработки
npm run dev

# Или запустить напрямую
tsx --env-file=.env src/index.ts

# Для отслеживания изменений
tsx watch --env-file=.env src/index.ts
```


## Связи и структуры

### Пользователь

```javascript
{
  id: 1,
  role: "user",
  email: "oleg@logika.dev",
  email_verified: true,
  phone: "+77001234567",
  city: "Sochi",
  name: "Oleg Nurzhanov",
  avatar: "http://logika.dev/images/users/1/avatar.webp",
  password: "******",
  updated_at: new Date().toISOString(),
  created_at: "2025-12-01T09:15:00.000Z"
}
```

### Категория

```javascript
{
  id: 1,
  name: "Сумки",
  slug: "sumki",
  description: "Кожаные сумки ручной работы",
  image: "http://logika.dev/images/categories/cover.webp",
  parent_id: null, // null - если главная категория, или id родительской категории
  sort_order: 1,
  updated_at: new Date().toISOString(),
  created_at: "2025-12-01T09:15:00.000Z"
}
```

### Товар

```javascript
{
  id: 1,
  sku: "ABC123456",
  slug: "sumka-iz-naturalnoy-kozhi",
  title: "Кожаная сумка ручной работы",
  description: "Элегантная сумка из натуральной кожи ручной работы",
  category_id: 1,
  tags: ["сумка", "кожа", "ручная работа", "новинка"],
  price: 15000,
  discount_price: 13500,
  specifications: {
    material: "Натуральная кожа",
    leather_type: "Телячья кожа премиум-класса",
    color: "Темно-коричневый",
    hardware_color: "Золото/Бронза",
    brand: "Logika",
    weight: 1200,
    dimensions: {
      height: 25,
      width: 35,
      depth: 5
    },
    care_instructions: "Очищать мягкой тканью, использовать крем для кожи",
    warranty: "2 года"
  },
  stock_quantity: 50,
  in_stock: true,
  delivery_time: "1-3 дня",
  rating: 4.8,
  updated_at: new Date().toISOString(),
  created_at: "2025-12-01T09:15:00.000Z"
}
```

### Изображения товаров

```javascript
{
  id: 1,
  product_id: 1,
  url: "http://logika.dev/images/products/1/cover.webp",
  alt: "Вид спереди",
  sort_order: 1,
  created_at: "2025-12-01T09:15:00.000Z"
}
```

### Корзина

```javascript
{
  id: 1,
  user_id: 1,
  updated_at: new Date().toISOString(),
  created_at: "2025-12-01T09:15:00.000Z"
}
```

### Элементы корзины

```javascript
{
  id: 1,
  cart_id: 1, // ← внешний ключ на carts.id
  product_id: 1, // ← внешний ключ на products.id
  quantity: 2,
  added_at: "2025-12-01T09:15:00.000Z"
}
```

### Заказ

```javascript
{
  id: 1,
  user_id: 1,
  status: "pending",
  total_amount: 15000,
  payment_method: "card",
  shipping_address: {
    city: "Sochi",
    street: "ул. Морская, 15",
    postal_code: "354000"
  },
  created_at: "2025-12-01T09:15:00.000Z",
  updated_at: new Date().toISOString()
}
```

### Элементы заказа

```javascript
{
  id: 1,
  order_id: 1,
  product_id: 1,
  quantity: 1,
  price: 15000
}
```

### Отзыв

```javascript
{
  id: 1,
  product_id: 1,
  user_id: 1,
  rating: 5,
  title: "Отличное качество!",
  comment: "Кожа очень приятная на ощупь, швы аккуратные",
  images: ["http://logika.dev/images/reviews/1.webp"],
  verified_purchase: true,
  updated_at: new Date().toISOString(),
  created_at: "2025-12-01T09:15:00.000Z"
}
```

### Избранные товары

```javascript
{
  id: 1,
  user_id: 1,
  product_id: 1,
  created_at: "2025-12-01T09:15:00.000Z"
}
```

