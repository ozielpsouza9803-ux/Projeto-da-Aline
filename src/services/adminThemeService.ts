export type AdminThemeId = 
  | 'azul-marinho' 
  | 'grafite' 
  | 'roxo' 
  | 'verde-esmeralda' 
  | 'vinho' 
  | 'azul-moderno';

export type AdminAccentId = 
  | 'dourado' 
  | 'ciano' 
  | 'lilas' 
  | 'verde' 
  | 'rosa' 
  | 'laranja';

export type AdminThemeMode = 'dark' | 'light';

export interface AdminThemePreference {
  themeId: AdminThemeId;
  accentId: AdminAccentId;
  mode: AdminThemeMode;
}

export interface ThemeDefinition {
  id: AdminThemeId;
  name: string;
  description: string;
  dark: {
    bg: string;
    sidebarBg: string;
    headerBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    inputBg: string;
  };
  light: {
    bg: string;
    sidebarBg: string;
    headerBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    inputBg: string;
  };
}

export interface AccentDefinition {
  id: AdminAccentId;
  name: string;
  colorHex: string;
  hoverHex: string;
  textOnAccent: string;
  badgeBg: string;
  badgeText: string;
  glowRgba: string;
}

export const ADMIN_THEMES: Record<AdminThemeId, ThemeDefinition> = {
  'azul-marinho': {
    id: 'azul-marinho',
    name: 'Azul-marinho',
    description: 'Tom clássico marinho elegante e profundo',
    dark: {
      bg: '#0a1128',
      sidebarBg: '#060c1e',
      headerBg: 'rgba(10, 17, 40, 0.95)',
      cardBg: '#101c3d',
      cardBorder: '#1c2d5a',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      inputBg: '#0d1733'
    },
    light: {
      bg: '#f1f5f9',
      sidebarBg: '#0f172a',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      inputBg: '#f8fafc'
    }
  },
  'grafite': {
    id: 'grafite',
    name: 'Grafite',
    description: 'Design minimalista neutro em tons de cinza carvão',
    dark: {
      bg: '#121214',
      sidebarBg: '#09090b',
      headerBg: 'rgba(18, 18, 20, 0.95)',
      cardBg: '#18181b',
      cardBorder: '#27272a',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      inputBg: '#141416'
    },
    light: {
      bg: '#f4f4f5',
      sidebarBg: '#18181b',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: '#ffffff',
      cardBorder: '#e4e4e7',
      textPrimary: '#18181b',
      textSecondary: '#71717a',
      inputBg: '#fafafa'
    }
  },
  'roxo': {
    id: 'roxo',
    name: 'Roxo',
    description: 'Atmosfera sofisticada em tons de violeta e ametista',
    dark: {
      bg: '#13091f',
      sidebarBg: '#0c0414',
      headerBg: 'rgba(19, 9, 31, 0.95)',
      cardBg: '#1e0f33',
      cardBorder: '#351a54',
      textPrimary: '#faf5ff',
      textSecondary: '#c084fc',
      inputBg: '#170b26'
    },
    light: {
      bg: '#faf5ff',
      sidebarBg: '#2e1065',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: '#ffffff',
      cardBorder: '#e9d5ff',
      textPrimary: '#3b0764',
      textSecondary: '#7e22ce',
      inputBg: '#fdf4ff'
    }
  },
  'verde-esmeralda': {
    id: 'verde-esmeralda',
    name: 'Verde-esmeralda',
    description: 'Equilíbrio e frescor botânico em verde profundo',
    dark: {
      bg: '#051813',
      sidebarBg: '#020e0b',
      headerBg: 'rgba(5, 24, 19, 0.95)',
      cardBg: '#0b2920',
      cardBorder: '#144636',
      textPrimary: '#ecfdf5',
      textSecondary: '#6ee7b7',
      inputBg: '#081f18'
    },
    light: {
      bg: '#f0fdf4',
      sidebarBg: '#064e3b',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: '#ffffff',
      cardBorder: '#bbf7d0',
      textPrimary: '#064e3b',
      textSecondary: '#059669',
      inputBg: '#f7fee7'
    }
  },
  'vinho': {
    id: 'vinho',
    name: 'Vinho',
    description: 'Identidade nobre em tons de bordô e cereja escura',
    dark: {
      bg: '#1a0a10',
      sidebarBg: '#100409',
      headerBg: 'rgba(26, 10, 16, 0.95)',
      cardBg: '#2a0e19',
      cardBorder: '#4a172c',
      textPrimary: '#fff1f2',
      textSecondary: '#fda4af',
      inputBg: '#210a13'
    },
    light: {
      bg: '#fff1f2',
      sidebarBg: '#4c0519',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: '#ffffff',
      cardBorder: '#fecdd3',
      textPrimary: '#881337',
      textSecondary: '#be123c',
      inputBg: '#fff5f5'
    }
  },
  'azul-moderno': {
    id: 'azul-moderno',
    name: 'Azul moderno',
    description: 'Interface contemporânea tecnológica em azul safira',
    dark: {
      bg: '#0a1628',
      sidebarBg: '#050c18',
      headerBg: 'rgba(10, 22, 40, 0.95)',
      cardBg: '#11223e',
      cardBorder: '#1e3a68',
      textPrimary: '#f0f9ff',
      textSecondary: '#7dd3fc',
      inputBg: '#0d1c33'
    },
    light: {
      bg: '#f0f9ff',
      sidebarBg: '#1e3a8a',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: '#ffffff',
      cardBorder: '#bae6fd',
      textPrimary: '#0c4a6e',
      textSecondary: '#0284c7',
      inputBg: '#f8fafc'
    }
  }
};

