# Escalita Lite v2

AI-first конструктор Telegram Mini App на Vite, React, strict TypeScript и Cloudflare Workers. Центральная сущность — сериализуемый `Project`; AI не генерирует runtime-код, а предлагает валидируемый `AIPlan`, который применяется существующим executor только после подтверждения пользователя.

## Запуск

```bash
npm install
npm run dev
```

В обычном Vite dev используется `MockAIPlanner`, поэтому локальная разработка не требует Telegram auth или реального AI key.

Production build и тесты:

```bash
npm run build
npm run test
```

## Архитектура

- `src/project/` — Zod schema, Project store, draft/published operations, repository и legacy migration.
- `src/project/validation/` — registry-aware runtime validation.
- `src/ai/` — AIPlan/actions, Capability Manifest, Mock/Remote planner, Proposal → Apply UI и executor boundary.
- `src/modules/`, `src/tools/`, `src/guards/` — независимые registries возможностей Mini App.
- `src/templates/` — Coffee House, Beauty Salon, Store и Restaurant blueprints.
- `worker/` — Cloudflare Worker API для реального AI и Telegram Mini App authentication.

## Production AI

Production `RemoteAIPlanner` вызывает same-origin `POST /api/ai/plan`. Browser передаёт текущий draft Project, Capability Manifest, пользовательский intent и bounded conversation context. Сырые Telegram `initData` передаются только в заголовке `X-Telegram-Init-Data` и не включаются в AI body/prompt.

Worker проверяет `Telegram.WebApp.initData` через HMAC-SHA-256 с `TELEGRAM_BOT_TOKEN`, проверяет `auth_date` (TTL 24 часа), после чего rate limit применяется к подтверждённому Telegram user id. Клиентский Capability Manifest не является единственным источником авторизации: Worker дополнительно проверяет capability identifiers по server-owned allowlist и повторно валидирует AIPlan.

Необходимые Cloudflare secrets:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

Опционально можно задать `OPENAI_MODEL`. Значения секретов никогда не должны попадать в Git, Vite env или frontend bundle.

Диагностика без расходования AI tokens:

```text
GET /api/health
```

Endpoint возвращает только boolean `aiConfigured` и `telegramAuthConfigured`.

## AI safety

- AI не публикует приложение автоматически и не изменяет published snapshot.
- Все изменения сначала показываются как Proposal и требуют `Применить`.
- Максимум 20 actions в одном плане.
- Narrow follow-up requests не имеют права заменять приложение template-ом.
- Shop/Booking не симулируются, пока соответствующие capabilities реально не зарегистрированы.
- Conversation context ограничен 8 turns / 6000 символов и не хранится в Project.
- Logs содержат request id, безопасный user hash, model, duration, action count и aggregate token usage, но не prompt, Project, message, conversation, initData или secrets.

## Persistence и publish

Project пока хранится локально через `ProjectRepository`/LocalStorage adapter. Draft/Published snapshots остаются локальными. Backend project persistence, accounts и реальный publish backend ещё не реализованы.

## Текущие ограничения

- Rate limiter isolate-local in-memory; для публичного high-volume запуска потребуется распределённое хранилище.
- Conversation не сохраняется после reload.
- Server capability allowlist пока синхронизируется вручную с registries; следующим архитектурным шагом должен стать единый server-owned capability catalog.
- Offers остаётся placeholder; полноценные Shop и Booking ещё не реализованы.
- Нет billing/token accounting и long-term AI memory.
