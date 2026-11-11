---
name: fekitty-x402
description: Interact with FeKitty trustless community money pots written in Fe 26.5 using ETHSkills 4-step wallet UX and x402 HTTP 402 micropayment headers.
---

# FeKitty Skill (`SKILL.md`)

This skill follows the **[ethskills.com](https://ethskills.com/)** format and teaches AI agents and web clients how to create, contribute to, and settle **FeKitty** community money pots (`src/lib.fe`, built with **Fe 26.5**).

## 1. Contract ABI & Selectors (`FeKittyMsg`)

- `initializeClone(address recipient, uint256 goal, uint256 deadline)` — Initializes a fresh ERC-1167 minimal proxy kitty pot once (`store.goal == 0`).
- `contribute(uint256 receipt_tag)` (`payable`) — Contributes `msg.value` (in Wei) to the kitty pot before `deadline`. `receipt_tag` can store an `x402` payment receipt hash or `0` for direct wallet contributions.
- `release()` — Permissionless settlement: once `total_raised >= goal`, transfers the full balance (`wei(total_raised)`) to `recipient`.
- `claimRefund()` — Permissionless refund: if `block.timestamp >= deadline` and `total_raised < goal`, returns 100% of the caller's contribution.
- `getProgress() -> (uint256 raised, uint256 remaining, uint256 bps, bool settled)` — Returns current kitty progress using Fe 26.5 closures and tuple structs.
- `getContribution(address contributor) -> uint256` — Returns exact Wei contributed by `contributor`.

## 2. ETHSkills Guardrails Applied

1. **Checks-Effects-Interactions (CEI):** Both `Release` and `ClaimRefund` mutate storage (`store.settled = true` / `store.contributions.set(key: caller, value: 0)`) *before* invoking `call.send_value(...)`.
2. **Typed ETH Units (`wei(...)`):** All native value transfers wrap amounts in Fe's typed `wei(amount)` primitive.
3. **4-State Frontend UX:**
   - **State 1:** Connect Wallet (or Continue in Demo Mode)
   - **State 2:** Verify Network
   - **State 3:** Review Exact Amount & Recipient Lock
   - **State 4:** Confirm Contribution / Settlement

## 3. x402 Instant Chip-In Handshake (`HTTP 402 Payment Required`)

When an AI agent or browser requests a protected community goal link (`GET /api/kitty/:id/chip-in`), the server responds with `HTTP 402`:

```http
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: eyJzY2hlbWUiOiJleGFjdCIsIm5ldHdvcmsiOiJiYXNlLXNlcG9saWEiLCJhc3NldCI6IkVUSCIsImFtb3VudCI6IjEwMDAwMDAwMDAwMDAwMDAwIiwicmVjaXBpZW50IjoiMHg3MUJGMkI5NGE0N2Q4OEUzQTFmN2M5RDI0RTZGMUIwQzllNEEzRjhEIn0=
```

Once signed via `PAYMENT-SIGNATURE`, the contribution is recorded on the `FeKitty` contract with `receipt_tag = uint256(keccak256(paymentSignature))`.
