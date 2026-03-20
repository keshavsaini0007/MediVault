// ─── Light Mode (default) ─────────────────────────────────────────────────────
const Light = {
  // Brand — exact values from globals.css :root
  primary:       '#1A4FBA',
  primaryDark:   '#12368A',
  primaryLight:  '#2E6AE6',
  primarySoft:   '#EBF0FB',
  accent:        '#F97316',
  accentSoft:    '#FEF3E2',
  success:       '#16A34A',
  successSoft:   '#DCFCE7',
  danger:        '#DC2626',
  dangerSoft:    '#FEE2E2',
  warning:       '#D97706',
  warningSoft:   '#FEF9C3',
  teal:          '#0D9488',
  tealDark:      '#0A7A70',
  tealSoft:      '#CCFBF1',

  // Surface & text - Health-themed backgrounds
  // Light mode: Soft mint/sage green tones for health feel
  bgPage:        '#F0F9F6',      // Soft mint cream
  bgCard:        '#FFFFFF',      // White card
  bgCardHover:   '#E8F5F0',      // Mint tint
  bgNavbar:      '#FFFFFF',
  bgInput:       '#FFFFFF',
  border:        '#D1E5DE',      // Soft sage border
  borderSoft:    '#E8F5F0',      // Soft mint
  textPrimary:   '#134E4A',       // Deep teal text
  textSecondary: '#2D6B64',      // Teal secondary
  textMuted:     '#5A8A7D',      // Muted sage
  textFaint:     '#8BA89E',      // Light sage

  // Gray scale (legacy aliases — mirrors --gray-N vars)
  white:   '#FFFFFF',
  gray50:  '#F0F9F6',
  gray100: '#E8F5F0',
  gray200: '#D1E5DE',
  gray300: '#A8C4B8',
  gray400: '#8BA89E',
  gray500: '#5A8A7D',
  gray600: '#2D6B64',
  gray700: '#134E4A',
  gray800: '#0F3D36',
  gray900: '#0A2E27',

  // Sidebar (fixed dark regardless of theme)
  sidebarBg:     '#12368A',   // --primary-dark
  sidebarActive: '#2E6AE6',   // --primary-light
};

// ─── Dark Mode ────────────────────────────────────────────────────────────────
export const DarkColors = {
  ...Light,
  primary:       '#4B80F0',
  primaryDark:   '#2E5FC7',
  primaryLight:  '#6B9BFF',
  primarySoft:   '#1A2D5A',
  accentSoft:    '#2D1F0E',
  successSoft:   '#0D2818',
  dangerSoft:    '#2D0E0E',
  warningSoft:   '#2D1F00',
  tealDark:      '#0A6B63',
  tealSoft:      '#0A2422',

  // Dark mode - Deep teal/medical navy for health feel
  bgPage:        '#071A1F',       // Deep teal black
  bgCard:        '#0D2229',       // Dark teal card
  bgCardHover:   '#132D38',       // Lighter teal
  bgNavbar:      '#081418',       // Very dark teal
  bgInput:       '#0D2229',       // Dark teal input
  border:        '#1A3A44',        // Teal border
  borderSoft:    '#0D2229',       // Dark teal border
  textPrimary:   '#CCFBF1',       // Mint white
  textSecondary: '#99F6E4',       // Light teal
  textMuted:     '#5EEAD4',       // Teal muted
  textFaint:     '#2DD4BF',       // Bright teal

  white:   '#0D2229',
  gray50:  '#071A1F',
  gray100: '#0D2229',
  gray200: '#1A3A44',
  gray300: '#2DD4BF',
  gray400: '#5EEAD4',
  gray500: '#99F6E4',
  gray600: '#CCFBF1',
  gray700: '#E0FEF7',
  gray800: '#F0FDF9',
  gray900: '#F5FEF9',

  sidebarBg:     '#12368A',
  sidebarActive: '#6B9BFF',
};

// ─── Active theme (light default; swap for dark) ──────────────────────────────
const Colors = Light;
export default Colors;
