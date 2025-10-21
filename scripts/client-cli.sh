#!/usr/bin/env bash
set -euo pipefail
[ -f ./.env ] && set -a && . ./.env && set +a
: "${CHANNEL:?}"; : "${CCNAME:?}"; : "${ORG1_PEER:?}"; : "${ORDERER:?}"
ADMIN_MSP=${ADMIN_MSP:-/tmp/adminmsp}
TLS_ENABLED=${TLS_ENABLED:-true}
TLS_CA=${TLS_CA:-/etc/hyperledger/fabric/tls/ca.crt}

MODE=${1:-query}; shift || true
FN=${1:-}; shift || true
ARGS=${1:-"[]"}; shift || true
PEER=${PEER:-peer0.org1.example.com}

docker exec -i "$PEER" bash -lc "
  set -e
  export CORE_PEER_LOCALMSPID=Org1MSP
  export CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP}
  export CORE_PEER_TLS_ENABLED=${TLS_ENABLED}
  export CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CA}
  export CORE_PEER_ADDRESS=${ORG1_PEER}
  if [ \"$MODE\" = invoke ]; then
    peer chaincode invoke -C ${CHANNEL} -n ${CCNAME} -c '{\"Args\":[\"${FN}\",${ARGS}]}' $( [ \"${TLS_ENABLED}\" = true ] && echo --tls --cafile ${TLS_CA} ) -o ${ORDERER}
  else
    peer chaincode query  -C ${CHANNEL} -n ${CCNAME} -c '{\"Args\":[\"${FN}\",${ARGS}]}'
  fi
"
