export type QuoteInput = {
  weightKg: number;
  volumeM3?: number;
  cubageFactor?: number;
  pricePerKg?: number | null;
  fixedValue?: number | null;
  minValue?: number | null;
  grisPercent?: number;
  tdeValue?: number;
  tollValue?: number;
  freightTableMin?: number;
};

export type QuoteResult = {
  cubageWeightKg: number;
  taxableWeightKg: number;
  freightBaseValue: number;
  grisValue: number;
  tdeValue: number;
  tollValue: number;
  freightTotalValue: number;
};

export function calculateFreight(input: QuoteInput): QuoteResult {
  const cubageFactor = input.cubageFactor ?? 300;
  const cubageWeightKg = (input.volumeM3 ?? 0) * cubageFactor;
  const taxableWeightKg = Math.max(input.weightKg, cubageWeightKg);

  let base = 0;
  if (input.fixedValue != null && input.fixedValue > 0) {
    base = input.fixedValue;
  } else if (input.pricePerKg != null) {
    base = taxableWeightKg * input.pricePerKg;
  }
  const minValue = input.minValue ?? input.freightTableMin ?? 0;
  if (minValue > 0 && base < minValue) base = minValue;

  const grisValue = (base * (input.grisPercent ?? 0)) / 100;
  const tdeValue = input.tdeValue ?? 0;
  const tollValue = input.tollValue ?? 0;
  const freightTotalValue = base + grisValue + tdeValue + tollValue;

  return {
    cubageWeightKg,
    taxableWeightKg,
    freightBaseValue: round2(base),
    grisValue: round2(grisValue),
    tdeValue: round2(tdeValue),
    tollValue: round2(tollValue),
    freightTotalValue: round2(freightTotalValue),
  };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
}
