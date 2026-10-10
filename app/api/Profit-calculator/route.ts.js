import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  
  const {
    farmerId,
    name,
    poultryType,
    birdCount,
    chickCost,
    mortalityPercent,
    sellingWeightKg,
    pricePerKg,
    layRatePercent,
    eggPrice,
    cycleDays,
    feedBrand,
    feedType,
    medicineIds,
  } = body;

  // Validate
  if (!farmerId || !poultryType || !birdCount || !chickCost) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Fetch live feed price from F5
  const { data: feedPrice, error: feedError } = await supabase
    .from('feed_prices')
    .select('price_kes')
    .eq('brand', feedBrand)
    .eq('poultry_type', poultryType)
    .eq('feed_type', feedType)
    .eq('verified', true)
    .single();

  if (feedError || !feedPrice) {
    return NextResponse.json({ error: 'Feed price not found for selected brand/type' }, { status: 404 });
  }

  // 2. Fetch medicine prices from F9
  let totalMedicineCost = 0;
  if (medicineIds && medicineIds.length > 0) {
    const { data: medicines } = await supabase
      .from('medicine_prices')
      .select('price_kes')
      .in('id', medicineIds)
      .eq('verified', true);
    totalMedicineCost = medicines?.reduce((sum, m) => sum + (m.price_kes || 0), 0) || 0;
  }

  // 3. Calculate feed consumption per bird based on poultry type & cycle days
  // For MVP, use standard values (adjust later)
  let feedKgPerBird = 0;
  if (poultryType === 'broiler') {
    feedKgPerBird = 4.5; // 4.5kg per bird to 2kg weight
  } else if (poultryType === 'layer') {
    // Assume 120g per day, cycle days (e.g., 300 days) = 36kg per bird
    feedKgPerBird = (cycleDays || 300) * 0.12;
  } else { // kienyeji
    feedKgPerBird = 25; // 6 months
  }

  const bagsNeeded = (birdCount * feedKgPerBird) / 50; // 50kg bags
  const totalFeedCost = bagsNeeded * feedPrice.price_kes;

  // 4. Mortality calculation
  const mortalityCount = Math.ceil(birdCount * (mortalityPercent / 100));
  const survivingBirds = birdCount - mortalityCount;

  // 5. Total cost
  const totalChickCost = chickCost * birdCount;
  const totalCost = totalFeedCost + totalMedicineCost + totalChickCost;

  // 6. Revenue calculation
  let expectedRevenue = 0;
  if (poultryType === 'broiler') {
    const totalMeatKg = survivingBirds * sellingWeightKg;
    expectedRevenue = totalMeatKg * pricePerKg;
  } else if (poultryType === 'layer') {
    // layRatePercent = % of hens laying per day (e.g., 80% = 0.8)
    const eggsPerDay = survivingBirds * (layRatePercent / 100);
    const totalEggs = eggsPerDay * (cycleDays || 300);
    expectedRevenue = totalEggs * eggPrice;
  } else {
    // kienyeji: mixed meat + eggs (simplified as meat)
    const totalMeatKg = survivingBirds * (sellingWeightKg || 1.5);
    expectedRevenue = totalMeatKg * pricePerKg;
  }

  const profit = expectedRevenue - totalCost;
  const breakEvenBirdCount = poultryType === 'broiler' 
    ? totalCost / (sellingWeightKg * pricePerKg)
    : totalCost / (eggPrice * (layRatePercent / 100) * (cycleDays || 300));

  const result = {
    totalCost,
    expectedRevenue,
    profit,
    breakEvenBirdCount,
    costPerBird: totalCost / birdCount,
    revenuePerBird: expectedRevenue / birdCount,
    feedCostBreakdown: { bagsNeeded, costPerBag: feedPrice.price_kes, totalFeedCost },
    medicineCost: totalMedicineCost,
  };

  // 7. Save scenario if name provided
  if (name) {
    await supabase.from('profit_scenarios').insert({
      farmer_id: parseInt(farmerId),
      name,
      poultry_type: poultryType,
      bird_count: birdCount,
      chick_cost_kes: chickCost,
      mortality_percent: mortalityPercent,
      selling_weight_kg: sellingWeightKg,
      price_per_kg_kes: pricePerKg,
      lay_rate_percent: layRatePercent,
      egg_price_kes: eggPrice,
      cycle_days: cycleDays,
      feed_brand: feedBrand,
      feed_type: feedType,
      feed_price_kes: feedPrice.price_kes,
      medicine_ids: medicineIds,
      total_medicine_cost_kes: totalMedicineCost,
      total_cost_kes: result.totalCost,
      expected_revenue_kes: result.expectedRevenue,
      profit_kes: result.profit,
      break_even_bird_count: result.breakEvenBirdCount,
    });
  }

  return NextResponse.json(result);
}