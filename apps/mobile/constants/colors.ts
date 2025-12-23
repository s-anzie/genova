// Genova - Charte Graphique
// Couleurs définies selon la charte graphique officielle

export const Colors = {
  // Couleurs Principales
  primary: '#0d7377', // Genova Teal
  secondary: '#14FFEC', // Genova Cyan
  
  // Couleurs Complémentaires
  accent1: '#ff6b6b', // Genova Coral
  accent2: '#ffd93d', // Genova Gold
  cream: '#fef9f3', // Genova Cream
  peach: '#ffe4d6', // Genova Peach
  
  // Couleurs Utilitaires
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  white: '#FFFFFF',
  success: '#4ade80',
  error: '#ef4444',
  
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#f5f7fa',
  bgCream: '#fef9f3',
  
  // Borders
  border: '#e0e0e0',
  borderLight: 'rgba(13, 115, 119, 0.1)',
};

export const Gradients = {
  primary: ['#0d7377', '#14FFEC'] as const, // Dégradé Principal
  warm: ['#ff6b6b', '#ffd93d'] as const, // Dégradé Chaleureux
  background: ['#f5f7fa', '#e9eff5'] as const, // Dégradé Arrière-plan
  cream: ['#fef9f3', '#ffffff'] as const, // Dégradé Crème
  subtle: ['#fef9f3', '#ffe4d6'] as const, // Dégradé Subtil
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  primary: {
    shadowColor: '#0d7377',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  small: 6,
  medium: 10,
  large: 12,
  xlarge: 16,
  xxlarge: 20,
  round: 9999,
};
