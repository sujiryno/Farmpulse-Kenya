// components/DailyPassModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function DailyPassModal({ visible, onClose, farmerPhone }) {
  const buyDailyPass = async () => {
    const response = await fetch('https://your-project.supabase.co/functions/v1/mpesa-daily-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: farmerPhone })
    });
    const data = await response.json();
    if (data.success) {
      Alert.alert('STK Push Sent', 'Check your phone and enter M-Pesa PIN to activate.');
      onClose();
    } else {
      Alert.alert('Error', data.error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-lg w-11/12">
          <Text className="text-xl font-bold text-center">Free Sessions Used</Text>
          <Text className="text-center my-4">You've used your 2 free diagnoses today. Get unlimited for 24 hours.</Text>
          <TouchableOpacity onPress={buyDailyPass} className="bg-green-600 p-3 rounded-lg mb-2">
            <Text className="text-white text-center font-bold">Buy Daily Pass (KES 30)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="border border-gray-300 p-3 rounded-lg">
            <Text className="text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}