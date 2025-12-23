import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Plus, Trash2, Check } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank',
      last4: '1234',
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(methods => methods.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert('Info', 'Fonctionnalité à venir');
  };

  const getCardBrandLogo = (brand?: string) => {
    return brand || 'Card';
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
        <Text className="text-lg font-bold text-text-primary">Méthodes de paiement</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {/* Add Payment Method Button */}
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-xl p-4 mb-6 border-2 border-primary border-dashed"
          onPress={handleAddPaymentMethod}
        >
          <View className="w-10 h-10 rounded-full bg-bg-secondary justify-center items-center mr-3">
            <Plus size={24} color="#0d7377" strokeWidth={2.5} />
          </View>
          <Text className="text-base font-semibold text-primary">
            Ajouter une méthode de paiement
          </Text>
        </TouchableOpacity>

        {/* Payment Methods List */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-text-primary mb-4">
            Vos méthodes de paiement
          </Text>
          
          {paymentMethods.length === 0 ? (
            <View className="items-center py-12 gap-4">
              <CreditCard size={48} color="#666666" />
              <Text className="text-base text-text-secondary font-medium">
                Aucune méthode de paiement
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {paymentMethods.map((method) => (
                <View key={method.id} className="bg-white rounded-xl p-4 border border-border">
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 rounded-full bg-bg-secondary justify-center items-center mr-3">
                      <CreditCard size={24} color="#0d7377" strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      {method.type === 'card' ? (
                        <>
                          <Text className="text-base font-semibold text-text-primary">
                            {getCardBrandLogo(method.brand)} •••• {method.last4}
                          </Text>
                          <Text className="text-[13px] text-text-secondary">
                            Expire {method.expiryMonth}/{method.expiryYear}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-base font-semibold text-text-primary">
                            Compte bancaire •••• {method.last4}
                          </Text>
                          <Text className="text-[13px] text-text-secondary">
                            Compte de retrait
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    {method.isDefault ? (
                      <View className="flex-row items-center bg-success px-3 py-1.5 rounded-full gap-1">
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        <Text className="text-xs font-semibold text-white">Par défaut</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="px-3 py-1.5 rounded-full border border-primary"
                        onPress={() => handleSetDefault(method.id)}
                      >
                        <Text className="text-xs font-semibold text-primary">
                          Définir par défaut
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      className="w-9 h-9 rounded-full bg-bg-secondary justify-center items-center"
                      onPress={() => handleDelete(method.id)}
                    >
                      <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
