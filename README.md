# 🏦 DLT_Cross: Pay Escrow for Hyperledger Fabric

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_16-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger_Fabric-2.5.x-2F3134?style=for-the-badge&logo=hyperledger&logoColor=white)
![CouchDB](https://img.shields.io/badge/CouchDB-E42528?style=for-the-badge&logo=apachecouchdb&logoColor=white)

**DLT_Cross** is a production-ready suite of chaincodes and automation scripts for MVP escrow payments built on top of **Hyperledger Fabric**. 

This repository provides a robust B2B architecture containing contracts for a digital token (`cfa-token`), an escrow locking mechanism (`pay-escrow`), and an immutable audit tracker (`audit-log`). It includes all necessary bash scripts for building, packaging, and deploying to the `fabric-samples` test network.

---

## 📂 Repository Structure

* `src/` — Core chaincode logic (`pay-escrow`) written in TypeScript targeting the Node.js runtime.
* `scripts/` — CI/CD automation: chaincode packaging, installation, approval, committing, a custom CLI client, and smoke tests.
* `docs/` — API specifications, CouchDB indexes, and development checklists.
* `env.example` / `.env` — Environment configuration templates.

---

## 🛠 Prerequisites

Ensure your system meets the following requirements before deployment:

* **Docker & Docker Compose**
* **Node.js 16** (strictly required for `fabric-chaincode-node 2.5.x` packaging).
* **Fabric Peer CLI** in your system `PATH` (compatible with Fabric 2.5.x).
* A running instance of `fabric-samples/test-network` with CouchDB and two organizations.

**Example Test Network Setup:**

```bash
cd ~/fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca -s couchdb
```

---

## 🚀 Quick Start

Follow these steps to deploy the escrow system to your local test network.

**1. Clone the repository and set up the environment**

```bash
git clone <repo> && cd DLT_Cross
cp env.example .env
source .env
```

**2. Synchronize source files (If required)**

*Copies the source files into the peer container based on your `CC_PATH`.*

```bash
./scripts/sync-cc.sh chaincode
```

**3. Deploy and Verify**

*Packages the chaincode, runs the install/approve/commit lifecycle, and executes smoke tests.*

```bash
./scripts/deploy.sh
./scripts/smoke.sh
```

---

## ⚙️ Environment Configuration (.env)

Before running the scripts, ensure your `.env` file is properly configured. The scripts rely on these variables:

| Variable | Description |
| :--- | :--- |
| `CHANNEL` | Target channel for chaincode installation. |
| `CCNAME` | Chaincode system name for commits and invocations. |
| `LABEL` | Package label used during chaincode packaging. |
| `SEQUENCE` | Sequence version for chaincode updates. |
| `VERSION` | Chaincode version metadata. |
| `ORDERER` | Address of the orderer node (`host:port`). |
| `ORG1_PEER` / `ORG2_PEER` | Peers participating in endorsement. |
| `TLS_ENABLED` | `true`/`false`, enables TLS in CLI calls. |
| `TLS_CA` | Path to the root TLS certificate. |
| `ADMIN_MSP` | Directory containing admin MSP materials for installation. |
| `CC_PATH` | Path to the chaincode source inside the peer container. |
| `CORE_PEER_LOCALMSPID` | Default organization MSP ID. |

---

## 🧠 CLI Interaction & Namespaces

**Universal Client Syntax:**

```bash
./scripts/client-cli.sh <invoke|query> <namespace> <function> '<JSON-args>'
```

### Supported Namespaces & Methods

**1. `cfa-token` (Asset Management)**
* `Issue(amount, account)` — Mints tokens to a specific account (Org1 Admin only).
* `Redeem(amount, account)` — Burns/withdraws tokens (Org1 Admin only).
* `BalanceOf(account)` — Queries the current token balance.

**2. `pay-escrow` (Core Logic)**
* `CreateEscrow(id, buyer, seller, amount, currency)` — Initializes a new escrow deal.
* `ReadEscrow(id)` — Retrieves the current state of a specific deal.
* `ListEscrows()` — Retrieves all active escrow contracts.
* `ReleaseEscrow(id)` — Transfers locked funds to the seller.
* `CancelEscrow(id)` — Refunds the buyer.

**3. `audit-log` (Immutable Tracker)**
* `AppendLog(txType, ref, payloadJSON)` — Adds an event trail.
* `ListLogsByRef(ref)` — Retrieves the complete history for a specific reference.

---

## 💻 Usage Examples

**Token Management (Requires Org1 admin MSP):**

```bash
./scripts/client-cli.sh invoke cfa-token Issue '["1000","admin"]'
./scripts/client-cli.sh query  cfa-token BalanceOf '["buyerA"]'
```

**Escrow Lifecycle:**

```bash
./scripts/client-cli.sh invoke pay-escrow CreateEscrow '["e#1","buyerA","sellerB","5000","RUB"]'
./scripts/client-cli.sh query  pay-escrow ReadEscrow '["e#1"]'
./scripts/client-cli.sh invoke pay-escrow ReleaseEscrow '["e#1"]'
```

**Audit Trail:**

```bash
./scripts/client-cli.sh invoke audit-log AppendLog '["Release","e#1","{\"by\":\"oracle\"}"]'
./scripts/client-cli.sh query  audit-log ListLogsByRef '["e#1"]'
```

---

## 🔧 Troubleshooting & Diagnostics

* **Common Chaincode Errors:** `ERR_BAD_ARGS`, `ERR_NOT_FOUND`, `ERR_FORBIDDEN`, `ERR_STATE_CONFLICT` (Detailed in `docs/API.md`).
* **`no source files in CC_PATH`:** Ensure `CC_PATH` is correct and `package.json` exists inside the peer container.
* **`orderer … deadline exceeded`:** Verify the `test-network` is running and port `7050` is accessible.

---

## 🤝 Git Workflow (Resolving README Conflicts)

The `README.md` is the most common point of divergence. If Git reports conflicts during a PR:

1. Fetch the latest `main` and rebase your working branch:

```bash
git fetch origin
git checkout work
git rebase origin/main
```

2. **Crucial:** When resolving conflicts in `README.md`, always preserve the CLI signature tables and the "Quick Start" section. Do not delete usage examples.
3. After fixing the rebase, run the validation script to ensure documentation matches the CLI interfaces:

```bash
./scripts/smoke.sh
```

4. Force push the updated branch: 

```bash
git push --force-with-lease
```

---

## 📚 Developer Documentation Hub

For deep dives into the architecture and backend policies, refer to the internal documentation:
* **API Specs & Indexes:** [`docs/API.md`](docs/API.md) | [`docs/COUCHDB_INDEXES.md`](docs/COUCHDB_INDEXES.md)
* **Policies & Call Schemes:** [`docs/README-FABRIC-BACKEND.md`](docs/README-FABRIC-BACKEND.md)
* **Developer Guidelines:** [`docs/DEV_CHECKLIST.md`](docs/DEV_CHECKLIST.md)

---

## 📜 Version History

* **v3.15** — MVP pack release: added automation scripts, environment templates, and extended documentation.
* **v3.14** — Initial core release: base chaincode logic and CouchDB indexes implementation.
