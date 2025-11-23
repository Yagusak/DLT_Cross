# Pay Escrow for Hyperledger Fabric

Набор чейнкодов и вспомогательных скриптов для MVP эскроу-платежей поверх Hyperledger Fabric. Репозиторий содержит контракты для токена, эскроу и аудит-лога, а также bash-скрипты для сборки и развертывания в test-network из `fabric-samples`.

## Что внутри
- `src/` — чейнкод `pay-escrow` (TypeScript → Node.js runtime).
- `scripts/` — автоматизация: упаковка/установка/коммит chaincode, CLI-клиент, smoke-тесты.
- `docs/` — спецификация API, индексы CouchDB и чек-лист разработки.
- `env.example` / `.env` — пример конфигурации окружения для скриптов.

## Требования
- Docker и Docker Compose.
- Node.js 16 (соответствует runtime `fabric-chaincode-node` 2.5.x) — нужен при упаковке chaincode.
- Fabric peer CLI в `PATH` (совместимые с Fabric 2.5.x).
- Развёрнутый `fabric-samples/test-network` (CouchDB, два орга). Пример запуска:
  ```bash
  cd ~/fabric-samples/test-network
  ./network.sh up createChannel -c mychannel -ca -s couchdb
  ```

## Настройка окружения
1. Скопируйте шаблон переменных и при необходимости поправьте значения под своё окружение:
   ```bash
   cp env.example .env
   ```
   Поля `.env` используются всеми скриптами. Можно сразу экспортировать:
   ```bash
   source .env
   ```
2. Проверьте, что `CC_PATH` указывает на путь к исходникам чейнкода внутри контейнера peer.
3. Убедитесь, что файлы TLS и MSP доступны согласно путям `TLS_CA` и `ADMIN_MSP`.

### Переменные окружения
| Переменная | Назначение |
| --- | --- |
| `CHANNEL` | Имя канала для установки chaincode. |
| `CCNAME` | Системное имя (chaincode name) для коммитов и вызовов. |
| `LABEL` | Метка пакета при упаковке chaincode. |
| `SEQUENCE` | Версия sequence для обновления chaincode. |
| `VERSION` | Версия chaincode в метаданных. |
| `ORDERER` | Адрес orderer (`host:port`). |
| `ORG1_PEER` / `ORG2_PEER` | Пиры, участвующие в эндорсменте. |
| `TLS_ENABLED` | `true/false`, включает TLS в CLI-вызовах. |
| `TLS_CA` | Путь к корневому TLS сертификату. |
| `ADMIN_MSP` | Директория с материалами MSP администратора для установки. |
| `CC_PATH` | Путь к исходникам чейнкода внутри peer-контейнера. |
| `CORE_PEER_LOCALMSPID` | MSP ID организации по умолчанию. |

## Быстрый старт
```bash
# подготовка окружения
git clone <repo> && cd DLT_Cross
cp env.example .env && source .env

# если исходники нужно скопировать внутрь peer-контейнера
./scripts/sync-cc.sh chaincode

# упаковка, install/approve/commit и smoke-тесты
./scripts/deploy.sh
./scripts/smoke.sh
```

## Вызовы через CLI
Универсальный клиент: `./scripts/client-cli.sh <invoke|query> <namespace> <function> '<JSON-args>'`

### Неймспейсы и методы (фактические сигнатуры)
- **cfa-token**:
  - `Issue(amount, account)` — пополнение счёта (только админ Org1).
  - `Redeem(amount, account)` — списание со счёта (только админ Org1).
  - `BalanceOf(account)` — баланс счёта.
- **pay-escrow**:
  - `CreateEscrow(id, buyer, seller, amount, currency)`
  - `ReadEscrow(id)`
  - `ListEscrows()` — полный список эскроу-договоров.
  - `ReleaseEscrow(id)`
  - `CancelEscrow(id)`
- **audit-log**:
  - `AppendLog(txType, ref, payloadJSON)`
  - `ListLogsByRef(ref)`

### Примеры
```bash
# Токен (работает только под Org1 admin MSP)
./scripts/client-cli.sh invoke cfa-token Issue '["1000","admin"]'
./scripts/client-cli.sh query  cfa-token BalanceOf '["buyerA"]'

# Эскроу
./scripts/client-cli.sh invoke pay-escrow CreateEscrow '["e#1","buyerA","sellerB","5000","RUB"]'
./scripts/client-cli.sh query  pay-escrow ReadEscrow '["e#1"]'
./scripts/client-cli.sh invoke pay-escrow ReleaseEscrow '["e#1"]'

# Аудит
./scripts/client-cli.sh invoke audit-log AppendLog '["Release","e#1","{\"by\":\"oracle\"}"]'
./scripts/client-cli.sh query  audit-log ListLogsByRef '["e#1"]'
```

## Ошибки и диагностика
- Частые коды ошибок chaincode: `ERR_BAD_ARGS`, `ERR_NOT_FOUND`, `ERR_FORBIDDEN`, `ERR_STATE_CONFLICT` (описаны в `docs/API.md`).
- `no source files in CC_PATH` — проверьте `CC_PATH` и наличие `package.json` внутри контейнера peer.
- `orderer … deadline exceeded` — убедитесь, что `test-network` запущен и порт `7050` доступен.

## Как обновить ветку, если README конфликтует
Самая частая точка расхождения с основной веткой — этот README. Если git ругается на конфликты при создании PR:

1. Подтяните свежий `main` и перебазируйте свою ветку:
   ```bash
   git fetch origin
   git checkout work
   git rebase origin/main
   ```
2. Разрешая конфликт в `README.md`, сохраняйте текущие таблицы CLI-сигнатур и раздел «Быстрый старт». Новые правки из `main` можно аккуратно влить сверху, но не удаляйте примеры вызовов.
3. После фиксации ребейза запустите проверочный скрипт: `./scripts/smoke.sh` — он подтвердит, что документация и интерфейсы CLI соответствуют коду.
4. Запушьте обновлённую ветку: `git push --force-with-lease`.

## Дополнительные материалы
- Подробности API и индексов: `docs/API.md`, `docs/COUCHDB_INDEXES.md`.
- Политики и схемы вызовов: `docs/README-FABRIC-BACKEND.md`.
- Чек-лист разработчика: `docs/DEV_CHECKLIST.md`.

## История версий
- v3.14 — базовый код и CouchDB индексы.
- v3.15 — MVP pack: скрипты, шаблон env и документация.
