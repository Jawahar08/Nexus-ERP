import { create } from "zustand";

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currencyCode: string;
  symbol: string;
  rate: number; // exchange rate relative to USD
}

export const COUNTRIES: CountryConfig[] = [
  { code: "US", name: "United States", flag: "🇺🇸", currencyCode: "USD", symbol: "$", rate: 1.0 },
  { code: "EU", name: "European Union", flag: "🇪🇺", currencyCode: "EUR", symbol: "€", rate: 0.92 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currencyCode: "GBP", symbol: "£", rate: 0.78 },
  { code: "IN", name: "India", flag: "🇮🇳", currencyCode: "INR", symbol: "₹", rate: 83.5 },
  { code: "JP", name: "Japan", flag: "🇯🇵", currencyCode: "JPY", symbol: "¥", rate: 158.0 },
  { code: "CA", name: "Canada", flag: "🇨🇦", currencyCode: "CAD", symbol: "C$", rate: 1.37 },
  { code: "AU", name: "Australia", flag: "🇦🇺", currencyCode: "AUD", symbol: "A$", rate: 1.51 },
];

interface CurrencyState {
  currentCountry: CountryConfig;
  setCountry: (code: string) => void;
  formatAmount: (usdAmount: number, options?: { showCode?: boolean; decimals?: number }) => string;
  convertAmount: (usdAmount: number) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currentCountry: COUNTRIES[0],
  setCountry: (code) => {
    const found = COUNTRIES.find((c) => c.code === code);
    if (found) {
      set({ currentCountry: found });
    }
  },
  convertAmount: (usdAmount) => {
    const { rate } = get().currentCountry;
    return usdAmount * rate;
  },
  formatAmount: (usdAmount, options) => {
    const { symbol, currencyCode } = get().currentCountry;
    const converted = get().convertAmount(usdAmount);
    const decimals = options?.decimals !== undefined ? options.decimals : 0;
    
    // Format number
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    
    return options?.showCode ? `${symbol}${formatted} ${currencyCode}` : `${symbol}${formatted}`;
  },
}));

export const replaceUSDInText = (text: string, formatAmount: (val: number, options?: any) => string) => {
  if (!text) return text;
  return text.replace(/\$([0-9,]+(?:\.[0-9]+)?)/g, (match, p1) => {
    const val = parseFloat(p1.replace(/,/g, ""));
    if (isNaN(val)) return match;
    const hasDecimals = p1.includes(".");
    return formatAmount(val, { decimals: hasDecimals ? 2 : 0 });
  });
};
