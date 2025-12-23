import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, DollarSign, AlertCircle } from 'lucide-react-native';
import { useWallet } from '@/hooks/useWallet';

export default function AddFundsScreen() {
  const router = useRouter();
  const { balance } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const currentBalance = balance?.totalBalance || 0;

  const handleAddFunds = async () => {
    const addAmount = parseFloat(amount);
    
    if (!addAmount || addAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (addAmount < 5) {
      Alert.alert('Erreur', 'Le montant minimum est de 5 €');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement add funds API call with Stripe
      Alert.alert('Succès', 'Fonds ajoutés avec succès');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const setQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <View className="flex-1 bg-bg-secondary">
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-[60px] pb-5 bg-white border-b border-border">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-bg-secondary justify-center items-center"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333333" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text-primary">Ajouter des fonds</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View className="bg-primary rounded-2xl p-6 items-center mb-6">
          <Text className="text-sm text-white/80 font-medium mb-2">Solde actuel</Text>
          <Text className="text-4xl font-extrabold text-white">{currentBalance.toFixed(2)} €</Text>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-text-primary mb-3">Montant à ajouter</Text>
          <View className="flex-row items-center bg-white rounded-xl px-4 py-4 border border-border">
            <DollarSign size={20} color="#666666" />
            <TextInput
              className="flex-1 text-2xl font-bold text-text-primary ml-2"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#666666"
            />
            <Text className="text-xl font-semibold text-text-secondary">€</Text>
          </View>
        </View>

        {/* Quick Amount Buttons */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-text-primary mb-3">Montants rapides</Text>
          <View className="flex-row gap-3">
            {[10, 25, 50, 100].map((value) => (
              <TouchableOpacity
                key={value}
                className={`flex-1 py-3 rounded-xl border ${
                  amount === value.toString()
                    ? 'bg-primary border-primary'
                    : 'bg-white border-border'
                } items-center`}
                onPress={() => setQuickAmount(value)}
              >
                <Text
                  className={`text-sm font-semibold ${
                    amount === value.toString() ? 'text-white' : 'text-text-primary'
                  }`}
                >
                  {value} €
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View className="flex-row bg-white rounded-xl p-4 gap-3 mb-6">
          <AlertCircle size={20} color="#0d7377" />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-text-primary mb-2">
              Informations importantes
            </Text>
            <Text className="text-[13px] text-text-secondary leading-5">
              • Montant minimum : 5 €{'\n'}
              • Paiement sécurisé par Stripe{'\n'}
              • Les fonds sont disponibles immédiatement
            </Text>
          </View>
        </View>

        {/* Add Funds Button */}
        <TouchableOpacity
          className={`bg-primary rounded-xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
          onPress={handleAddFunds}
          disabled={loading}
        >
          <Text className="text-base font-bold text-white">
            {loading ? 'Traitement...' : 'Ajouter'}
          </Text>
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
