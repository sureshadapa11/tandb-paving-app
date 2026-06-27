import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;
  const numCols = isDesktop ? 4 : isTablet ? 3 : 2;
  const hPad = isDesktop ? 48 : isTablet ? 32 : 16;
  const maxW = 1200;
  return { width, isDesktop, isTablet, isMobile, numCols, hPad, maxW };
}
