import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

export default function LearnLayout() {
  return (
    <View style={styles.container}>
      <PageHeader title="Apprendre" variant="primary" />
      
      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '700',
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors.primary,
            height: 3,
            borderRadius: 2,
          },
          tabBarPressColor: Colors.primary + '15',
          tabBarScrollEnabled: false,
        }}
      >
        <MaterialTopTabs.Screen
          name="sessions"
          options={{
            title: 'Sessions',
          }}
        />
        <MaterialTopTabs.Screen
          name="classes"
          options={{
            title: 'Classes',
          }}
        />
        <MaterialTopTabs.Screen
          name="progress"
          options={{
            title: 'Progrès',
          }}
        />
        <MaterialTopTabs.Screen
          name="goals"
          options={{
            title: 'Objectifs',
          }}
        />
      </MaterialTopTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
});
