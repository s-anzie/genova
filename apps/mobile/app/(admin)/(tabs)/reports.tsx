import React from 'react';
import { View, Text, SafeAreaView, StatusBar } from 'react-native';
import { Flag } from 'lucide-react-native';

export default function AdminReportsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#fef9f3]">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="px-5 py-4 bg-white border-b border-black/[0.06]">
        <Text className="text-2xl font-bold text-[#333333]">Signalements</Text>
      </View>
      <View className="flex-1 justify-center items-center p-5 gap-4">
        <Flag size={64} color="#666666" />
        <Text className="text-xl font-semibold text-[#333333]">Signalements</Text>
        <Text className="text-sm text-[#666666] text-center">
          Gérez les signalements de contenu et d'utilisateurs
        </Text>
      </View>
    </SafeAreaView>
  );
}
