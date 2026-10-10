// app/api/profit-calculator/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { 
    farmerId, poultryType, birdCount, chickCost, mortalityPercent, 
    sellingWeightKg, pricePerKg, feedBrand, feedType, medicineIds 
  } = body;

  // Get feed price from Supabase (F5)
  const { data: feedPrice } = await supabase
    .from('feed_prices')
    .select('price_kes')
    .eq('brand', feedBrand)
    .eq('poultry_type', poultryType)
    .eq('feed_type', feedType)
    .eq('verified', true)
    .single();

  // Get total medicine cost (F9)
  const { data: medicines } = await supabase
    .from('medicine_prices')
    .select('price_kes')
    .in('id', medicineIds)
    .eq('verified', true);

  const totalMedicineCost = medicines?.reduce((sum, m) => sum + m.price_kes, 0) || 0;

  // Assumptions per bird (MVP)
  const feedPerBirdKg = poultryType === 'broiler' ? 4.5 : 35; // broiler 4.5kg, layer 35kg per cycle
  const mortalityCount = Math.ceil(birdCount * (mortalityPercent / 100));
  const survivingBirds = birdCount - mortalityCount;

  const totalFeedCost = feedPrice.price_kes * (feedPerBirdKg / 50) * birdCount; // 50kg bag
  const totalChickCost = chickCost * birdCount;
  const totalCost = totalFeedCost + totalMedicineCost + totalChickCost;

  let expectedRevenue = 0;
  if (poultryType === 'broiler') {
    const totalMeatKg = survivingBirds * sellingWeightKg;
    expectedRevenue = totalMeatKg * pricePerKg;
  } else if (poultryType === 'layer') {
    // Simplified: assume 280 eggs per layer per cycle
    const totalEggs = survivingBirds * 280;
    const pricePerEgg = pricePerKg / 30; // pricePerKg here is per tray? adjust as needed
    expectedRevenue = totalEggs * pricePerEgg;
  }

  const profit = expectedRevenue - totalCost;
  const breakEvenBirdCount = totalCost / (sellingWeightKg * pricePerKg);

  return NextResponse.json({
    totalCost,
    expectedRevenue,
    profit,
    breakEvenBirdCount,
    costPerBird: totalCost / birdCount,
    revenuePerBird: expectedRevenue / birdCount,
  });
}