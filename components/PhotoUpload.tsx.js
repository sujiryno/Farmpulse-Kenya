// components/PhotoUpload.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoUpload({ onPhotoTaken }) {
  const [imageUri, setImageUri] = useState(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take photos of sick birds.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      onPhotoTaken(result.assets[0].base64); // send base64 to API
    }
  };

  return (
    <View className="items-center p-4">
      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-48 h-48 rounded-lg mb-2" />
      ) : (
        <View className="w-48 h-48 bg-gray-200 rounded-lg items-center justify-center mb-2">
          <Text>No photo</Text>
        </View>
      )}
      <TouchableOpacity onPress={takePhoto} className="bg-green-600 px-4 py-2 rounded-lg">
        <Text className="text-white font-bold">{imageUri ? 'Retake Photo' : 'Take Photo'}</Text>
      </TouchableOpacity>
    </View>
  );
}