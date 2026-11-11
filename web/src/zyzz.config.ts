import { style } from 'zyzz'

/**
 * Shared Zyzz Design Tokens & Typed Styles for FeKitty (zyzz.style)
 * Designed for ultra-simple human readability and AI agent clarity.
 */
export const tokens = {
  colors: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#475569',
    primary: '#EA580C',
    primaryHover: '#C2410C',
    success: '#16A34A',
    successBg: '#DCFCE7',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    refund: '#2563EB',
    refundBg: '#DBEAFE',
  },
  radii: {
    card: '16px',
    button: '12px',
    pill: '9999px',
  },
  spacing: {
    xs: '6px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
} as const

export { style }
