import React, { useState } from 'react'
import { style, tokens } from './zyzz.config'

export interface KittyPot {
  id: number
  emoji: string
  title: string
  story: string
  recipientName: string
  recipientAddress: string
  goalEth: number
  raisedEth: number
  myContributionEth: number
  deadlineLabel: string
  expired: boolean
  settled: boolean
  contributorsCount: number
}

const INITIAL_KITTIES: KittyPot[] = [
  {
    id: 1,
    emoji: '🐾',
    title: 'Pamuk the Street Cat — Vet Surgery',
    story: 'Neighbors on Moda Street pooling funds for Pamuk’s broken paw operation at Moda Vet Clinic.',
    recipientName: 'Moda Vet Clinic (Verified)',
    recipientAddress: '0x71BF2B94a47d88E3A1f7c9D24E6F1B0C9e4A3F8D',
    goalEth: 0.5,
    raisedEth: 0.4,
    myContributionEth: 0.1,
    deadlineLabel: '5 days left',
    expired: false,
    settled: false,
    contributorsCount: 9,
  },
  {
    id: 2,
    emoji: '🏠',
    title: 'Apartment #12 — Roof Insulation Repair',
    story: 'Shared building maintenance pot before winter rains. Releases directly to the roofing contractor.',
    recipientName: 'Master Roofing Co.',
    recipientAddress: '0x94A2c8E1104B3f792D1a7A0019c85E2B411081C0',
    goalEth: 1.0,
    raisedEth: 1.0,
    myContributionEth: 0.2,
    deadlineLabel: 'Goal Met Early!',
    expired: false,
    settled: false,
    contributorsCount: 8,
  },
  {
    id: 3,
    emoji: '🚲',
    title: 'Shared Courtyard Electric Cargo Bike',
    story: 'Community cargo bike for grocery runs. Target was not reached in time, so 100% refunds are unlocked.',
    recipientName: 'GreenCycle Local Shop',
    recipientAddress: '0x38E1F09c72B4a5D6E8f1029384756AbcDeF099B4',
    goalEth: 0.8,
    raisedEth: 0.35,
    myContributionEth: 0.15,
    deadlineLabel: 'Deadline Passed',
    expired: true,
    settled: false,
    contributorsCount: 4,
  },
]

