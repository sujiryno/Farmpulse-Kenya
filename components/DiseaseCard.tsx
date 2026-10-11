// components/DiseaseCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

export default function DiseaseCard({ disease, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} className="bg-white rounded-lg shadow p-3 mb-3 flex-row">
      <Image source={{ uri: disease.image_url }} className="w-20 h-20 rounded-lg mr-3" />
      <View className="flex-1">
        <Text className="font-bold text-lg">{disease.name}</Text>
        <Text className="text-gray-600" numberOfLines={2}>{disease.symptoms.join(', ')}</Text>
        <Text className="text-red-500 text-sm">Mortality: {disease.mortality_rate}</Text>
      </View>
    </TouchableOpacity>
  );
}