// BuildPro Brutalist design tokens
export const C = {
  surface: "#FFFFFF",
  onSurface: "#111111",
  surfaceSecondary: "#F4F4F5",
  onSurfaceSecondary: "#18181B",
  surfaceTertiary: "#E4E4E7",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#FFFFFF",
  brand: "#EA580C",
  onBrand: "#FFFFFF",
  brandTertiary: "#F97316",
  success: "#16A34A",
  warning: "#EAB308",
  error: "#DC2626",
  info: "#2563EB",
  border: "#E4E4E7",
  borderStrong: "#111111",
  muted: "#71717A",
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };

export const F = {
  // Brutalist: heavy weight + tight tracking; system font fallback
  display: { fontWeight: "900" as const, letterSpacing: -0.5 },
  heavy: { fontWeight: "800" as const },
  mono: { fontFamily: "monospace" as const },
};

export const statusColor = (s: string) => {
  switch (s) {
    case "active":
    case "in_progress":
    case "present":
    case "sent":
      return C.info;
    case "completed":
    case "done":
    case "paid":
      return C.success;
    case "on_hold":
    case "half_day":
      return C.warning;
    case "absent":
      return C.error;
    default:
      return C.muted;
  }
};
