# 🏦 DLT_Cross: Enterprise Escrow & Tokenization on Hyperledger Fabric

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_16-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger_Fabric-2.5.x-2F3134?style=for-the-badge&logo=hyperledger&logoColor=white)
![CouchDB](https://img.shields.io/badge/CouchDB-E42528?style=for-the-badge&logo=apachecouchdb&logoColor=white)

**DLT_Cross** is a production-ready MVP for decentralized B2B escrow payments built on **Hyperledger Fabric**. 

This repository contains a robust suite of TypeScript chaincodes and automation scripts that orchestrate a three-pillar architecture: an internal digital token (`cfa-token`), a secure deal-locking mechanism (`pay-escrow`), and an immutable history tracker (`audit-log`).

## 📂 Repository Structure

* `src/` — Core chaincode logic (`pay-escrow`) written in TypeScript for the Node.js runtime.
* `scripts/` — CI/CD automation: chaincode packaging, installation, approval, committing, a custom CLI client, and smoke tests.
* `docs/` — Comprehensive API specifications, CouchDB indexes, and development checklists.
* `env.example` / `.env` — Environment configuration templates for network deployment.

## 🛠 Prerequisites

Before deploying, ensure your environment meets the following requirements:
* **Docker & Docker Compose**
* **Node.js 16** (Required for the `fabric-chaincode-node` 2.5.x packaging).
* **Fabric Peer CLI** in your system `PATH`.
* A running instance of `fabric-samples/test-network` with CouchDB and two organizations.

> **Example Test Network Setup:**
> ```bash
> cd ~/fabric-samples/test-network
> ./network.sh up createChannel -c mychannel -ca -s couchdb
> ```

## 🚀 Quick Start

**1. Clone and Configure**
```bash
git clone <repo> && cd DLT_Cross
cp env.example .env
source .env
2. Synchronize CodeIf source files need to be copied into the peer container:Bash./scripts/sync-cc.sh chaincode
3. Deploy & VerifyPackages the chaincode, runs the install/approve/commit lifecycle, and executes smoke tests:Bash./scripts/deploy.sh
./scripts/smoke.sh
🧠 Chaincode Architecture & NamespacesOur custom CLI wrapper (./scripts/client-cli.sh <invoke|query> <namespace> <function> '<JSON-args>') allows seamless interaction with the three core namespaces:1. cfa-token (Asset Management)Admin-only namespace for issuing and burning platform tokens.Issue(amount, account) — Mints tokens to a specific account.Redeem(amount, account) — Burns/withdraws tokens.BalanceOf(account) — Queries the current token balance.2. pay-escrow (Core Logic)Manages the lifecycle of secure transactions between untrusted parties.CreateEscrow(id, buyer, seller, amount, currency) — Locks buyer funds.ReadEscrow(id) — Returns the current state of a specific deal.ListEscrows() — Retrieves all active escrow contracts (via CouchDB rich queries).ReleaseEscrow(id) — Transfers locked funds to the seller.CancelEscrow(id) — Refunds the buyer.3. audit-log (Immutable Tracker)Records state changes for compliance and dispute resolution.AppendLog(txType, ref, payloadJSON) — Adds an event trail.ListLogsByRef(ref) — Retrieves the complete lifecycle history of a specific reference (e.g., an escrow ID).💻 Usage ExamplesToken Management (Org1 Admin):Bash./scripts/client-cli.sh invoke cfa-token Issue '["1000","admin"]'
./scripts/client-cli.sh query  cfa-token BalanceOf '["buyerA"]'
Escrow Lifecycle:Bash./scripts/client-cli.sh invoke pay-escrow CreateEscrow '["e#1","buyerA","sellerB","5000","RUB"]'
./scripts/client-cli.sh query  pay-escrow ReadEscrow '["e#1"]'
./scripts/client-cli.sh invoke pay-escrow ReleaseEscrow '["e#1"]'
Audit Trail:Bash./scripts/client-cli.sh invoke audit-log AppendLog '["Release","e#1","{\"by\":\"oracle\"}"]'
./scripts/client-cli.sh query  audit-log ListLogsByRef '["e#1"]'
⚙️ Environment Variables (.env)VariableDescriptionCHANNELTarget channel for chaincode installation.CCNAMEChaincode system name for commits and invocations.VERSIONChaincode version metadata.ORDERERAddress of the orderer node (host:port).ORG1_PEER / ORG2_PEEREndorsement peers.TLS_ENABLEDtrue/false to enable TLS in CLI calls.CC_PATHPath to the chaincode source inside the peer container.🔧 Troubleshooting & DiagnosticsCommon Error Codes: ERR_BAD_ARGS, ERR_NOT_FOUND, ERR_FORBIDDEN, ERR_STATE_CONFLICT. Detailed breakdowns are available in docs/API.md.no source files in CC_PATH: Ensure CC_PATH is correct and package.json exists inside the peer container.orderer … deadline exceeded: Verify the test-network is running and port 7050 is exposed.🤝 Contribution & Git WorkflowWhen collaborating, the README is the most common point of merge conflicts. If you encounter conflicts during a PR:Fetch the latest main and rebase your working branch:Bashgit fetch origin
git checkout work
git rebase origin/main
Crucial: When resolving conflicts in README.md, always preserve the CLI signature tables and the "Quick Start" section.Run the validation script to ensure documentation matches the CLI interfaces:Bash./scripts/smoke.sh
Force push the updated branch: git push --force-with-lease.