export function App() {
  const [kitties, setKitties] = useState<KittyPot[]>(INITIAL_KITTIES)
  const [selectedId, setSelectedId] = useState<number>(1)
  const [chipAmount, setChipAmount] = useState<string>('0.10')
  const [walletBalance, setWalletBalance] = useState<number>(2.5)
  const [walletAddress, setWalletAddress] = useState<string>('0xCa9e...402F (Demo Wallet)')
  const [lastFeCall, setLastFeCall] = useState<string>(
    'FeKitty::GetProgress {} -> (raised: 400000000000000000, rem: 100000000000000000, bps: 8000, settled: false)'
  )
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [newTitle, setNewTitle] = useState<string>('')
  const [newRecipientName, setNewRecipientName] = useState<string>('')
  const [newRecipientAddr, setNewRecipientAddr] = useState<string>('0x')
  const [newGoal, setNewGoal] = useState<string>('0.50')

  const activeKitty = kitties.find((k) => k.id === selectedId) || kitties[0]
  const bps = Math.min(10000, Math.round((activeKitty.raisedEth / activeKitty.goalEth) * 10000))
  const percent = (bps / 100).toFixed(0)
  const goalMet = activeKitty.raisedEth >= activeKitty.goalEth - 1e-6

  function handleChipIn(viaX402: boolean) {
    const amount = parseFloat(chipAmount)
    if (isNaN(amount) || amount <= 0 || activeKitty.settled || activeKitty.expired) return
    const tag = viaX402 ? '0x402a9f81c3' : '0x0'

    setKitties((prev) =>
      prev.map((k) =>
        k.id === activeKitty.id
          ? {
              ...k,
              raisedEth: Number((k.raisedEth + amount).toFixed(4)),
              myContributionEth: Number((k.myContributionEth + amount).toFixed(4)),
              contributorsCount: k.contributorsCount + 1,
            }
          : k
      )
    )
    setWalletBalance((b) => Number((b - amount).toFixed(4)))
    setLastFeCall(
      `FeKitty::Contribute { receipt_tag: ${tag} } [value: wei(${Math.round(amount * 1e18)})] -> Ok(new_total)`
    )
  }

  function handleRelease() {
    if (!goalMet || activeKitty.settled) return
    setKitties((prev) =>
      prev.map((k) => (k.id === activeKitty.id ? { ...k, settled: true } : k))
    )
    setLastFeCall(
      `FeKitty::Release {} -> call.send_value(addr: ${activeKitty.recipientAddress}, value: wei(${Math.round(
        activeKitty.raisedEth * 1e18
      )}))`
    )
  }

  function handleRefund() {
    if (!activeKitty.expired || goalMet || activeKitty.myContributionEth <= 0) return
    const refundAmt = activeKitty.myContributionEth
    setKitties((prev) =>
      prev.map((k) =>
        k.id === activeKitty.id
          ? {
              ...k,
              raisedEth: Number((k.raisedEth - refundAmt).toFixed(4)),
              myContributionEth: 0,
            }
          : k
      )
    )
    setWalletBalance((b) => Number((b + refundAmt).toFixed(4)))
    setLastFeCall(
      `FeKitty::ClaimRefund {} -> call.send_value(addr: caller, value: wei(${Math.round(
        refundAmt * 1e18
      )}))`
    )
  }

  function handleCreateKitty(e: React.FormEvent) {
    e.preventDefault()
    const goal = parseFloat(newGoal)
    if (!newTitle.trim() || isNaN(goal) || goal <= 0) return
    const newPot: KittyPot = {
      id: Date.now(),
      emoji: '🤝',
      title: newTitle.trim(),
      story: 'Community kitty created via std::evm::clones minimal proxy in Fe 26.5.',
      recipientName: newRecipientName.trim() || 'Verified Community Recipient',
      recipientAddress:
        newRecipientAddr.length > 10
          ? newRecipientAddr
          : '0x88F1c2D9E0A4b5C6d7E8F90123456789AbCdEf12',
      goalEth: goal,
      raisedEth: 0,
      myContributionEth: 0,
      deadlineLabel: '7 days left',
      expired: false,
      settled: false,
      contributorsCount: 0,
    }
    setKitties((prev) => [newPot, ...prev])
    setSelectedId(newPot.id)
    setShowCreateModal(false)
    setNewTitle('')
    setNewRecipientName('')
    setLastFeCall(
      `FeKitty::InitializeClone { recipient: ${newPot.recipientAddress}, goal: wei(${Math.round(
        goal * 1e18
      )}), deadline: +7d }`
    )
  }

  return (
    <div {...styles.page()}>
      <header {...styles.header()}>
        <div>
          <h1 {...styles.brandTitle()}>🐾 FeKitty</h1>
          <p {...styles.brandSub()}>
            Simple Community Money Pots in <strong>Fe 26.5</strong> — Goal met? Goes to recipient.
            Missed? 100% refund.
          </p>
        </div>
        <div {...styles.walletPill()}>
          <span>🟢 {walletAddress}</span>
          <strong>{walletBalance.toFixed(2)} ETH</strong>
        </div>
      </header>

      {/* Top Selector Bar */}
      <section {...styles.tabsRow()}>
        {kitties.map((k) => (
          <button
            key={k.id}
            onClick={() => setSelectedId(k.id)}
            {...(k.id === activeKitty.id ? styles.tabActive() : styles.tabButton())}
          >
            <span>{k.emoji}</span>
            <span>{k.title}</span>
          </button>
        ))}
        <button onClick={() => setShowCreateModal(true)} {...styles.newKittyButton()}>
          + New Kitty (30s)
        </button>
      </section>

      {/* Main Single-Card Kitty Interface */}
      <main {...styles.card()}>
        <div {...styles.cardHeader()}>
          <div>
            <span {...styles.badge()}>
              {activeKitty.settled
                ? '✅ Paid to Recipient'
                : activeKitty.expired
                ? '⏪ Expired — Refunds Open'
                : goalMet
                ? '🎉 Goal Reached — Ready to Release'
                : `⏳ Active (${activeKitty.deadlineLabel})`}
            </span>
            <h2 {...styles.kittyTitle()}>
              {activeKitty.emoji} {activeKitty.title}
            </h2>
            <p {...styles.kittyStory()}>{activeKitty.story}</p>
          </div>
        </div>

        {/* Locked Recipient Box */}
        <div {...styles.recipientBox()}>
          <div>
            <small>🔒 LOCKED RECIPIENT (FUNDS CAN ONLY GO HERE IF GOAL IS MET)</small>
            <div>
              <strong>{activeKitty.recipientName}</strong> —{' '}
              <code>{activeKitty.recipientAddress}</code>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div {...styles.progressSection()}>
          <div {...styles.progressLabels()}>
            <span>
              Raised: <strong>{activeKitty.raisedEth.toFixed(2)} ETH</strong> of{' '}
              <strong>{activeKitty.goalEth.toFixed(2)} ETH</strong> ({percent}%)
            </span>
            <span>
              {activeKitty.contributorsCount} neighbors · Your share:{' '}
              <strong>{activeKitty.myContributionEth.toFixed(2)} ETH</strong>
            </span>
          </div>
          <div {...styles.progressTrack()}>
            <div style={{ width: `${Math.min(100, Number(percent))}%` }} {...styles.progressFill()} />
          </div>
        </div>

        {/* 3 Dead-Simple Actions */}
        <div {...styles.actionsGrid()}>
          {/* Action 1: Chip In */}
          <div {...styles.actionBox()}>
            <h3>1. Chip In to Kitty</h3>
            <p>Add ETH directly or via an account-free x402 instant payment proof.</p>
            <div {...styles.inputRow()}>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={chipAmount}
                onChange={(e) => setChipAmount(e.target.value)}
                disabled={activeKitty.settled || activeKitty.expired}
                {...styles.amountInput()}
              />
              <button
                onClick={() => handleChipIn(false)}
                disabled={activeKitty.settled || activeKitty.expired}
                {...styles.primaryBtn()}
              >
                Chip In {chipAmount} ETH
              </button>
              <button
                onClick={() => handleChipIn(true)}
                disabled={activeKitty.settled || activeKitty.expired}
                {...styles.x402Btn()}
              >
                ⚡ x402 1-Click
              </button>
            </div>
          </div>

          {/* Action 2: Release to Recipient */}
          <div {...styles.actionBox()}>
            <h3>2. Release to Recipient</h3>
            <p>Unlocks automatically as soon as 100% of the target is reached.</p>
            <button
              onClick={handleRelease}
              disabled={!goalMet || activeKitty.settled}
              {...styles.releaseBtn()}
            >
              {activeKitty.settled
                ? '✅ Released to Recipient'
                : `Release ${activeKitty.raisedEth.toFixed(2)} ETH to ${activeKitty.recipientName}`}
            </button>
          </div>

          {/* Action 3: Claim 100% Refund */}
          <div {...styles.actionBox()}>
            <h3>3. Safety Refund</h3>
            <p>If the deadline passes and the goal isn’t met, reclaim 100% of your ETH.</p>
            <button
              onClick={handleRefund}
              disabled={!activeKitty.expired || goalMet || activeKitty.myContributionEth <= 0}
              {...styles.refundBtn()}
            >
              {activeKitty.myContributionEth > 0 && activeKitty.expired && !goalMet
                ? `Claim 100% Refund (${activeKitty.myContributionEth.toFixed(2)} ETH)`
                : 'Refund Locked (Active or Goal Met)'}
            </button>
          </div>
        </div>
      </main>

      {/* Live Fe 26.5 Execution Log */}
      <footer {...styles.feConsole()}>
        <strong>🦀 Live Fe 26.5 Contract Call (`src/lib.fe`):</strong>
        <code>{lastFeCall}</code>
      </footer>

      {showCreateModal && (
        <div {...styles.modalBackdrop()}>
          <form onSubmit={handleCreateKitty} {...styles.modalCard()}>
            <h3>Create a New Community Kitty (30 Seconds)</h3>
            <input
              placeholder="What are we pooling for? (e.g., Street Dog Vet Bill)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              {...styles.amountInput()}
            />
            <input
              placeholder="Recipient Name (e.g., Kadikoy Vet Clinic)"
              value={newRecipientName}
              onChange={(e) => setNewRecipientName(e.target.value)}
              required
              {...styles.amountInput()}
            />
            <input
              placeholder="Recipient Wallet Address (0x...)"
              value={newRecipientAddr}
              onChange={(e) => setNewRecipientAddr(e.target.value)}
              {...styles.amountInput()}
            />
            <input
              type="number"
              step="0.05"
              placeholder="Goal in ETH (e.g., 0.50)"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              required
              {...styles.amountInput()}
            />
            <div {...styles.inputRow()}>
              <button type="submit" {...styles.primaryBtn()}>
                Deploy FeKitty Clone
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                {...styles.tabButton()}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

namespace styles {
  export const page = style({
    maxWidth: '960px',
    margin: '0 auto',
    padding: tokens.spacing.lg,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: tokens.colors.text,
  })
  export const header = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  })
  export const brandTitle = style({
    margin: '0',
    fontSize: '2rem',
  })
  export const brandSub = style({
    margin: '4px 0 0 0',
    color: tokens.colors.muted,
  })
  export const walletPill = style({
    display: 'flex',
    gap: tokens.spacing.sm,
    padding: '10px 16px',
    backgroundColor: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radii.pill,
  })
  export const tabsRow = style({
    display: 'flex',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.md,
  })
  export const tabButton = style({
    padding: '10px 16px',
    borderRadius: tokens.radii.button,
    border: `1px solid ${tokens.colors.border}`,
    backgroundColor: tokens.colors.surface,
    cursor: 'pointer',
  })
  export const tabActive = style({
    padding: '10px 16px',
    borderRadius: tokens.radii.button,
    border: `2px solid ${tokens.colors.primary}`,
    backgroundColor: '#FFF7ED',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const newKittyButton = style({
    padding: '10px 16px',
    borderRadius: tokens.radii.button,
    border: 'none',
    backgroundColor: tokens.colors.text,
    color: '#FFFFFF',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const card = style({
    backgroundColor: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.lg,
  })
  export const cardHeader = style({
    marginBottom: tokens.spacing.md,
  })
  export const badge = style({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.warningBg,
    fontSize: '0.85rem',
    fontWeight: 'bold',
  })
  export const kittyTitle = style({
    margin: '8px 0',
    fontSize: '1.6rem',
  })
  export const kittyStory = style({
    margin: '0',
    color: tokens.colors.muted,
  })
  export const recipientBox = style({
    padding: tokens.spacing.md,
    backgroundColor: '#F1F5F9',
    borderRadius: tokens.radii.button,
    marginBottom: tokens.spacing.md,
  })
  export const progressSection = style({
    marginBottom: tokens.spacing.lg,
  })
  export const progressLabels = style({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  })
  export const progressTrack = style({
    height: '16px',
    backgroundColor: '#E2E8F0',
    borderRadius: tokens.radii.pill,
    overflow: 'hidden',
  })
  export const progressFill = style({
    height: '100%',
    backgroundColor: tokens.colors.success,
  })
  export const actionsGrid = style({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: tokens.spacing.md,
  })
  export const actionBox = style({
    padding: tokens.spacing.md,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radii.button,
  })
  export const inputRow = style({
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '10px',
  })
  export const amountInput = style({
    padding: '10px',
    borderRadius: '8px',
    border: `1px solid ${tokens.colors.border}`,
    width: '100%',
  })
  export const primaryBtn = style({
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: tokens.colors.primary,
    color: '#FFFFFF',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const x402Btn = style({
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${tokens.colors.primary}`,
    backgroundColor: '#FFF7ED',
    color: tokens.colors.primary,
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const releaseBtn = style({
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: tokens.colors.success,
    color: '#FFFFFF',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  })
  export const refundBtn = style({
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: tokens.colors.refund,
    color: '#FFFFFF',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  })
  export const feConsole = style({
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: '#0F172A',
    color: '#38BDF8',
    borderRadius: tokens.radii.button,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  })
  export const modalBackdrop = style({
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })
  export const modalCard = style({
    backgroundColor: '#FFFFFF',
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.card,
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  })
}
