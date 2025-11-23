#!/usr/bin/env bash
set -euo pipefail
[ -f ./.env ] && set -a && . ./.env && set +a
run(){ echo ">> $*"; eval "$*"; }

run "./scripts/client-cli.sh invoke cfa-token Issue '[\"1000000\",\"admin\"]'"
run "./scripts/client-cli.sh invoke pay-escrow CreateEscrow '[\"escrow#1\",\"buyerA\",\"sellerB\",\"10000\",\"RUB\"]'"
run "./scripts/client-cli.sh query  pay-escrow ReadEscrow  '[\"escrow#1\"]'"
run "./scripts/client-cli.sh invoke pay-escrow ReleaseEscrow '[\"escrow#1\"]'"
run "./scripts/client-cli.sh query  cfa-token BalanceOf '[\"buyerA\"]'"
run "./scripts/client-cli.sh query  cfa-token BalanceOf '[\"sellerB\"]'"
run "./scripts/client-cli.sh invoke audit-log AppendLog '[\"Release\",\"escrow#1\",\"{\\\"by\\\":\\\"oracle\\\"}\"]'"
run "./scripts/client-cli.sh query  audit-log ListLogsByRef  '[\"escrow#1\"]'"
