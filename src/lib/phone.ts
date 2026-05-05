export const normalizeUzPhoneDigits = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "998";
  if (digits.startsWith("998")) return digits.slice(0, 12);
  return `998${digits}`.slice(0, 12);
};

export const formatUzPhoneInput = (value: string): string => {
  const digits = normalizeUzPhoneDigits(value);
  const local = digits.slice(3);

  const p1 = local.slice(0, 2);
  const p2 = local.slice(2, 5);
  const p3 = local.slice(5, 7);
  const p4 = local.slice(7, 9);

  let formatted = "+998";
  if (p1) formatted += ` ${p1}`;
  if (p2) formatted += ` ${p2}`;
  if (p3) formatted += ` ${p3}`;
  if (p4) formatted += ` ${p4}`;
  return formatted;
};
