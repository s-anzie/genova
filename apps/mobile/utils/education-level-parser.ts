/**
 * Parse and format education level string into readable components
 * Format: level_system_specificLevel_stream
 * Example: "high_school_francophone_general_1ere_C"
 */

export interface EducationLevelJson {
  level: string;
  system?: string;
  specificLevel?: string;
  stream?: string;
}

export interface ParsedEducationLevel {
  level: string;
  levelLabel: string;
  system?: string;
  systemLabel?: string;
  specificLevel?: string;
  specificLevelLabel?: string;
  stream?: string;
  streamLabel?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  primary: 'Primaire',
  middle_school: 'Collège',
  high_school: 'Lycée',
  university: 'Université',
};

const SYSTEM_LABELS: Record<string, string> = {
  francophone: 'Francophone',
  anglophone: 'Anglophone',
  francophone_general: 'Général (Francophone)',
  francophone_technical: 'Technique (Francophone)',
  licence: 'Licence',
  master: 'Master',
};

const SPECIFIC_LEVEL_LABELS: Record<string, string> = {
  // Primaire
  SIL: 'SIL',
  CP: 'Préparatoire (CP)',
  CE1: 'CE1',
  CE2: 'CE2',
  CM1: 'CM1',
  CM2: 'CM2',
  Class1: 'Class 1',
  Class2: 'Class 2',
  Class3: 'Class 3',
  Class4: 'Class 4',
  Class5: 'Class 5',
  Class6: 'Class 6',
  
  // Collège
  '6eme': '6ème',
  '5eme': '5ème',
  '4eme': '4ème',
  '3eme': '3ème',
  '1ere_annee': '1ère année',
  '2eme_annee': '2ème année',
  '3eme_annee': '3ème année',
  '4eme_annee': '4ème année',
  Form1: 'Form 1',
  Form2: 'Form 2',
  Form3: 'Form 3',
  Form4: 'Form 4',
  
  // Lycée
  '2nde': 'Seconde',
  '2nde_tech': 'Seconde',
  '1ere': 'Première',
  '1ere_tech': 'Première',
  Tle: 'Terminale',
  Tle_tech: 'Terminale',
  Form5: 'Form 5',
  LowerSixth: 'Lower Sixth',
  UpperSixth: 'Upper Sixth',
  
  // Université
  L1: 'Licence 1 (L1)',
  L2: 'Licence 2 (L2)',
  L3: 'Licence 3 (L3)',
  M1: 'Master 1 (M1)',
  M2: 'Master 2 (M2)',
};

export function parseEducationLevel(educationLevel: EducationLevelJson): ParsedEducationLevel {
  const level = educationLevel.level || '';
  const system = educationLevel.system || '';
  const specificLevel = educationLevel.specificLevel || '';
  const stream = educationLevel.stream || '';
  
  return {
    level,
    levelLabel: LEVEL_LABELS[level] || level,
    system: system || undefined,
    systemLabel: system ? (SYSTEM_LABELS[system] || system) : undefined,
    specificLevel: specificLevel || undefined,
    specificLevelLabel: specificLevel ? (SPECIFIC_LEVEL_LABELS[specificLevel] || specificLevel) : undefined,
    stream: stream || undefined,
    streamLabel: stream || undefined,
  };
}

/**
 * Format education level for display
 */
export function formatEducationLevel(educationLevel: EducationLevelJson, format: 'short' | 'full' = 'full'): string {
  const parsed = parseEducationLevel(educationLevel);
  
  if (format === 'short') {
    // Short format: "Lycée - Première C"
    const parts = [parsed.levelLabel];
    if (parsed.specificLevelLabel) {
      parts.push(parsed.specificLevelLabel);
    }
    if (parsed.streamLabel) {
      parts.push(parsed.streamLabel);
    }
    return parts.join(' ');
  }
  
  // Full format with all details
  const parts = [parsed.levelLabel];
  if (parsed.systemLabel) {
    parts.push(parsed.systemLabel);
  }
  if (parsed.specificLevelLabel) {
    parts.push(parsed.specificLevelLabel);
  }
  if (parsed.streamLabel) {
    parts.push(parsed.streamLabel);
  }
  return parts.join(' - ');
}

/**
 * Get education level components for display
 */
export function getEducationLevelComponents(educationLevel: EducationLevelJson): {
  label: string;
  value: string;
}[] {
  const parsed = parseEducationLevel(educationLevel);
  const components: { label: string; value: string }[] = [];

  components.push({ label: 'Niveau', value: parsed.levelLabel });

  if (parsed.systemLabel) {
    components.push({ label: 'Système', value: parsed.systemLabel });
  }

  if (parsed.specificLevelLabel) {
    components.push({ label: 'Classe', value: parsed.specificLevelLabel });
  }

  if (parsed.streamLabel) {
    components.push({ label: 'Filière', value: parsed.streamLabel });
  }

  return components;
}
