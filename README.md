# FeKitty 🐾

> **One-Sentence Pitch:** Trustless, goal-based community money pots ("kitties") written in **Fe 26.5** where pooled funds automatically release to a pre-locked recipient when the target is met, or refund 100% to contributors if the deadline expires.

- **Contest:** [Fe Builders Challenge 2026](https://fe-lang.org/contest/)
- **Live Interactive Demo:** [https://cukka.org/fekitty/](https://cukka.org/fekitty/)
- **Author:** [@criticalsilence](https://github.com/criticalsilence)
- **License:** [MIT](./LICENSE)

---

## 1. Problem Statement & Real-Life Motivation

Whenever neighbors pool money for an apartment roof repair, friends split a group gift, or a neighborhood raises funds for a street cat's veterinary surgery, someone has to collect the money in a personal account:
1. **Custody Risk:** Contributors must trust an individual middleman not to misspend or disappear with the funds.
2. **Missed-Goal Awkwardness:** If the target amount is not reached by the deadline, manually returning everyone's exact share is tedious and error-prone.
3. **Recipient Verification:** Contributors want a cryptographic guarantee that once the target is met, the funds can *only* go to the designated vet clinic, repair contractor, or vendor.

**FeKitty** solves this everyday human coordination problem with a single, minimal smart contract written in **Fe 26.5** paired with a zero-jargon web interface.

---

## 2. Fe 26.5 Technical Highlight

FeKitty leverages **Fe 26.5**'s new language features—**explicit effects (`uses`)**, **typed ETH amounts (`wei`)**, **tuple structs**, **closures**, **traits with pattern matching**, and **`std::evm::clones` minimal proxy initialization**:

```fe
/// Tuple struct (Fe 26.5) capturing `(raised, goal)` for progress evaluation
pub struct ProgressSnapshot(pub u256, pub u256)

/// Uses a Fe 26.5 closure and tuple struct to calculate remaining wei needed
/// and basis-points progress (0..10000).
pub fn evaluate_progress(snapshot: ProgressSnapshot) -> (u256, u256) {
    let ProgressSnapshot(raised, goal) = snapshot
    assert!(goal > 0, "goal must be positive")

    // Fe 26.5 Closure capturing `goal` from surrounding environment
    let remaining_needed = |current: u256| -> u256 {
        if current >= goal {
            return 0
        }
        return goal - current
    }

    let rem = remaining_needed(raised)
    let bps = if raised >= goal {
        10000
    } else {
        mul_div(raised, 10000, goal)
    }

    (rem, bps)
}
```

---

## 3. Architecture & Code Flow

1. **Create / Clone a Kitty (`init` or `InitializeClone`):**
   - Locks `recipient: Address`, `goal: u256`, and `deadline: u256` in `KittyStore`.
   - Supports ultra-cheap ERC-1167 minimal proxy clones via `std::evm::clones`.
2. **Contribute (`Contribute { receipt_tag }`):**
   - Validates via `ContributionRequest::validate()` that the kitty is active (`!settled`), `amount > 0`, and `ctx.timestamp() < deadline`.
   - Records contributor share in `StorageMap<Address, u256>` and logs an optional **x402** (`HTTP 402 Payment Required`) micro-payment receipt tag.
3. **Permissionless Release (`Release {}`):**
   - Once `total_raised >= goal`, anyone can trigger settlement.
   - Follows the **Checks-Effects-Interactions (CEI)** pattern (`store.settled = true` before `call.send_value(addr: recipient, gas: ctx.gas(), value: wei(payout))`).
4. **100% Safety Refund (`ClaimRefund {}`):**
   - If `ctx.timestamp() >= deadline` and `total_raised < goal`, contributors reclaim their exact deposit (`wei(refund_amount)`).

---

## 4. Reproducible Build & Test Instructions

### Prerequisites
Install the **Fe 26.5.0** compiler toolchain via `feup`:
```bash
curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version v26.5.0
```

### Run Automated Unit Tests
FeKitty includes 7 built-in unit and revert tests in [`src/lib.fe`](./src/lib.fe):
```bash
fe test
```

### Run Web Interface (`web/` or standalone `index.html`)
- **Zero-Build Static Demo:** Open [`index.html`](./index.html) directly in any browser or host on GitHub Pages / `cukka.org`.
- **Vite + React + Zyzz (`zyzz.style`) Build:**
  ```bash
  cd web
  npm install
  npm run dev
  ```

---

## 5. Security Assumptions & Known Limitations

- **Single Native Asset (ETH/Wei):** To keep the contract minimal and auditable, `FeKitty` handles native EVM value (`wei(amount)`). ERC-20 tokens are intentionally omitted in v0.1.
- **No Partial Withdrawals Before Deadline:** Contributors lock funds until either the goal is reached or the deadline expires, preventing griefing attacks right before a vendor payout.
- **Recipient Liveness:** The locked `recipient` address must be able to receive native ETH via `call.send_value`.

---

## 6. Disclosures (Pre-Existing Work, Ecosystem Resources & AI Assistance)

- **Newly Written for the Fe Builders Challenge:** All Fe smart contract code ([`src/lib.fe`](./src/lib.fe)), frontend components ([`web/src/App.tsx`](./web/src/App.tsx), [`index.html`](./index.html)), and skill specs ([`skills/SKILL.md`](./skills/SKILL.md)) were created from scratch during the challenge window (Nov 2026).
- **Ecosystem Standards & Libraries Used:**
  - **[Zyzz (`zyzz.style`)](https://zyzz.style/):** Typed styling and design tokens in `web/`.
  - **[ETHSkills (`ethskills.com`)](https://ethskills.com/):** Security guardrails (CEI pattern) and 4-step wallet UX structure.
  - **[x402 (`x402.org`)](https://x402.org/):** HTTP 402 `PAYMENT-SIGNATURE` receipt tag integration for 1-click contributions.
- **AI Assistance Disclosure:** Built with AI pair-programming assistance (Google Antigravity) for Fe 26.5 syntax exploration, unit test scaffolding, and UI prototyping, reviewed and directed by `@criticalsilence`.
