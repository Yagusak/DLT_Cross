# Fabric backend: вызовы и файлы

## Неймспейсы
- cfa-token:* → Issue, Redeem, BalanceOf
- pay-escrow:* → CreateEscrow, ReadEscrow, ListEscrows, ReleaseEscrow, CancelEscrow
- audit-log:* → AppendLog, ListLogs

## Политики
- Endorsement: OR('Org1MSP.peer','Org2MSP.peer')
- Эмиссия токена только админом (атрибут/роль проверяется в чейнкоде)

## Файлы
- scripts/deploy.sh — package/install/approve/commit
- scripts/client-cli.sh — invoke/query
- scripts/smoke.sh — e2e сценарий
- docs/API.md — сигнатуры, ошибки
- docs/COUCHDB_INDEXES.md — индексы и селекторы
