export const formatUzs = (value: number, locale = "ru-RU") =>
  `${Math.round(value).toLocaleString(locale)}`;

export const formatUzsPerM2 = (value: number, locale = "ru-RU") =>
  `${Math.round(value).toLocaleString(locale)}`;

export const formatMoneyInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const parseMoneyInput = (masked: string) =>
  Number(masked.replace(/\s/g, "")) || 0;
