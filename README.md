# pay-escrow • Fabric MVP

## Быстрый старт
```bash
cp env.example .env && source .env
./scripts/sync-cc.sh chaincode     # если CC_PATH пакуется внутри peer
./scripts/deploy.sh
./scripts/smoke.sh

Prereq

Docker и docker-compose

Fabric binaries в PATH (peer version)

Test-network:

cd ~/fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca -s couchdb

.env ключи

CHANNEL | CCNAME | ORDERER | ORG1_PEER | ORG2_PEER | TLS_CA | CC_PATH | ADMIN_MSP

Как вызывать API через CLI

Сигнатура:

./scripts/client-cli.sh <invoke|query> <namespace> <function> '<JSON-args>'


Все аргументы — строки.

Неймспейсы и функции

cfa-token

Issue(symbol, amount, to) → txid

Redeem(symbol, amount, from) → txid

BalanceOf(account, symbol) → {"account","symbol","balance"}

pay-escrow

CreateEscrow(id,buyer,seller,symbol,amount,deadline,ref) → {"id","status":"LOCKED",...}

ReadEscrow(id) → Escrow JSON

ListEscrows(partialKey) → {results:[...], bookmark}

ReleaseEscrow(id,proof) → {"id","status":"RELEASED"}

CancelEscrow(id,reason) → {"id","status":"CANCELED"}

audit-log

AppendLog(txType, ref, payloadJSON) → txid

ListLogs(ref, bookmark) → {results:[{ts,txType,ref,payload}], bookmark}

Примеры
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

Коды ошибок

ERR_BAD_ARGS, ERR_NOT_FOUND, ERR_FORBIDDEN, ERR_STATE_CONFLICT.

Troubleshooting

no source files in CC_PATH → проверь CC_PATH и наличие package.json в контейнере.

orderer … deadline exceeded → подними test-network и проверь порт 7050.

Версии

v3.14 — код и индексы.

v3.15 — MVP pack: scripts/, env.example, этот README, docs/.
