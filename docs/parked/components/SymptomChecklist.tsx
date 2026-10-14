// components/SymptomChecklist.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';

const symptomGroups = [
  { name: 'Eyes', symptoms: ['Watery eyes', 'Swollen eyelids', 'Dull eyes'] },
  { name: 'Feathers', symptoms: ['Ruffled feathers', 'Drooping wings', 'Feather loss'] },
  { name: 'Droppings', symptoms: ['Bloody droppings', 'Greenish diarrhoea', 'White pasted vent'] },
  { name: 'Behaviour', symptoms: ['Lethargy', 'Hunched posture', 'Twisted neck', 'Laboured breathing'] },
  { name: 'Legs', symptoms: ['Leg paralysis', 'Swollen joints', 'Lameness'] },
];

export default function SymptomChecklist({ onSymptomsChange }) {
  const [selected, setSelected] = useState([]);

  const toggleSymptom = (symptom) => {
    const newSelected = selected.includes(symptom)
      ? selected.filter(s => s !== symptom)
      : [...selected, symptom];
    setSelected(newSelected);
    onSymptomsChange(newSelected);
  };

  return (
    <ScrollView className="p-4">
      {symptomGroups.map(group => (
        <View key={group.name} className="mb-4">
          <Text className="text-lg font-bold text-green-800 mb-2">{group.name}</Text>
          <View className="flex-row flex-wrap gap-2">
            {group.symptoms.map(symptom => (
              <TouchableOpacity
                key={symptom}
                onPress={() => toggleSymptom(symptom)}
                className={`px-3 py-2 rounded-full border ${
                  selected.includes(symptom) ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={selected.includes(symptom) ? 'text-white' : 'text-gray-800'}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}