export const ADMIN_ACCENTS: Record<AdminAccentId, AccentDefinition> = {
  'dourado': {
    id: 'dourado',
    name: 'Dourado',
    colorHex: '#f59e0b',
    hoverHex: '#d97706',
    textOnAccent: '#0f172a',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    glowRgba: 'rgba(245, 158, 11, 0.3)'
  },
  'ciano': {
    id: 'ciano',
    name: 'Ciano',
    colorHex: '#06b6d4',
    hoverHex: '#0891b2',
    textOnAccent: '#0f172a',
    badgeBg: '#cffafe',
    badgeText: '#155e75',
    glowRgba: 'rgba(6, 182, 212, 0.3)'
  },
  'lilas': {
    id: 'lilas',
    name: 'Lilás',
    colorHex: '#a855f7',
    hoverHex: '#9333ea',
    textOnAccent: '#ffffff',
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
    glowRgba: 'rgba(168, 85, 247, 0.3)'
  },
  'verde': {
    id: 'verde',
    name: 'Verde',
    colorHex: '#10b981',
    hoverHex: '#059669',
    textOnAccent: '#ffffff',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
    glowRgba: 'rgba(16, 185, 129, 0.3)'
  },
  'rosa': {
    id: 'rosa',
    name: 'Rosa',
    colorHex: '#ec4899',
    hoverHex: '#db2777',
    textOnAccent: '#ffffff',
    badgeBg: '#fce7f3',
    badgeText: '#9d174d',
    glowRgba: 'rgba(236, 72, 153, 0.3)'
  },
  'laranja': {
    id: 'laranja',
    name: 'Laranja',
    colorHex: '#f97316',
    hoverHex: '#ea580c',
    textOnAccent: '#ffffff',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
    glowRgba: 'rgba(249, 115, 22, 0.3)'
  }
};

export const DEFAULT_ADMIN_THEME: AdminThemePreference = {
  themeId: 'azul-marinho',
  accentId: 'dourado',
  mode: 'dark'
};

const STORAGE_KEY = 'omnibrand_admin_appearance';

export const adminThemeService = {
  getPreference(): AdminThemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          ADMIN_THEMES[parsed.themeId as AdminThemeId] &&
          ADMIN_ACCENTS[parsed.accentId as AdminAccentId] &&
          (parsed.mode === 'dark' || parsed.mode === 'light')
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar tema do localStorage:', e);
    }
    return DEFAULT_ADMIN_THEME;
  },

  savePreference(pref: AdminThemePreference) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    } catch (e) {
      console.warn('Erro ao salvar tema no localStorage:', e);
    }
  },

  resetPreference(): AdminThemePreference {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    return DEFAULT_ADMIN_THEME;
  },

  getStyles(pref: AdminThemePreference): React.CSSProperties {
    const theme = ADMIN_THEMES[pref.themeId] || ADMIN_THEMES['azul-marinho'];
    const palette = pref.mode === 'dark' ? theme.dark : theme.light;
    const accent = ADMIN_ACCENTS[pref.accentId] || ADMIN_ACCENTS['dourado'];

    return {
      '--admin-bg': palette.bg,
      '--admin-sidebar-bg': palette.sidebarBg,
      '--admin-header-bg': palette.headerBg,
      '--admin-card-bg': palette.cardBg,
      '--admin-card-border': palette.cardBorder,
      '--admin-text-primary': palette.textPrimary,
      '--admin-text-secondary': palette.textSecondary,
      '--admin-input-bg': palette.inputBg,
      '--admin-accent': accent.colorHex,
      '--admin-accent-hover': accent.hoverHex,
      '--admin-accent-text': accent.textOnAccent,
      '--admin-accent-glow': accent.glowRgba,
      '--admin-accent-badge-bg': accent.badgeBg,
      '--admin-accent-badge-text': accent.badgeText,
      backgroundColor: palette.bg,
      color: palette.textPrimary
    } as React.CSSProperties;
  }
};
