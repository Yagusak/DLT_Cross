#!/usr/bin/env bash
set -euo pipefail
[ -f ./.env ] && set -a && . ./.env && set +a
: "${CHANNEL:?}"; : "${CCNAME:?}"; : "${LABEL:?}"; : "${SEQUENCE:?}"; : "${VERSION:?}"
: "${ORG1_PEER:?}"; : "${ORG2_PEER:?}"; : "${ORDERER:?}"; : "${CC_PATH:?}"
ADMIN_MSP=${ADMIN_MSP:-/tmp/adminmsp}
TLS_ENABLED=${TLS_ENABLED:-true}
TLS_CA=${TLS_CA:-/etc/hyperledger/fabric/tls/ca.crt}
PKG=/tmp/${CCNAME}.tgz

for P in peer0.org1.example.com peer0.org2.example.com; do
  MSP=$( [ "$P" = peer0.org1.example.com ] && echo Org1MSP || echo Org2MSP )
  ADDR=$( [ "$P" = peer0.org1.example.com ] && echo ${ORG1_PEER} || echo ${ORG2_PEER} )
  docker exec -i "$P" bash -lc "
    set -e
    export CORE_PEER_LOCALMSPID=$MSP
    export CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP}
    export CORE_PEER_TLS_ENABLED=${TLS_ENABLED}
    export CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CA}
    export CORE_PEER_ADDRESS=${ADDR}
    test -d ${CC_PATH}  # код ДОЛЖЕН существовать в контейнере
    peer lifecycle chaincode package ${PKG} --path ${CC_PATH} --lang node --label ${LABEL}
    peer lifecycle chaincode install ${PKG}
  "
done

PKGID=$(docker exec -i peer0.org1.example.com bash -lc "peer lifecycle chaincode queryinstalled" | sed -n "s/^Package ID: \(.*${LABEL}\), Label: .*/\1/p")
[ -n "$PKGID" ] || { echo "PKGID not found"; exit 1; }

for P in peer0.org1.example.com peer0.org2.example.com; do
  MSP=$( [ "$P" = peer0.org1.example.com ] && echo Org1MSP || echo Org2MSP )
  ADDR=$( [ "$P" = peer0.org1.example.com ] && echo ${ORG1_PEER} || echo ${ORG2_PEER} )
  docker exec -i "$P" bash -lc "
    set -e
    export CORE_PEER_LOCALMSPID=$MSP
    export CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP}
    export CORE_PEER_TLS_ENABLED=${TLS_ENABLED}
    export CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CA}
    export CORE_PEER_ADDRESS=${ADDR}
    peer lifecycle chaincode approveformyorg -o ${ORDERER} --channelID ${CHANNEL} --name ${CCNAME} \
      --version ${VERSION} --package-id ${PKGID} --sequence ${SEQUENCE} \
      $( [ \"${TLS_ENABLED}\" = true ] && echo --tls --cafile ${TLS_CA} )
  "
done

docker exec -i peer0.org1.example.com bash -lc "
  set -e
  export CORE_PEER_LOCALMSPID=Org1MSP
  export CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP}
  export CORE_PEER_TLS_ENABLED=${TLS_ENABLED}
  export CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CA}
  export CORE_PEER_ADDRESS=${ORG1_PEER}
  peer lifecycle chaincode commit -o ${ORDERER} --channelID ${CHANNEL} --name ${CCNAME} \
    --version ${VERSION} --sequence ${SEQUENCE} \
    --peerAddresses ${ORG1_PEER} --tlsRootCertFiles ${TLS_CA} \
    --peerAddresses ${ORG2_PEER} --tlsRootCertFiles ${TLS_CA} \
    $( [ \"${TLS_ENABLED}\" = true ] && echo --tls --cafile ${TLS_CA} )
  peer lifecycle chaincode querycommitted --channelID ${CHANNEL} --name ${CCNAME}
"
echo "Committed ${CCNAME}@${VERSION} seq=${SEQUENCE}"
