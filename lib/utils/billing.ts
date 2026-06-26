import { getPlanLimits } from '@/lib/utils/settings'

export type Tier = 'starter' | 'lite' | 'pro' | 'enterprise' | string;

export async function getFreePagesLimit(tier: Tier): Promise<number> {
  const dynamicPlanLimits = await getPlanLimits() as Record<string, { credits: number, pages: number, qr_codes: number }>
  return dynamicPlanLimits[tier]?.pages || 0;
}

export async function getFreeQrLimit(tier: Tier): Promise<number> {
  const dynamicPlanLimits = await getPlanLimits() as Record<string, { credits: number, pages: number, qr_codes: number }>
  return dynamicPlanLimits[tier]?.qr_codes || 0;
}

export function hasAdvancedAiFeatures(tier: Tier): boolean {
  return tier !== 'lite' && tier !== 'starter';
}
