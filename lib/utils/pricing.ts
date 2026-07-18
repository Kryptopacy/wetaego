/**
 * Calculates the effective discount based on the higher of the location's global discount
 * or the user's local session discount (e.g. from a gamified spinner).
 * 
 * @param subtotalMinor The total amount in minor currency units (e.g. cents)
 * @param spinnerDiscount The discount percentage from the user's session (0-100)
 * @param globalDiscountPercentage The global discount percentage for the venue (0-100)
 * @returns The calculated discount amount in minor currency units
 */
export function calculateEffectiveDiscount(
  subtotalMinor: number, 
  spinnerDiscount?: number | null, 
  globalDiscountPercentage?: number | null
): number {
  const effectiveGlobalPercent = globalDiscountPercentage || 0;
  const effectivePercent = Math.max(effectiveGlobalPercent, spinnerDiscount || 0);
  const discountMultiplier = effectivePercent / 100;
  
  return Math.floor(subtotalMinor * discountMultiplier);
}
