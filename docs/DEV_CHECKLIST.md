
Чеклист разработчика

 Установлен Fabric test-network с CouchDB и TLS.

 Заполнен .env из env.example, source .env

 ./scripts/deploy.sh выполнен без ошибок

 ./scripts/smoke.sh вернул балансы и логи

 npm ci && npm run lint && npm test проходят

 Эмиссия токена доступна только для admin (атрибуты серта)

 Индексы загружены и запросы по selector работают
