# CouchDB индексы и ключи

Префиксы ключей:
- Escrow: escrow#<id>
- Balance: bal#<account>#<symbol>
- Audit: aud#<ref>#<ts>

Индексы (ddoc-примеры):
- EscrowStatus
{
  "index":{"fields":[{"docType":"asc"},{"status":"asc"},{"seller":"asc"}]},
  "ddoc":"idxEscrowStatus","name":"EscrowStatus","type":"json","partitioned":false
}
- AuditByRef
{
  "index":{"fields":[{"docType":"asc"},{"ref":"asc"},{"ts":"desc"}]},
  "ddoc":"idxAuditRef","name":"AuditByRef","type":"json","partitioned":false
}

Selector-примеры:
- {"docType":"escrow","status":"LOCKED","seller":"sellerB"}
- {"docType":"audit","ref":"escrow#1"}
