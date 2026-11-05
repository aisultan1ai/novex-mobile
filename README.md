# Novex — мобильное приложение

Клиентское приложение Novex для iOS и Android: расчёт доставки, оформление и оплата заказа, отслеживание.
Работает с тем же API, что и сайт (`/api/v1`); своего бэкенда нет. Полное ТЗ — [novex-mobile-TZ.md](novex-mobile-TZ.md).

Стек: Expo SDK 58 · React Native · TypeScript strict · expo-router · TanStack Query · zustand · i18next (ru/kk) · Sentry · EAS.

## Быстрый старт

Нужны Node.js 24+ и npm.

```sh
npm install
cp .env.example .env.local   # укажите адрес API
npm start                    # Expo Dev Server, дальше — QR-код или эмулятор
```

`EXPO_PUBLIC_API_URL` — адрес API **вместе с `/api/v1`**. Для телефона в той же Wi-Fi сети указывайте локальный IP
компьютера (`http://192.168.x.x:8000/api/v1`), а не `localhost`. Бэкенд должен слушать `0.0.0.0`.

В приложении есть нативные модули не из Expo Go (Sentry и др.), поэтому для разработки нужна
development-сборка: `npx eas-cli@latest build --profile development` или `npx expo run:android` / `run:ios`.

## Окружения

| Окружение | `APP_ENV` | Профиль EAS | Окружение EAS | API |
|---|---|---|---|---|
| development | `development` | `development` | development | `http://<локальный IP>:8000/api/v1` (`.env.local`) |
| staging | `staging` | `staging` | preview | выдаёт команда Novex |
| production | `production` | `production` | production | `https://<домен Novex>/api/v1` |

- `APP_ENV` задаётся в `eas.json` и влияет на имя приложения и bundle id (`app.config.ts`): у dev и staging
  свои суффиксы, поэтому сборки ставятся рядом с продовой.
- `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_WEB_URL` (ссылки «Поделиться отслеживанием»)
  и `EXPO_PUBLIC_SENTRY_DSN` для staging / production задаются
  в переменных окружения EAS (`eas env:create`), а не в коде.
- Вне development приложение отказывается стартовать с адресом не по HTTPS.
- В приложении нет секретов: всё секретное живёт на бэкенде.

## Типы API

`src/api/schema.d.ts` генерируется из `openapi.json` бэкенда — руками не править.

```sh
npm run api:types
```

CI перегенерирует типы и падает, если результат отличается от закоммиченного. Пока задача B5 не сделана,
`openapi.json` лежит в корне репозитория: новую версию от бэкенда кладите туда же и перегенерируйте типы.

`openapi-typescript` запускается через `npx` с закреплённой версией и в зависимости не входит: он пока
объявляет совместимость только с TypeScript 5, а в проекте TypeScript 6.

## Иконки и логотип

Источник — векторный знак `assets/brand/novex-mark.svg` (копия знака от команды Novex). Из него генерируются
`assets/icon.png` (iOS), `android-icon-foreground.png` / `android-icon-monochrome.png` (адаптивная иконка Android)
и `splash-icon.png`:

```sh
npm i --no-save sharp@0.34.4 && node scripts/generate-icons.js
```

В интерфейсе знак рисует компонент `Logo` (`src/ui/Logo.tsx`) — векторный, резкий на любом экране.

## Команды

| Команда | Что делает |
|---|---|
| `npm start` | Dev Server |
| `npm run lint` | ESLint + Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest + React Native Testing Library |
| `npm run check` | всё сразу, как в CI |
| `npm run api:types` | перегенерировать типы API |
| `npx expo install <пакет>` | добавить зависимость в версии, совместимой с SDK (не `npm install`) |

## Структура

```
app/              маршруты expo-router — тонкие файлы, экран берут из src/features
  (tabs)/         нижняя панель: расчёт, заказы, отследить, уведомления, профиль
  (auth)/         вход, регистрация, восстановление пароля, подтверждение email — одно модальное окно
  quote/ tracking/ checkout/ onboarding.tsx   экраны вне вкладок
src/api/          клиент API: schema.d.ts (генерируется), client.ts, tokens.ts, errors.ts, endpoints/
src/features/     фичи: экран + его компоненты, хуки react-query, формы и своё состояние (zustand)
  quote/          расчёт и тарифы       tracking/   трекинг, офлайн-кэш, Live Activities
  cities/         выбор города          address/    поля адреса со Smart Paste
  orders/         заказы-билеты         notifications/ лента уведомлений
  profile/        профиль и настройки   onboarding/ первый запуск, анимированные сцены
  auth/ session/  вход и сессия         placeholder/ заглушки будущих экранов
src/ui/           дизайн-система v2: tokens.ts, стекло (glass/), компоненты и иллюстрации (см. ниже)
src/store/        общее состояние приложения: язык, тема, статус сессии
src/lib/          без React-экранов: форматирование, города, статусы, формы, haptics, Sentry, react-query
src/i18n/         ru.json, kk.json, настройка i18next
assets/           иконки и сплэш (генерируются из assets/brand/novex-mark.svg)
scripts/          generate-icons.js
__tests__/        тесты (*.test.ts / *.test.tsx) и mocks/ для Jest
```

