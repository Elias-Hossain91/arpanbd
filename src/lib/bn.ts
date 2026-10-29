const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBnDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** DD/MM/YYYY in Bengali numerals. */
export function formatBnDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return toBnDigits(`${dd}/${mm}/${d.getFullYear()}`);
}

export function timeAgoBn(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "এইমাত্র";
  if (m < 60) return `${toBnDigits(m)} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${toBnDigits(h)} ঘণ্টা আগে`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${toBnDigits(d)} দিন আগে`;
  return `${toBnDigits(Math.floor(d / 7))} সপ্তাহ আগে`;
}
