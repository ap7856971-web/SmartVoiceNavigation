export const Colors = {
  light: {
    text: "#111827",
    background: "#F4F7FB",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#E8F0FE",
    textSecondary: "#6B7280",

    primary: "#2563EB",
    secondary: "#3B82F6",

    success: "#22C55E",
    danger: "#EF4444",
    warning: "#F59E0B",

    card: "#FFFFFF",
    border: "#E5E7EB",
    shadow: "#00000020",

    gradientStart: "#2563EB",
    gradientEnd: "#3B82F6",

    iconBackground: "#EFF6FF",
  },

  dark: {
    text: "#FFFFFF",
    background: "#111827",
    backgroundElement: "#1F2937",
    backgroundSelected: "#374151",
    textSecondary: "#9CA3AF",

    primary: "#3B82F6",
    secondary: "#60A5FA",

    success: "#22C55E",
    danger: "#EF4444",
    warning: "#F59E0B",

    card: "#1F2937",
    border: "#374151",
    shadow: "#00000060",

    gradientStart: "#2563EB",
    gradientEnd: "#1D4ED8",

    iconBackground: "#374151",
  },
} as const;

/**
 * Theme color keys
 *
 * Used by ThemedText and ThemedView.
 */
export type ThemeColor = keyof typeof Colors.light;

/**
 * Font styles
 *
 * Used by ThemedText.
 */
export const Fonts = {
  regular: {
    fontFamily: "System",
    fontWeight: "400" as const,
  },

  medium: {
    fontFamily: "System",
    fontWeight: "500" as const,
  },

  semiBold: {
    fontFamily: "System",
    fontWeight: "600" as const,
  },

  bold: {
    fontFamily: "System",
    fontWeight: "700" as const,
  },

  mono: "monospace",
};
export const Spacing = {
  half: 2,

  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
};

export const MaxContentWidth = 1200;