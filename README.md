# Товары для дома от Бобби

Клиентский интернет-магазин на **Next.js 15** с интеграцией [Otus REST API](http://19429ba06ff2.vps.myjino.ru/api): каталог, корзина, заказы, категории, профиль и авторизация.

## Возможности

- Регистрация и вход, JWT в `localStorage`
- Каталог: фильтр по категориям, поиск, сортировка, пагинация
- CRUD товаров и категорий (для авторизованных)
- Корзина с оформлением заказа
- Список заказов и смена статуса
- Профиль: имя (ник), смена пароля
- Светлая / тёмная / системная тема
- Ошибки API с привязкой к полям форм

## Стек

- Next.js 15 (App Router), React 19
- TanStack Query, Zustand, react-hook-form, Zod
- Tailwind CSS 4
- Vitest

## Переменные окружения

Скопируйте `.env.example` в `.env.local`:

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_API_URL` | Базовый URL API, с суффиксом `/api` |
| `NEXT_PUBLIC_COMMAND_ID` | Идентификатор команды (общий для группы) |
| `NEXT_PUBLIC_BASE_PATH` | Опционально, для деплоя в подпапку |

## Запуск

```bash
npm install
npm run dev
```

Приложение: [http://localhost:3000](http://localhost:3000) (порт может отличаться, если занят).

## Скрипты

```bash
npm run dev      # разработка
npm run build    # production-сборка
npm run start    # запуск после build
npm run lint     # ESLint
npm run test     # Vitest
```

## Маршруты

| Путь | Описание |
|------|----------|
| `/` | Каталог товаров |
| `/cart` | Корзина и оформление заказа |
| `/orders` | Заказы (нужен вход) |
| `/categories` | Управление категориями (нужен вход) |
| `/profile` | Профиль (нужен вход) |
| `/login`, `/register` | Авторизация |

## Структура `src/`

```
src/
  app/              страницы App Router
  components/       UI, каталог, layout, auth
  hooks/            клиентские хуки
  lib/              HTTP, env, ошибки API, медиа-URL
  services/         вызовы REST API
  store/            Zustand (auth, cart, theme)
  types/            типы данных
```

Название магазина в интерфейсе задаётся в `src/lib/site.ts` (`SHOP_NAME`).

## Сборка и деплой

Проект рассчитан на клиентские запросы к API. Для статического хостинга в `next.config` может быть включён `output: 'export'` — проверьте актуальный конфиг перед деплоем.

```bash
npm run build
```

## Тесты

Покрыты хелперы: разбор ошибок API, URL медиа, логика корзины (`src/**/*.test.ts`).
