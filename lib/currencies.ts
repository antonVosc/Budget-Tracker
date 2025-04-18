export const Currencies = [
  { value: "USD", label: "$ Dollar", locale: "en-US" },
  { value: "GBP", label: "£ Pound", locale: "en-GB" },
  { value: "EUR", label: "€ Euro", locale: "de-DE" },
  { value: "JPY", label: "¥ Yen", locale: "ja-JP" },
];

export type Currency = (typeof Currencies)[0];
