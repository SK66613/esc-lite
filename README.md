# Escalita Lite v2

Локальный frontend-конструктор Mini App на Vite, React и strict TypeScript. Версия v2 сохраняет интерактивность Vanilla-прототипа, но делает центральной сущностью **Project**, а не Sales Passport.

## Запуск

```bash
npm install
npm run dev
```

Production build и тесты:

```bash
npm run build
npm run test
```

Vite использует относительный `base`, поэтому содержимое `dist/` можно разместить на статическом hosting без backend routes.

## Архитектура

- `src/project/` — Zod schema, Project store, draft/published operations, repository и legacy migration.
- `src/project/validation/` — registry-aware runtime validation; повреждённая известная entity восстанавливается отдельно, а неизвестные future types сохраняются.
- `src/app/editorStore.ts` — только UI-состояние конструктора: route, selection, sheet, preview source/device.
- `src/modules/` — customer-модули и `moduleRegistry`; preview и inspector выбираются registry, а не `if/else` в Builder.
- `src/tools/` — отдельный registry бизнес-инструментов; QR Sales не входит в `modules[]`.
- `src/guards/` — access guards; Telegram subscription не является страницей клиентского приложения.
- `src/templates/` — Coffee House, Beauty Salon, Store и Restaurant создают разные сериализуемые Project blueprints.
- `src/builder/`, `src/preview/`, `src/pages/` — presentation/use-case boundaries.
- `src/styles/tokens.css` — компактный набор общих design tokens.

### Project model

`Project` содержит metadata, theme, navigation, ordered `modules[]`, `guards[]`, `tools[]`, `draftRevision` и опциональный immutable-on-create published snapshot. Любая настройка увеличивает revision. Publish остаётся локальным: он deep-clone'ит draft, записывает revision и ISO timestamp.

Компоненты не используют `localStorage` напрямую. Они работают через Zustand actions, а persistence скрыт интерфейсом `ProjectRepository`. `LocalStorageProjectRepository` можно позже заменить API-реализацией без изменений UI.

### Расширение

**Новый module:** создайте Zod config schema/defaults, `PreviewComponent`, `InspectorComponent`, затем добавьте definition в `src/modules/registry.ts`. Config обязан оставаться JSON-serializable.

**Новый tool:** создайте schema/defaults/settings component в `src/tools/<tool>` и зарегистрируйте definition в `src/tools/registry.ts`.

**Новый guard:** создайте schema/defaults/settings и опциональный preview в `src/guards/<guard>`, затем добавьте definition в `src/guards/registry.ts`. Текущий shape уже различает app/module scope, но сложного rule engine намеренно нет.

**Новый template:** добавьте `TemplateBlueprint` в `src/templates/registry.ts`. Blueprint создаёт новый Project с собственными modules/tools/guards, а не патчит название существующего паспорта.

Применение template к существующему проекту меняет только draft-структуру. `project.id` и предыдущий `published` snapshot сохраняются, а `draftRevision` увеличивается на единицу.

## Persistence и migration

Новый ключ: `escalita-lite-project-v2`. При его отсутствии repository best-effort читает `escalita-lite-demo-v1`, переносит `app.name/category`, Passport, QR и subscription, валидирует результат и сохраняет v2 Project. Повреждённые данные безопасно заменяются Coffee House default project.

## Текущие mock-ограничения

- Нет backend, API, auth, базы данных или Telegram SDK/initData.
- Publish и QR scan полностью локальные; QR не содержит криптографии.
- Проверка подписки и статус бота — интерактивный mock без Telegram API.
- Offers — placeholder, доказывающий multi-module registry. Shop и Booking намеренно не реализованы.
- Один локальный Project; multi-workspace и реальные аккаунты отсутствуют.

## Следующая точка интеграции API

Первой заменяется реализация `ProjectRepository`: UI и stores могут сохранить текущий контракт, а API repository возьмёт на себя load/save/reset и серверную публикацию. Отдельные integrations для payments, Telegram guards и QR должны оставаться за границами соответствующих registries, а не попадать в сериализуемый Project JSON.
