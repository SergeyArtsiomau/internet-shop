## Бакалея Побережья — витрина на Next.js

Учебный интернет‑магазин с полным циклом: регистрация, каталог и CRUD через [Otus REST API](http://19429ba06ff2.vps.myjino.ru/api), корзина, создание заказа, управление статусом, сохранение сессии в `localStorage`, обработка `errors[]` сервера с `fieldName`, Vitest‑тесты на хелперы.

### Переменные окружения

Скопируйте `.env.example` → `.env.local`.

- `NEXT_PUBLIC_API_URL` — корень REST (не забудьте `/api`).
- `NEXT_PUBLIC_COMMAND_ID` — произвольный идентификатор команды; делит данные между группами.
- `NEXT_PUBLIC_BASE_PATH` — если нужен деплой в подпапку (например, GitHub Pages).

### Локально

```bash
npm install
npm run dev
```

### Тесты и качество

```bash
npm run test   # Vitest + Testing Library окружение
npm run lint
```

### Production / статический экспорт

Конфигурация включает `output: 'export'` — сборка попадает в каталог `out/`. Для страниц этого достаточно: все запросы к API выполняются на клиенте.

```bash
npm run build
```

Деплой: загрузите `out/` на любой статический хостинг (GitHub Pages, Cloudflare Pages, Netlify Drop и т.д.). При GitHub Pages укажите `NEXT_PUBLIC_BASE_PATH` вида `/имя‑репозитория`.

### Основные маршруты

- `/` — каталог с пагинацией, фильтром категорий и сортировкой.
- `/cart` — корзина, оформление заказа.
- `/orders` — список заказов пользователя со сменой статуса через `PATCH`.
- `/categories`, `/profile` — защищённые экраны (редирект на `/login`).

Фронт живёт отдельно от серверного репозитория `otus-rest-server`.
