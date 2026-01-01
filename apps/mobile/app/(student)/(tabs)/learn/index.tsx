import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Calendar, Users, TrendingUp, Target } from 'lucide-react-native';
import { Colors, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 4;

type TabType = 'sessions' | 'classes' | 'progress' | 'goals';

export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('sessions');

  const tabs = [
    { id: 'sessions' as TabType, label: 'Sessions', icon: Calendar, route: '/(student)/(tabs)/sessions' },
    { id: 'classes' as TabType, label: 'Classes', icon: Users, route: '/(student)/classes' },
    { id: 'progress' as TabType, label: 'Progrès', icon: TrendingUp, route: '/(student)/(tabs)/progress' },
    { id: 'goals' as TabType, label: 'Objectifs', icon: Target, route: '/(student)/(tabs)/progress/goals' },
  ];

  const handleTabPress = (tab: typeof tabs[0]) => {
    setActiveTab(tab.id);
    router.push(tab.route as any);
  };

  return (
    <View style={styles.container}>
      <PageHeader title="Apprendre" variant="primary" />

      <View style={styles.content}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                  <Icon
                    size={24}
                    color={isActive ? Colors.white : Colors.textSecondary}
                    strokeWidth={2}
                  />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Sélectionnez une section ci-dessus pour accéder à vos sessions, classes, progrès ou objectifs.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: 8,
    ...Shadows.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.large,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: 24,
    marginTop: 20,
    ...Shadows.small,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
