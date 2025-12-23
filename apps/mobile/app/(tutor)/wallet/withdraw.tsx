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

export default function WithdrawScreen() {
  const router = useRouter();
  const { balance } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const availableBalance = balance?.availableBalance || 0;

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (withdrawAmount > availableBalance) {
      Alert.alert('Erreur', 'Montant supérieur au solde disponible');
      return;
    }

    if (withdrawAmount < 10) {
      Alert.alert('Erreur', 'Le montant minimum de retrait est de 10 €');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement withdrawal API call
      Alert.alert('Succès', 'Votre demande de retrait a été enregistrée');
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
        <Text className="text-lg font-bold text-text-primary">Retirer des fonds</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Available Balance */}
        <View className="bg-primary rounded-2xl p-6 items-center mb-6">
          <Text className="text-sm text-white/80 font-medium mb-2">Solde disponible</Text>
          <Text className="text-4xl font-extrabold text-white">{availableBalance.toFixed(2)} €</Text>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-text-primary mb-3">Montant à retirer</Text>
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
            {[20, 50, 100, 200].map((value) => (
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
              • Montant minimum : 10 €{'\n'}
              • Délai de traitement : 2-5 jours ouvrés{'\n'}
              • Les fonds seront virés sur votre compte bancaire
            </Text>
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity
          className={`bg-primary rounded-xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
          onPress={handleWithdraw}
          disabled={loading}
        >
          <Text className="text-base font-bold text-white">
            {loading ? 'Traitement...' : 'Retirer'}
          </Text>
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