Направление зависимостей: `app → features → ui / lib / api / store`. `ui`, `lib` и `api` не импортируют фичи.

## Дизайн-система (v2)

Описание — [DESIGN-TZ.md](DESIGN-TZ.md), макеты — `docs/design-v2/screens`. Коротко:

- **Токены** (`src/ui/tokens.ts`): белый фон, cyan — только CTA и выбранное, navy — цены и активная вкладка;
  шрифт Inter (Space Grotesk — только словесный знак). Контраст пар текст/фон обеих тем проверяет
  `__tests__/tokens.test.ts`.
- **Стекло** (`src/ui/glass`): `GlassSurface` на `expo-blur` с фолбэком при «Уменьшить прозрачность».
  На Android размытие работает только поверх `BlurTargetView`: прокручиваемая часть `Screen` — цель размытия,
  стеклянные панели (`footer`, `overlay`, таб-бар) лежат вне её.
- **Экран** (`Screen`): `withTabBar` для вкладок — таб-бар плавает поверх, отступ снизу даёт `useScreenInsets()`.
- **Компоненты**: Button, TextField (outlined / filled), Chip, SelectableCard, StatTile, ListGroup, Switch, Sheet,
  StatusDot, Timeline, RouteCodes, CarrierLogo, TicketCard, BottomBar, TabBar, LargeTitle, SearchField,
  иллюстрации (`src/ui/illustrations.tsx`). Все анимации отключаются при «Уменьшить движение».
- **Коды городов** (`src/lib/cityCodes.ts`): IATA, иначе транслит; рядом всегда полное название.
- **Логотипы перевозчиков**: `assets/carriers` (с сайта Novex), Exline переведён в PNG.
- **Тесты**: Reanimated в Jest заменён своим моком `__tests__/mocks/reanimated.tsx` (официальный в этой связке
  версий падает); путь `react-native-reanimated/mock` указывает на него через `moduleNameMapper`.

## Правила (ТЗ, раздел 4)

1. Экраны не вызывают `fetch` — только `src/api` и хуки из `src/features`. **Проверяет ESLint.**
2. Типы запросов и ответов — только из `schema.d.ts`, свои дубли запрещены.
3. Цвета, шрифты, отступы — только из `src/ui/tokens.ts`; хекс-коды в `app/` и `src/features/` **ловит ESLint.**
4. Все строки интерфейса — через `t('…')`. Ключи типизированы: опечатка в ключе — ошибка компиляции.
   Наборы ключей ru и kk сверяет тест.
5. Каждый экран обрабатывает загрузку, пустое состояние, ошибку с «Повторить» и отсутствие сети
   (`<StateView>`).

## Авторизация

Свои эндпоинты у приложения: `/mobile/auth/login`, `/refresh`, `/logout` (ТЗ 5.2). Регистрация и
восстановление пароля — общие с сайтом (`/auth/*`). Cookie приложение не использует.

- Access-токен — в заголовке `Authorization: Bearer …`, язык — в `X-Locale`. Оба ставит клиент.
- `device_id` — UUID, создаётся при первом запуске (`src/api/deviceId.ts`) и уходит во вход, обновление и выход.
- При `401` клиент один раз вызывает `/mobile/auth/refresh` и повторяет запрос; параллельные запросы ждут
  одного обновления. Каждая новая пара токенов сохраняется целиком (старый refresh-токен перестаёт работать).
  Если обновить не удалось — токены стираются, сессия переходит в `signedOut`. Без сети сессия не сбрасывается.
- Токены и `device_id` хранятся только в `expo-secure-store` (Keychain / Keystore).
- Регистрация — `/auth/register`, сразу после неё приложение входит тем же паролем и просит подтвердить email
  (без подтверждения можно считать, но не оплачивать). Ссылки из писем ведут на `/verify-email?token=…` и
  `/reset-password?token=…` — в приложении есть маршруты с теми же путями; пока нет deep links (этап 3),
  ссылки открывают сайт. На этих путях и на `/auth/forgot-password` ответ 401 значит «ссылка недействительна»,
  токен сессии клиент из-за него не обновляет.
- Ссылки на политику и условия в форме регистрации берутся из `EXPO_PUBLIC_WEB_URL`; без него — только текст согласия.

**Пока `/mobile/auth/*` нет в `openapi.json`:** их типы временно описаны в `src/api/mobileAuth.ts` (помечены
`TODO(B1)`). Когда придёт PR с новой схемой — заменить их на типы из `schema.d.ts`.
Для разработки есть мок: `EXPO_PUBLIC_MOCK_MOBILE_AUTH=true` в `.env.local` (только development).
Вход идёт через сайтовый `/auth/login`, поэтому данные настоящие, но токен не обновляется — примерно через
60 минут приложение снова попросит войти.

## Сборка и релизы

```sh
npx eas-cli@latest login
npx eas-cli@latest init                            # один раз: привязать проект к EAS
npx eas-cli@latest build --profile staging         # TestFlight / внутренний тест Google Play
npx eas-cli@latest submit --profile staging
npx eas-cli@latest update --channel staging        # OTA-обновление JS без новой сборки
```
