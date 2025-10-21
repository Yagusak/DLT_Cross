#!/usr/bin/env bash
set -euo pipefail
SRC=${1:-chaincode}
DST=/opt/cc/pay-basic
for P in peer0.org1.example.com peer0.org2.example.com; do
  docker exec -i "$P" bash -lc "rm -rf ${DST} && mkdir -p ${DST}"
  docker cp "$SRC"/. "$P:${DST}"
  echo "Synced $SRC -> $P:${DST}"
done
