# Учёт выдачи техники

Веб-приложение для ведения организаций, сотрудников и документов выдачи техники. Включает защищённую административную панель, журнал с сортировкой и фильтрацией, экспорт в Excel, светлую/тёмную тему и аудит изменений.

## Возможности

- вход по email и паролю, access/refresh JWT и ротация сессии;
- создание новых администраторов и смена собственного пароля;
- CRUD организаций, сотрудников, видов и состояний техники, статусов документов;
- защита от удаления используемых справочных записей;
- создание, редактирование и удаление документов выдачи;
- поиск сотрудников по ФИО с фильтрацией по организации;
- полнотекстовый поиск по организации, сотруднику, технике, модели и серийному номеру;
- сортировка по любой колонке, фильтр по статусу и серверная пагинация;
- предупреждение о повторном серийном номере в одном статусе;
- экспорт отфильтрованного журнала в `.xlsx`;
- адаптивный интерфейс и темы, сохраняемые в `localStorage`;
- журналирование создания, изменения и удаления данных.

## Быстрый запуск

Требуются Docker Engine и Docker Compose v2.

1. Скопируйте файл настроек:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Сгенерируйте секрет JWT и укажите его в `.env`. Пример для PowerShell:

   ```powershell
   $bytes = New-Object byte[] 48
   [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
   [Convert]::ToBase64String($bytes)
   ```

3. Обязательно замените в `.env`:

   - `POSTGRES_PASSWORD`;
   - `JWT_SECRET` — минимум 32 случайных символа;
   - `INITIAL_ADMIN_EMAIL`;
   - `INITIAL_ADMIN_PASSWORD` — минимум 12 символов.

4. Соберите и запустите приложение:

   ```powershell
   docker compose up --build -d
   ```

5. Откройте <http://localhost:8080> и войдите с данными `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`.

Миграции Alembic применяются автоматически перед запуском backend. Начальные справочники «Новый», «БУ», «Ноутбук», «Планшет», «Смартфон», «У сотрудника» и «Закрыт» создаются при первом старте. Данные PostgreSQL сохраняются в именованном volume `postgres_data`.

## Управление

```powershell
# Состояние контейнеров
docker compose ps

# Логи
docker compose logs -f

# Остановить без удаления данных
docker compose down

# Создать резервную копию БД
docker compose exec -T db pg_dump -U tech_center tech_center > backup.sql
```

Для производственного HTTPS-развёртывания установите `COOKIE_SECURE=true`, задайте фактический HTTPS-origin в `CORS_ORIGINS` и разместите приложение за TLS reverse proxy. Не публикуйте `.env` в Git.

## Локальная разработка

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
$env:JWT_SECRET = "local-development-secret-with-32-chars"
$env:DATABASE_URL = "postgresql+asyncpg://tech_center:password@localhost:5432/tech_center"
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Vite проксирует `/api` на `http://localhost:8000`. Документация OpenAPI доступна по адресу <http://localhost:8000/api/docs>.

## Проверки

```powershell
cd backend
ruff check .
pytest

cd ..\frontend
npm run lint
npm run build

cd ..
docker compose config
docker compose build
```

## Архитектура

```text
Browser
  └─ Nginx :8080
      ├─ React SPA
      └─ /api → FastAPI :8000
                   ├─ async SQLAlchemy
                   ├─ Alembic
                   └─ PostgreSQL
```

Backend разделён на модели, схемы, зависимости безопасности и доменные роутеры. На уровне БД установлены внешние ключи `RESTRICT`, уникальные ограничения и индексы для основных фильтров. Frontend использует типизированный API-клиент, контексты авторизации и темы, а также защищённый роутинг.

## API

Основные группы:

- `/api/auth/*` — вход, refresh, выход, профиль, пароль и администраторы;
- `/api/organizations`, `/api/employees`, `/api/device-types`, `/api/conditions`, `/api/document-statuses`;
- `/api/documents` — журнал, CRUD, проверка серийного номера и XLSX-экспорт;
- `/health` — health check.

Все прикладные endpoints, кроме входа и refresh, требуют `Authorization: Bearer <token>`.
