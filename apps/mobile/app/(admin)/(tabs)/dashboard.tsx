import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { LayoutDashboard, Users, CheckCircle, Flag, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-[#fef9f3]">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View className="px-5 py-5 bg-white border-b border-black/[0.06]">
        <Text className="text-base text-[#666666]">Admin Dashboard</Text>
        <Text className="text-[28px] font-bold text-[#333333] mt-1">
          {user?.firstName} 👋
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-5 gap-6">
        {/* Stats Overview */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-[#333333]">Vue d'ensemble</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="w-[48%] bg-white rounded-xl p-4 gap-2">
              <Users size={24} color="#0d7377" />
              <Text className="text-2xl font-bold text-[#333333]">0</Text>
              <Text className="text-xs text-[#666666]">Utilisateurs actifs</Text>
            </View>
            <View className="w-[48%] bg-white rounded-xl p-4 gap-2">
              <CheckCircle size={24} color="#0d7377" />
              <Text className="text-2xl font-bold text-[#333333]">0</Text>
              <Text className="text-xs text-[#666666]">Vérifications en attente</Text>
            </View>
            <View className="w-[48%] bg-white rounded-xl p-4 gap-2">
              <Flag size={24} color="#0d7377" />
              <Text className="text-2xl font-bold text-[#333333]">0</Text>
              <Text className="text-xs text-[#666666]">Signalements</Text>
            </View>
            <View className="w-[48%] bg-white rounded-xl p-4 gap-2">
              <TrendingUp size={24} color="#0d7377" />
              <Text className="text-2xl font-bold text-[#333333]">0</Text>
              <Text className="text-xs text-[#666666]">Sessions ce mois</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="gap-4">
          <Text className="text-lg font-bold text-[#333333]">Activité récente</Text>
          <View className="bg-white rounded-xl p-8 items-center gap-3">
            <LayoutDashboard size={48} color="#666666" />
            <Text className="text-base font-semibold text-[#333333]">
              Aucune activité récente
            </Text>
            <Text className="text-sm text-[#666666] text-center">
              Les activités de la plateforme apparaîtront ici
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
