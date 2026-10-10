// screens/ProfitCalculatorScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfitCalculatorScreen({ farmerId }) {
  const [birdCount, setBirdCount] = useState('');
  const [chickCost, setChickCost] = useState('');
  const [mortalityPercent, setMortalityPercent] = useState('5');
  const [sellingPrice, setSellingPrice] = useState('');
  const [result, setResult] = useState(null);
  const [feedBrands, setFeedBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    // Fetch available feed brands for dropdown
    supabase.from('feed_prices').select('brand').eq('verified', true).then(({ data }) => {
      const unique = [...new Map(data.map(item => [item.brand, item])).values()];
      setFeedBrands(unique);
      if (unique[0]) setSelectedBrand(unique[0].brand);
    });
  }, []);

  const calculate = async () => {
    const response = await fetch('/api/profit-calculator', {
      method: 'POST',
      body: JSON.stringify({
        farmerId,
        poultryType: 'broiler',
        birdCount: parseInt(birdCount),
        chickCost: parseInt(chickCost),
        mortalityPercent: parseFloat(mortalityPercent),
        sellingWeightKg: 2.0,
        pricePerKg: parseInt(sellingPrice),
        feedBrand: selectedBrand,
        feedType: 'finisher',
        medicineIds: [],
      })
    });
    const data = await response.json();
    setResult(data);
  };

  return (
    <ScrollView className="p-4">
      <Text className="text-xl font-bold mb-4">Profit Calculator</Text>
      <TextInput placeholder="Number of birds" keyboardType="numeric" value={birdCount} onChangeText={setBirdCount} className="border p-2 mb-2" />
      <TextInput placeholder="Chick cost per bird (KES)" keyboardType="numeric" value={chickCost} onChangeText={setChickCost} className="border p-2 mb-2" />
      <TextInput placeholder="Expected mortality (%)" value={mortalityPercent} onChangeText={setMortalityPercent} className="border p-2 mb-2" />
      <TextInput placeholder="Selling price per kg (KES)" keyboardType="numeric" value={sellingPrice} onChangeText={setSellingPrice} className="border p-2 mb-2" />
      <TouchableOpacity onPress={calculate} className="bg-green-600 p-3 rounded-lg">
        <Text className="text-white text-center font-bold">Calculate Profit</Text>
      </TouchableOpacity>
      {result && (
        <View className="mt-4 p-3 bg-gray-100 rounded-lg">
          <Text>Total Cost: KES {result.totalCost.toFixed(2)}</Text>
          <Text>Expected Revenue: KES {result.expectedRevenue.toFixed(2)}</Text>
          <Text className="font-bold">Profit: KES {result.profit.toFixed(2)}</Text>
          <Text>Break-even birds: {Math.ceil(result.breakEvenBirdCount)}</Text>
        </View>
      )}
    </ScrollView>
  );
}