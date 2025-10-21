# pay-escrow • Fabric MVP

## Быстрый старт (WSL2)
```bash
cp env.example .env && source .env
./scripts/deploy.sh
./scripts/smoke.sh

Как вызывать API (через CLI-обёртку)

Все методы вызываются как:

./scripts/client-cli.sh <invoke|query> <fn> '<JSON-args>'


Где <fn> — имя функции чейнкода (неймспейс в первом аргументе), <JSON-args> — массив строк.

Неймспейсы и функции

cfa-token

Issue(symbol, amount, to) → txid

Redeem(symbol, amount, from) → txid

BalanceOf(account, symbol) → {"account","symbol","balance"}

pay-escrow

CreateEscrow(id,buyer,seller,symbol,amount,deadline,ref) → {"id","status":"LOCKED",...}

ReadEscrow(id) → объект эскроу

ListEscrows(partialKey) → {results:[...], bookmark}

ReleaseEscrow(id,proof) → {"id","status":"RELEASED"}

CancelEscrow(id,reason) → {"id","status":"CANCELED"}

audit-log

AppendLog(txType, ref, payloadJSON) → txid

ListLogs(ref, bookmark) → {results:[{ts,txType,ref,payload}], bookmark}

Примеры вызовов
# Токен
./scripts/client-cli.sh invoke cfa-token Issue '["RUB","1000","admin"]'
./scripts/client-cli.sh query  cfa-token BalanceOf '["buyerA","RUB"]'

# Эскроу
./scripts/client-cli.sh invoke pay-escrow CreateEscrow '["e#1","buyerA","sellerB","RUB","5000","2025-12-31","inv#42"]'
./scripts/client-cli.sh query  pay-escrow ReadEscrow '["e#1"]'
./scripts/client-cli.sh invoke pay-escrow ReleaseEscrow '["e#1","ok_by_oracle"]'

# Аудит
./scripts/client-cli.sh invoke audit-log AppendLog '["Release","e#1","{\"by\":\"oracle\"}"]'
./scripts/client-cli.sh query  audit-log ListLogs '["e#1",""]'

Аргументы и ошибки

Все аргументы — строки.

Коды ошибок: ERR_BAD_ARGS, ERR_NOT_FOUND, ERR_FORBIDDEN, ERR_STATE_CONFLICT.

Интеграция с бэком

Вызывайте функции через REST-шлюз или напрямую через peer CLI аналогично примерам.

Сохраняйте txid и payload ответов, валидируйте статусы LOCKED/RELEASED/CANCELED.

Для листингов используйте ListEscrows и пагинацию по bookmark.

Сервисные скрипты

scripts/deploy.sh — package/install/approve/commit.

scripts/client-cli.sh — invoke/query.

scripts/smoke.sh — e2e сценарий Issue→Create→Read→Release→Balances→Audit.
