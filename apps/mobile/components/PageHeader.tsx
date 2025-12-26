import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Gradients } from '@/constants/colors';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showGradient?: boolean;
  variant?: 'default' | 'primary'; // New prop for header style
}

export function PageHeader({ 
  title, 
  subtitle, 
  rightElement, 
  leftElement,
  showBackButton = false,
  onBackPress,
  showGradient = true,
  variant = 'default' // Default to cream/white style
}: PageHeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? Colors.white : Colors.textPrimary;
  const subtitleColor = isPrimary ? 'rgba(255, 255, 255, 0.8)' : Colors.textSecondary;

  const content = (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isPrimary ? "light-content" : "dark-content"} 
        backgroundColor={isPrimary ? Colors.primary : Colors.bgCream} 
      />
      <View style={styles.content}>
        {(showBackButton || leftElement) && (
          <View style={styles.leftElement}>
            {leftElement || (
              <TouchableOpacity 
                style={[styles.backButton, isPrimary && styles.backButtonPrimary]} 
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <ArrowLeft size={28} color={textColor} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>}
        </View>
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
    </View>
  );

  if (isPrimary) {
    return (
      <View style={[styles.wrapper, styles.primaryWrapper]}>
        {content}
      </View>
    );
  }

  if (showGradient) {
    return (
      <LinearGradient
        colors={['#ffffff', '#fef9f3']}
        style={styles.gradient}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
}

interface TabSelectorProps {
  tabs: Array<{ key: string; label: string }>;
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabSelector({ tabs, activeTab, onTabChange }: TabSelectorProps) {
  return (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: Spacing.md,
  },
  wrapper: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 115, 119, 0.08)',
  },
  primaryWrapper: {
    backgroundColor: Colors.primary,
    borderBottomWidth: 0,
  },
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60, // Espace pour la barre de statut
    paddingBottom: Spacing.sm,
  },
  leftElement: {
    marginRight: Spacing.sm,
    paddingTop: 4,
  },
  backButton: {
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rightElement: {
    marginLeft: Spacing.md,
  },
  // Tab Selector Styles
  tabContainer: {
    backgroundColor: Colors.bgCream,
    paddingVertical: Spacing.md,
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.white,
    minWidth: 110,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
