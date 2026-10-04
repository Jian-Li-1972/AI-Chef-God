import { Settings } from "../types";

// Expanded theme properties
type ThemeProperties = {
  bgBody: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  textHeader: string;
  border: string;
  input: string;
  borderFocus: string;
  buttonPrimary: string;
  icon: string;
  ring: string;
};

// Theme structure with light and dark modes
type Theme = {
  light: ThemeProperties;
  dark: ThemeProperties;
};

type ThemeMap = {
  [key in Settings['themeColor']]: Theme;
};

const themes: ThemeMap = {
  green: {
    light: {
      bgBody: 'bg-green-50/50',
      bgCard: 'bg-white',
      textPrimary: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textHeader: 'text-green-900',
      border: 'border-gray-200',
      input: 'bg-gray-50 text-gray-900 placeholder-gray-400',
      borderFocus: 'focus:border-green-500 focus:ring-green-500',
      buttonPrimary: 'bg-green-600 hover:bg-green-700',
      icon: 'text-green-600',
      ring: 'ring-green-500',
    },
    dark: {
      bgBody: 'bg-gray-900',
      bgCard: 'bg-gray-800',
      textPrimary: 'text-gray-200',
      textSecondary: 'text-gray-400',
      textHeader: 'text-green-300',
      border: 'border-gray-700',
      input: 'bg-gray-700 text-gray-200 placeholder-gray-500',
      borderFocus: 'focus:border-green-400 focus:ring-green-400',
      buttonPrimary: 'bg-green-600 hover:bg-green-700',
      icon: 'text-green-400',
      ring: 'ring-green-400',
    }
  },
  blue: {
    light: {
      bgBody: 'bg-blue-50/50',
      bgCard: 'bg-white',
      textPrimary: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textHeader: 'text-blue-900',
      border: 'border-gray-200',
      input: 'bg-gray-50 text-gray-900 placeholder-gray-400',
      borderFocus: 'focus:border-blue-500 focus:ring-blue-500',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-600',
      ring: 'ring-blue-500',
    },
    dark: {
      bgBody: 'bg-gray-900',
      bgCard: 'bg-gray-800',
      textPrimary: 'text-gray-200',
      textSecondary: 'text-gray-400',
      textHeader: 'text-blue-300',
      border: 'border-gray-700',
      input: 'bg-gray-700 text-gray-200 placeholder-gray-500',
      borderFocus: 'focus:border-blue-400 focus:ring-blue-400',
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-400',
      ring: 'ring-blue-400',
    }
  },
  indigo: {
    light: {
      bgBody: 'bg-indigo-50/50',
      bgCard: 'bg-white',
      textPrimary: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textHeader: 'text-indigo-900',
      border: 'border-gray-200',
      input: 'bg-gray-50 text-gray-900 placeholder-gray-400',
      borderFocus: 'focus:border-indigo-500 focus:ring-indigo-500',
      buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
      icon: 'text-indigo-600',
      ring: 'ring-indigo-500',
    },
    dark: {
      bgBody: 'bg-gray-900',
      bgCard: 'bg-gray-800',
      textPrimary: 'text-gray-200',
      textSecondary: 'text-gray-400',
      textHeader: 'text-indigo-300',
      border: 'border-gray-700',
      input: 'bg-gray-700 text-gray-200 placeholder-gray-500',
      borderFocus: 'focus:border-indigo-400 focus:ring-indigo-400',
      buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
      icon: 'text-indigo-400',
      ring: 'ring-indigo-400',
    }
  },
  teal: {
    light: {
      bgBody: 'bg-teal-50/50',
      bgCard: 'bg-white',
      textPrimary: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textHeader: 'text-teal-900',
      border: 'border-gray-200',
      input: 'bg-gray-50 text-gray-900 placeholder-gray-400',
      borderFocus: 'focus:border-teal-500 focus:ring-teal-500',
      buttonPrimary: 'bg-teal-600 hover:bg-teal-700',
      icon: 'text-teal-600',
      ring: 'ring-teal-500',
    },
    dark: {
      bgBody: 'bg-gray-900',
      bgCard: 'bg-gray-800',
      textPrimary: 'text-gray-200',
      textSecondary: 'text-gray-400',
      textHeader: 'text-teal-300',
      border: 'border-gray-700',
      input: 'bg-gray-700 text-gray-200 placeholder-gray-500',
      borderFocus: 'focus:border-teal-400 focus:ring-teal-400',
      buttonPrimary: 'bg-teal-600 hover:bg-teal-700',
      icon: 'text-teal-400',
      ring: 'ring-teal-400',
    }
  },
};

export function getThemeClasses(themeColor: Settings['themeColor'], themeMode: Settings['themeMode']): ThemeProperties {
  const theme = themes[themeColor] || themes.green;
  return theme[themeMode] || theme.light;
}