# Astrol Airdrop API

A lightweight REST service (written in Rust, powered by **axum**) that lets
clients query Merkle-tree-based airdrop data for the Astrol ecosystem.

``merkle_tree`` blobs or JSON files are loaded at start-up, aggregated, and
served via three **read-only** endpoints:

| Endpoint | Purpose |
|----------|---------|
| **`GET /health`** | Liveness probe |
| **`GET /distributor/distributors`** | List all distributors + global stats |
| **`GET /distributor/user/{user_pubkey}`** | Fetch Merkle proof & claim amount for a user |

---

## 1 .  How it works

1. **Startup**  
   * The binary is launched with a few CLI flags (or environment variables).  
   * It walks `--merkle-tree-path` and loads every file whose extension is
     `.json` or `.bin` into an `AirdropMerkleTree` (from
     `jito_merkle_tree`).  
   * For each tree, a Merkle-Distributor **PDA** is deterministically derived
     with `get_merkle_distributor_pda(program_id, base, mint,
     airdrop_version)`.

2. **In-memory state**  
   * A global `RouterState` is built:  
     * `distributors`: vector of **all** trees + rolled-up totals  
     * `tree`: `HashMap<Pubkey, (DistributorPubkey, TreeNode)>` for O(1)
       look-ups by user  
   * The map also stores each user’s pre-calculated Merkle proof
     (`TreeNode.proof`).

3. **Server**  
   * The axum router is wrapped in a **tower** middleware stack:
     * CORS (`GET` only, `Access-Control-Allow-Origin: *`)
     * Cache-Control header (1 h)
     * Load-shedding, 20 s timeout, 10 k req/s rate-limit, 10 k buffered calls
     * Structured traces with `tracing`  
   * The service listens on the supplied `--bind-addr`
     (default `0.0.0.0:7001`).

4. **Error handling**  
   * Custom `ApiError` enum → JSON payload with HTTP status  
   * Special handling for `tower::timeout` (408) and `load_shed` (503)

---

## 2 .  Building & running

```bash
# 1. Clone and build
git clone https://github.com/your-org/airdrop-api.git
cd airdrop-api
cargo build --release            # requires Rust 1.78+

# 2. Run (all flags have env-var twins)
cargo run --release -- \
  --bind-addr 0.0.0.0:7001 \
  --merkle-tree-path ./trees \
  --base <BASE_PUBKEY> \
  --mint <TOKEN_MINT_PUBKEY> \
  --program-id <PROGRAM_ID_PUBKEY>

# or equivalently
BIND_ADDR=0.0.0.0:7001 \
MERKLE_TREE_PATH=./trees \
BASE=<BASE_PUBKEY> \
MINT=<TOKEN_MINT_PUBKEY> \
PROGRAM_ID=<PROGRAM_ID_PUBKEY> \
cargo run --release
