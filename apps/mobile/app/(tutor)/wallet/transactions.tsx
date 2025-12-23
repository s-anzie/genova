import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Filter,
} from 'lucide-react-native';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'credit',
      amount: 45.00,
      description: 'Cours de mathématiques - Jean Dupont',
      date: '2024-12-20T10:30:00',
      status: 'completed',
    },
    {
      id: '2',
      type: 'debit',
      amount: 100.00,
      description: 'Retrait vers compte bancaire',
      date: '2024-12-19T14:20:00',
      status: 'pending',
    },
    {
      id: '3',
      type: 'credit',
      amount: 30.00,
      description: 'Cours de physique - Marie Martin',
      date: '2024-12-18T16:45:00',
      status: 'completed',
    },
  ]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4ade80';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Complété';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      default: return status;
    }
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
        <Text className="text-lg font-bold text-text-primary">Historique</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-bg-secondary justify-center items-center">
          <Filter size={20} color="#333333" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row bg-white px-5 py-3 gap-2 border-b border-border">
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-full items-center ${
            filter === 'all' ? 'bg-primary' : 'bg-bg-secondary'
          }`}
          onPress={() => setFilter('all')}
        >
          <Text className={`text-sm font-semibold ${
            filter === 'all' ? 'text-white' : 'text-text-secondary'
          }`}>
            Tout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-full items-center ${
            filter === 'credit' ? 'bg-primary' : 'bg-bg-secondary'
          }`}
          onPress={() => setFilter('credit')}
        >
          <Text className={`text-sm font-semibold ${
            filter === 'credit' ? 'text-white' : 'text-text-secondary'
          }`}>
            Revenus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-full items-center ${
            filter === 'debit' ? 'bg-primary' : 'bg-bg-secondary'
          }`}
          onPress={() => setFilter('debit')}
        >
          <Text className={`text-sm font-semibold ${
            filter === 'debit' ? 'text-white' : 'text-text-secondary'
          }`}>
            Retraits
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View className="items-center py-16 gap-4">
            <Calendar size={48} color="#666666" />
            <Text className="text-base text-text-secondary font-medium">Aucune transaction</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredTransactions.map((transaction) => (
              <View key={transaction.id} className="flex-row items-center bg-white rounded-xl p-4 border border-border">
                <View className="w-10 h-10 rounded-full bg-bg-secondary justify-center items-center mr-3">
                  {transaction.type === 'credit' ? (
                    <ArrowDownLeft size={20} color="#4ade80" strokeWidth={2.5} />
                  ) : (
                    <ArrowUpRight size={20} color="#ef4444" strokeWidth={2.5} />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-text-primary mb-1">
                    {transaction.description}
                  </Text>
                  <Text className="text-xs text-text-secondary mb-1.5">
                    {formatDate(transaction.date)}
                  </Text>
                  <View 
                    className="self-start px-2 py-0.5 rounded-xl"
                    style={{ backgroundColor: `${getStatusColor(transaction.status)}20` }}
                  >
                    <Text 
                      className="text-[11px] font-semibold"
                      style={{ color: getStatusColor(transaction.status) }}
                    >
                      {getStatusText(transaction.status)}
                    </Text>
                  </View>
                </View>

                <Text className={`text-base font-bold ml-3 ${
                  transaction.type === 'credit' ? 'text-success' : 'text-error'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
