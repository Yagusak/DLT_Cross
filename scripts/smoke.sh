#!/usr/bin/env bash
set -euo pipefail
[ -f ./.env ] && set -a && . ./.env && set +a
run(){ echo ">> $*"; eval "$*"; }

run "./scripts/client-cli.sh invoke cfa-token Issue '[\"RUB\",\"1000000\",\"admin\"]'"
run "./scripts/client-cli.sh invoke pay-escrow CreateEscrow '[\"escrow#1\",\"buyerA\",\"sellerB\",\"RUB\",\"10000\",\"2025-12-31\",\"invoice#42\"]'"
run "./scripts/client-cli.sh query  pay-escrow ReadEscrow  '[\"escrow#1\"]'"
run "./scripts/client-cli.sh invoke pay-escrow ReleaseEscrow '[\"escrow#1\",\"ok_by_oracle\"]'"
run "./scripts/client-cli.sh query  cfa-token BalanceOf '[\"buyerA\",\"RUB\"]'"
run "./scripts/client-cli.sh query  cfa-token BalanceOf '[\"sellerB\",\"RUB\"]'"
run "./scripts/client-cli.sh invoke audit-log AppendLog '[\"Release\",\"escrow#1\",\"{\\\"by\\\":\\\"oracle\\\"}\"]'"
run "./scripts/client-cli.sh query  audit-log ListLogs  '[\"escrow#1\",\"\"]'"
