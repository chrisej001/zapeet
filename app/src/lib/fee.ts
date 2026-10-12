/** Zapeet's cut of every order: 2% of the item price, capped at ₦2,000.
 * Pure math, shared by the server (checkout splits) and the link-creation
 * form's live preview. */
export const FEE_RATE = 0.02;
export const FEE_CAP_NAIRA = 2000;

export function zapeetFeeNaira(itemPriceNaira: number) {
  return Math.min(FEE_CAP_NAIRA, Math.round(itemPriceNaira * FEE_RATE * 100) / 100);
}

export type PayoutPlan = {
  /** What Felicity's goods leg collects — item price, plus the fee when the
   * customer is paying it. Delivery is added on top by Felicity. */
  goodsAmountNaira: number;
  feeNaira: number;
  vendorPayoutNaira: number;
  vendorPercentage: number;
  feePercentage: number;
};

/** Felicity's `splits` take percentages of goods_amount_naira that must sum
 * to exactly 100 — not naira amounts — so a capped fee becomes a fractional
 * percentage. Six decimal places keeps the rounding error under a kobo for
 * any realistic order; the vendor's share is derived as 100 minus the fee's
 * so the two always sum exactly (verified accepted live 2026-10-12). */
export function planPayout(itemPriceNaira: number, customerPaysFee: boolean): PayoutPlan {
  const feeNaira = zapeetFeeNaira(itemPriceNaira);
  const goodsAmountNaira = customerPaysFee ? itemPriceNaira + feeNaira : itemPriceNaira;
  const vendorPayoutNaira = goodsAmountNaira - feeNaira;

  const feePercentage = Number(((feeNaira / goodsAmountNaira) * 100).toFixed(6));
  const vendorPercentage = Number((100 - feePercentage).toFixed(6));

  return { goodsAmountNaira, feeNaira, vendorPayoutNaira, vendorPercentage, feePercentage };
}
