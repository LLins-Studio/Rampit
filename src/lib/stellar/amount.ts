/** Convert a human amount (e.g. "10.5") to token smallest units. */
export function humanAmountToUnits(human: string, decimals: number): bigint {
  const trimmed = human.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid amount (e.g. 10 or 10.5)");
  }

  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > decimals) {
    throw new Error(`Use at most ${decimals} decimal places`);
  }

  const paddedFrac = frac.padEnd(decimals, "0");
  const combined = `${whole}${paddedFrac}`.replace(/^0+/, "") || "0";
  return BigInt(combined);
}

export function unitsToHuman(units: bigint, decimals: number): string {
  const s = units.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, -decimals) || "0";
  const frac = s.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}
