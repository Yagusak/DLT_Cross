# API

## Общие
Аргументы — строки. Ошибки: ERR_BAD_ARGS, ERR_NOT_FOUND, ERR_FORBIDDEN, ERR_STATE_CONFLICT.

### cfa-token
- Issue(symbol, amount, to) → txid
- Redeem(symbol, amount, from) → txid
- BalanceOf(account, symbol) → {"account","symbol","balance"}

### pay-escrow
- CreateEscrow(id,buyer,seller,symbol,amount,deadline,ref) → {"id","status":"LOCKED",...}
- ReadEscrow(id) → Escrow JSON
- ListEscrows(partialKey) → {results:[...], bookmark}
- ReleaseEscrow(id,proof) → {"id","status":"RELEASED"}
- CancelEscrow(id,reason) → {"id","status":"CANCELED"}

### audit-log
- AppendLog(txType, ref, payloadJSON) → txid
- ListLogs(ref, bookmark) → {results:[{ts,txType,ref,payload}], bookmark}
