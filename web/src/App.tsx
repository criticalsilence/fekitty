import React, { useState } from 'react'
import { style, tokens } from './zyzz.config'

export interface KittyPot {
  id: number
  emoji: string
  shortName: string
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
    shortName: 'Street Cat Vet',
    title: 'Pamuk the Street Cat — Vet Surgery',
    story: 'Pooling with neighbors for Pamuk’s paw surgery at Moda Vet Clinic.',
    recipientName: 'Moda Vet Clinic',
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
    shortName: 'Roof Repair',
    title: 'Apartment #12 — Roof Leak Repair',
    story: 'Shared building roof repair before winter rains. Target is 100% reached!',
    recipientName: 'Master Roofing Co.',
    recipientAddress: '0x94A2c8E1104B3f792D1a7A0019c85E2B411081C0',
    goalEth: 1.0,
    raisedEth: 1.0,
    myContributionEth: 0.2,
    deadlineLabel: 'Goal Reached!',
    expired: false,
    settled: false,
    contributorsCount: 8,
  },
  {
    id: 3,
    emoji: '🚲',
    shortName: 'Cargo Bike (Refund)',
    title: 'Shared Courtyard Cargo Bike',
    story: 'Deadline passed before reaching the 0.80 ETH goal. Everyone can claim a 100% refund.',
    recipientName: 'GreenCycle Shop',
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
  const [walletConnected, setWalletConnected] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [walletBalance, setWalletBalance] = useState<number>(2.5)
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false)
  const [lastFeCall, setLastFeCall] = useState<string>(
    'FeKitty::GetProgress {} -> (raised: 0.40 ETH, goal: 0.50 ETH, bps: 8000)'
  )

  const activeKitty = kitties.find((k) => k.id === selectedId) || kitties[0]
  const bps = Math.min(10000, Math.round((activeKitty.raisedEth / activeKitty.goalEth) * 10000))
  const pct = Math.round(bps / 100)
  const goalMet = activeKitty.raisedEth >= activeKitty.goalEth - 1e-6

  async function connectBrowserWallet() {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
    if (!eth) {
      alert('No browser wallet found. Use "Open in MetaMask Mobile" or "Instant Demo Wallet".')
      return
    }
    const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[]
    if (accounts && accounts[0]) {
      setWalletAddress(accounts[0])
      setWalletConnected(true)
      setShowWalletModal(false)
    }
  }

  function connectDemoWallet() {
    setWalletAddress('0xCa9e8810b4c1E9402F')
    setWalletBalance(2.5)
    setWalletConnected(true)
    setShowWalletModal(false)
  }

  function handleChipIn(viaX402: boolean) {
    if (!walletConnected) {
      setShowWalletModal(true)
      return
    }
    const amt = parseFloat(chipAmount)
    if (isNaN(amt) || amt <= 0) return
    setKitties((prev) =>
      prev.map((k) =>
        k.id === activeKitty.id
          ? {
              ...k,
              raisedEth: Number((k.raisedEth + amt).toFixed(4)),
              myContributionEth: Number((k.myContributionEth + amt).toFixed(4)),
              contributorsCount: k.contributorsCount + 1,
            }
          : k
      )
    )
    setWalletBalance((b) => Math.max(0, Number((b - amt).toFixed(4))))
    setLastFeCall(
      `FeKitty::Contribute { receipt_tag: ${viaX402 ? '0x402a9f' : '0x0'} } [wei(${Math.round(amt * 1e18)})]`
    )
  }

  function handleRelease() {
    if (!walletConnected) {
      setShowWalletModal(true)
      return
    }
    setKitties((prev) => prev.map((k) => (k.id === activeKitty.id ? { ...k, settled: true } : k)))
    setLastFeCall(`FeKitty::Release {} -> send_value(${activeKitty.recipientAddress})`)
  }

  function handleRefund() {
    if (!walletConnected) {
      setShowWalletModal(true)
      return
    }
    const refund = activeKitty.myContributionEth
    setKitties((prev) =>
      prev.map((k) =>
        k.id === activeKitty.id
          ? { ...k, raisedEth: Number((k.raisedEth - refund).toFixed(4)), myContributionEth: 0 }
          : k
      )
    )
    setWalletBalance((b) => Number((b + refund).toFixed(4)))
    setLastFeCall(`FeKitty::ClaimRefund {} -> send_value(${walletAddress})`)
  }

  return (
    <div {...styles.shell()}>
      <header {...styles.topbar()}>
        <div {...styles.brand()}>🐾 FeKitty</div>
        <button onClick={() => setShowWalletModal(true)} {...styles.connectBtn()}>
          {walletConnected
            ? `🟢 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} · ${walletBalance.toFixed(2)} ETH`
            : '🦊 Connect Wallet'}
        </button>
      </header>

      <nav {...styles.pillsBar()}>
        {kitties.map((k) => (
          <button
            key={k.id}
            onClick={() => setSelectedId(k.id)}
            {...(k.id === activeKitty.id ? styles.pillActive() : styles.pillTab())}
          >
            {k.emoji} {k.shortName}
          </button>
        ))}
      </nav>

      <main {...styles.card()}>
        <h2 {...styles.title()}>
          {activeKitty.emoji} {activeKitty.title}
        </h2>
        <p {...styles.story()}>{activeKitty.story}</p>

        <div {...styles.progressBox()}>
          <div>
            <strong>{activeKitty.raisedEth.toFixed(2)} ETH</strong> of{' '}
            {activeKitty.goalEth.toFixed(2)} ETH ({pct}%)
          </div>
          <div {...styles.progressTrack()}>
            <div style={{ width: `${Math.min(100, pct)}%` }} {...styles.progressFill()} />
          </div>
          <small>
            Your share: {activeKitty.myContributionEth.toFixed(2)} ETH · {activeKitty.deadlineLabel}
          </small>
        </div>

        <div {...styles.recipientRow()}>
          🔒 Goes to: <strong>{activeKitty.recipientName}</strong>
        </div>

        {activeKitty.settled ? (
          <button disabled {...styles.releaseBtn()}>
            ✅ Paid to {activeKitty.recipientName}
          </button>
        ) : activeKitty.expired && !goalMet ? (
          <button onClick={handleRefund} {...styles.refundBtn()}>
            ⏪ Claim 100% Refund ({activeKitty.myContributionEth.toFixed(2)} ETH)
          </button>
        ) : goalMet ? (
          <button onClick={handleRelease} {...styles.releaseBtn()}>
            🎉 Release {activeKitty.raisedEth.toFixed(2)} ETH to {activeKitty.recipientName}
          </button>
        ) : (
          <div>
            <input
              type="number"
              step="0.05"
              value={chipAmount}
              onChange={(e) => setChipAmount(e.target.value)}
              {...styles.input()}
            />
            <button onClick={() => handleChipIn(false)} {...styles.chipBtn()}>
              🐾 Chip In {chipAmount} ETH
            </button>
            <button onClick={() => handleChipIn(true)} {...styles.x402Btn()}>
              ⚡ 1-Tap Pay via x402
            </button>
          </div>
        )}
      </main>

      <details style={{ marginTop: '14px' }}>
        <summary>🦀 Live Fe 26.5 Contract Call</summary>
        <code>{lastFeCall}</code>
      </details>

      {showWalletModal && (
        <div {...styles.modalBackdrop()}>
          <div {...styles.modalSheet()}>
            <h3>Connect Wallet</h3>
            <button onClick={connectBrowserWallet} {...styles.chipBtn()}>
              🦊 MetaMask / Browser Wallet
            </button>
            <button onClick={connectDemoWallet} {...styles.x402Btn()}>
              ⚡ Instant Demo Wallet (2.50 ETH)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

namespace styles {
  export const shell = style({
    maxWidth: '480px',
    margin: '0 auto',
    padding: tokens.spacing.md,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  })
  export const topbar = style({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  })
  export const brand = style({
    fontSize: '1.35rem',
    fontWeight: 'bold',
  })
  export const connectBtn = style({
    padding: '10px 16px',
    borderRadius: tokens.radii.pill,
    border: 'none',
    backgroundColor: tokens.colors.text,
    color: '#FFFFFF',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const pillsBar = style({
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    marginBottom: tokens.spacing.md,
  })
  export const pillTab = style({
    padding: '8px 14px',
    borderRadius: tokens.radii.pill,
    border: `1px solid ${tokens.colors.border}`,
    backgroundColor: tokens.colors.surface,
    cursor: 'pointer',
  })
  export const pillActive = style({
    padding: '8px 14px',
    borderRadius: tokens.radii.pill,
    border: `2px solid ${tokens.colors.primary}`,
    backgroundColor: '#FFF7ED',
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const card = style({
    backgroundColor: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: '22px',
    padding: tokens.spacing.lg,
  })
  export const title = style({
    margin: '0 0 6px',
    fontSize: '1.3rem',
  })
  export const story = style({
    margin: '0 0 16px',
    color: tokens.colors.muted,
  })
  export const progressBox = style({
    backgroundColor: tokens.colors.bg,
    borderRadius: tokens.radii.card,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  })
  export const progressTrack = style({
    height: '14px',
    backgroundColor: tokens.colors.border,
    borderRadius: tokens.radii.pill,
    overflow: 'hidden',
    margin: '8px 0',
  })
  export const progressFill = style({
    height: '100%',
    backgroundColor: tokens.colors.success,
  })
  export const recipientRow = style({
    padding: '10px 14px',
    backgroundColor: '#F1F5F9',
    borderRadius: tokens.radii.button,
    marginBottom: tokens.spacing.md,
  })
  export const input = style({
    width: '100%',
    padding: '12px',
    borderRadius: tokens.radii.button,
    border: `1px solid ${tokens.colors.border}`,
    marginBottom: '10px',
    fontSize: '1rem',
  })
  export const chipBtn = style({
    width: '100%',
    minHeight: '50px',
    borderRadius: tokens.radii.button,
    border: 'none',
    backgroundColor: tokens.colors.primary,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginBottom: '8px',
    cursor: 'pointer',
  })
  export const x402Btn = style({
    width: '100%',
    minHeight: '44px',
    borderRadius: tokens.radii.button,
    border: `1.5px solid ${tokens.colors.primary}`,
    backgroundColor: '#FFF7ED',
    color: tokens.colors.primary,
    fontWeight: 'bold',
    cursor: 'pointer',
  })
  export const releaseBtn = style({
    width: '100%',
    minHeight: '52px',
    borderRadius: tokens.radii.button,
    border: 'none',
    backgroundColor: tokens.colors.success,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
  })
  export const refundBtn = style({
    width: '100%',
    minHeight: '52px',
    borderRadius: tokens.radii.button,
    border: 'none',
    backgroundColor: tokens.colors.refund,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
  })
  export const modalBackdrop = style({
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })
  export const modalSheet = style({
    backgroundColor: '#FFFFFF',
    padding: tokens.spacing.lg,
    borderRadius: '20px',
    width: '100%',
    maxWidth: '420px',
  })
}
