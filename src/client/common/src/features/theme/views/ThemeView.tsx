import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from '@phosphor-icons/react';

// ============================================================================
// Workspace Theme View
// ============================================================================

interface ThemeColorSwatch {
  name: string;
  displayName: string;
  category: string;
  baseClass: string;
  cssVariable: string;
  textClass?: string;
}

interface ColorSwatchProps {
  name: string;
  colors: ThemeColorSwatch[];
  category: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, colors, category }) => {
  void category; // Unused
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
        {name}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {colors.map((color) => (
          <div key={color.name} className="space-y-2">
            <div className={`h-16 ${color.baseClass} dark:${color.baseClass} rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center`}>
              {color.textClass && <div className={`${color.textClass} dark:${color.textClass}`}>Sample</div>}
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {color.displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                {color.baseClass}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-600 font-mono">
                {color.cssVariable}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange }) => {
  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onThemeChange(value)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            theme === value
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Icon size={16} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
};

// Theme management utilities
const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  // Remove existing theme classes
  document.documentElement.classList.remove('light', 'dark');

  // Add the resolved theme class
  document.documentElement.classList.add(resolvedTheme);

  // Set data-theme attribute for CSS custom properties (future use)
  document.documentElement.setAttribute('data-theme', resolvedTheme);
};

const getStoredTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
};

const setStoredTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
};

const WorkspaceThemeView: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getSystemTheme());

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(currentTheme);
    setResolvedTheme(currentTheme === 'system' ? getSystemTheme() : currentTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (currentTheme === 'system') {
        const newResolvedTheme = getSystemTheme();
        setResolvedTheme(newResolvedTheme);
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  // Theme colors using CSS custom properties and Tailwind classes
  const themeColors = {
    theme: [
      { name: 'primary', displayName: 'Primary', category: 'theme', baseClass: 'bg-primary', cssVariable: '--color-primary', textClass: 'text-on-primary' },
      { name: 'secondary', displayName: 'Secondary', category: 'theme', baseClass: 'bg-secondary', cssVariable: '--color-secondary', textClass: 'text-on-secondary' },
      { name: 'accent', displayName: 'Accent', category: 'theme', baseClass: 'bg-accent', cssVariable: '--color-accent', textClass: 'text-on-accent' },
      { name: 'neutral', displayName: 'Neutral', category: 'theme', baseClass: 'bg-neutral', cssVariable: '--color-neutral', textClass: 'text-on-neutral' },
      { name: 'surface', displayName: 'Surface', category: 'theme', baseClass: 'bg-surface', cssVariable: '--color-neutral', textClass: 'text-on-surface' },
    ],
    surface: [
      { name: 'surface', displayName: 'Surface', category: 'surface', baseClass: 'bg-surface', cssVariable: '--color-surface', textClass: 'text-on-surface' },
      { name: 'panel', displayName: 'Panel', category: 'surface', baseClass: 'bg-panel', cssVariable: '--color-panel', textClass: 'text-on-panel' },
      { name: 'header', displayName: 'Header', category: 'surface', baseClass: 'bg-header', cssVariable: '--color-header', textClass: 'text-on-header' },
    ],
    primary: [
      { name: 'primary-50', displayName: 'Primary 50', category: 'primary', baseClass: 'bg-blue-50', cssVariable: '--color-primary-50' },
      { name: 'primary-100', displayName: 'Primary 100', category: 'primary', baseClass: 'bg-blue-100', cssVariable: '--color-primary-100' },
      { name: 'primary-500', displayName: 'Primary 500', category: 'primary', baseClass: 'bg-blue-500', cssVariable: '--color-primary-500' },
      { name: 'primary-600', displayName: 'Primary 600', category: 'primary', baseClass: 'bg-blue-600', cssVariable: '--color-primary-600' },
      { name: 'primary-900', displayName: 'Primary 900', category: 'primary', baseClass: 'bg-blue-900', cssVariable: '--color-primary-900' },
    ],
    gray: [
      { name: 'gray-50', displayName: 'Gray 50', category: 'gray', baseClass: 'bg-gray-50', cssVariable: '--color-gray-50' },
      { name: 'gray-100', displayName: 'Gray 100', category: 'gray', baseClass: 'bg-gray-100', cssVariable: '--color-gray-100' },
      { name: 'gray-200', displayName: 'Gray 200', category: 'gray', baseClass: 'bg-gray-200', cssVariable: '--color-gray-200' },
      { name: 'gray-300', displayName: 'Gray 300', category: 'gray', baseClass: 'bg-gray-300', cssVariable: '--color-gray-300' },
      { name: 'gray-400', displayName: 'Gray 400', category: 'gray', baseClass: 'bg-gray-400', cssVariable: '--color-gray-400' },
      { name: 'gray-500', displayName: 'Gray 500', category: 'gray', baseClass: 'bg-gray-500', cssVariable: '--color-gray-500' },
      { name: 'gray-600', displayName: 'Gray 600', category: 'gray', baseClass: 'bg-gray-600', cssVariable: '--color-gray-600' },
      { name: 'gray-700', displayName: 'Gray 700', category: 'gray', baseClass: 'bg-gray-700', cssVariable: '--color-gray-700' },
      { name: 'gray-800', displayName: 'Gray 800', category: 'gray', baseClass: 'bg-gray-800', cssVariable: '--color-gray-800' },
      { name: 'gray-900', displayName: 'Gray 900', category: 'gray', baseClass: 'bg-gray-900', cssVariable: '--color-gray-900' },
    ],
    text: [
      { name: 'text-primary', displayName: 'Text Primary', category: 'text', baseClass: 'bg-gray-900', cssVariable: '--color-text-primary' },
      { name: 'text-secondary', displayName: 'Text Secondary', category: 'text', baseClass: 'bg-gray-600', cssVariable: '--color-text-secondary' },
      { name: 'text-tertiary', displayName: 'Text Tertiary', category: 'text', baseClass: 'bg-gray-400', cssVariable: '--color-text-tertiary' },
      { name: 'text-inverse', displayName: 'Text Inverse', category: 'text', baseClass: 'bg-white', cssVariable: '--color-text-inverse' },
    ],
    semantic: [
      { name: 'success', displayName: 'Success', category: 'semantic', baseClass: 'bg-success', cssVariable: '--color-success', textClass: 'text-on-success' },
      { name: 'warning', displayName: 'Warning', category: 'semantic', baseClass: 'bg-warning', cssVariable: '--color-warning', textClass: 'text-on-warning' },
      { name: 'error', displayName: 'Error', category: 'semantic', baseClass: 'bg-error', cssVariable: '--color-error', textClass: 'text-on-error' },
      { name: 'info', displayName: 'Info', category: 'semantic', baseClass: 'bg-info', cssVariable: '--color-info', textClass: 'text-on-info' },
    ],
  };

  const getSemanticSwatch = (name: string) => themeColors.semantic.find((s) => s.name === name);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(theme);
    setResolvedTheme(theme === 'system' ? getSystemTheme() : theme);
    applyTheme(theme);
    setStoredTheme(theme);
  };

  /* <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200"> */
  return (
    <div className="min-h-screen transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                Theme System
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Design tokens, color swatches, and theme switching for the Basalt workspace
              </p>
            </div>
            <ThemeToggle theme={currentTheme} onThemeChange={handleThemeChange} />
          </div>
        </div>

        {/* Theme Status */}
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Current Theme Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Selected Theme
              </div>
              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
              </div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                System Preference
              </div>
              <div className="text-lg font-semibold text-green-900 dark:text-green-100">
                {getSystemTheme().charAt(0).toUpperCase() + getSystemTheme().slice(1)}
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Resolved Theme
              </div>
              <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                {resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Color Palette
          </h2>

          <div className="space-y-8">
            <ColorSwatch
              name="Theme Colors"
              colors={themeColors.theme}
              category="theme"
            />

            <ColorSwatch
              name="Surface Colors"
              colors={themeColors.surface}
              category="surface"
            />

            <ColorSwatch
              name="Primary Colors"
              colors={themeColors.primary}
              category="primary"
            />

            <ColorSwatch
              name="Gray Scale"
              colors={themeColors.gray}
              category="gray"
            />

            <ColorSwatch
              name="Text Colors"
              colors={themeColors.text}
              category="text"
            />

            <ColorSwatch
              name="Semantic Colors"
              colors={themeColors.semantic}
              category="semantic"
            />
          </div>
        </div>

        {/* Component Examples */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Component Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buttons */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Buttons
              </h3>
              <div className="space-y-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  Primary Button
                </button>
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Secondary Button
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Outline Button
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Cards
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Card Title
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    This is a sample card with some content to demonstrate theming.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Info Card
                  </h4>
                  <p className="text-blue-700 dark:text-blue-200 text-sm">
                    This card uses semantic colors for different states.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Elements */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Form Elements
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select an option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>

            {/* Alerts */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Alerts
              </h3>
              <div className="space-y-3">
                {/*
                REVIEW: We don't currently have a way to define border-
                classes, or colors for them.
                */}
                <div className={`p-3 ${getSemanticSwatch('success')?.baseClass} border border-${getSemanticSwatch('success')?.name} rounded-md`}>
                  <p className={`${getSemanticSwatch('success')?.textClass} text-sm`}>
                    Success alert with semantic colors.
                  </p>
                </div>
                <div className={`p-3 ${getSemanticSwatch('warning')?.baseClass} rounded-md`}>
                  <p className={`${getSemanticSwatch('warning')?.textClass} text-sm`}>
                    Warning alert with semantic colors.
                  </p>
                </div>
                <div className={`p-3 ${getSemanticSwatch('error')?.baseClass} rounded-md`}>
                  <p className={`${getSemanticSwatch('error')?.textClass} text-sm`}>
                    Error alert with semantic colors.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2: Workspace Component Patterns */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Layer 2: Workspace Component Patterns
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Reusable CSS classes for workspace-specific components using our Layer 2 structural colors.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel Container */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Panel Container
              </h3>
              <div className="panel-container">
                <div className="panel-header">
                  Panel Header
                </div>
                <div className="panel-content">
                  <p className="text-sm mb-3">This panel uses Layer 2 patterns:</p>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• <code>.panel-container</code> - Background and border</li>
                    <li>• <code>.panel-header</code> - Header styling</li>
                    <li>• <code>.panel-content</code> - Content area</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card Container */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Card Container
              </h3>
              <div className="card-container">
                <h4 className="font-medium mb-2">Card Title</h4>
                <p className="text-sm mb-3">This card uses Layer 2 patterns:</p>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <code>.card-container</code> - Background and border</li>
                  <li>• <code>.text-primary</code> - Primary text color</li>
                  <li>• <code>.text-secondary</code> - Secondary text color</li>
                </ul>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Layer 2 Buttons
              </h3>
              <div className="space-y-3">
                <button className="button-primary">
                  Primary Button
                </button>
                <button className="button-secondary">
                  Secondary Button
                </button>
                <button className="button-surface">
                  Surface Button
                </button>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  <p>Uses Layer 1 semantic colors with Layer 2 styling</p>
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Input Field
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="input-field w-full"
                />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p>Uses <code>.input-field</code> with Layer 2 border and focus states</p>
                </div>
              </div>
            </div>

            {/* File Tree Item */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                File Tree Item
              </h3>
              <div className="space-y-2">
                <div className="file-tree-item">
                  📁 Documents
                </div>
                <div className="file-tree-item">
                  📄 document.txt
                </div>
                <div className="file-tree-item selected">
                  ⭐ selected-file.js
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  <p>Hover and selection states with Layer 2 patterns</p>
                </div>
              </div>
            </div>

            {/* Header Bar Buttons */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Header Bar Buttons
              </h3>
              <div className="flex space-x-2">
                <button className="header-button">
                  ⚙️
                </button>
                <button className="header-button">
                  🔔
                </button>
                <button className="header-button">
                  👤
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <p>Icon buttons with hover and focus states</p>
              </div>
            </div>

            {/* Text Hierarchy */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Text Hierarchy
              </h3>
              <div className="space-y-2">
                <div className="text-primary">Primary text color</div>
                <div className="text-secondary">Secondary text color</div>
                <div className="text-tertiary">Tertiary text color</div>
                <div className="text-muted">Muted text color</div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <p>Layer 2 text color classes</p>
              </div>
            </div>

            {/* Border Examples */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Border Examples
              </h3>
              <div className="space-y-3">
                <div className="p-3 border border-standard rounded">
                  Standard border
                </div>
                <div className="p-3 border border-light rounded">
                  Light border
                </div>
                <div className="p-3 border border-emphasis rounded">
                  Emphasis border
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <p>Layer 2 border color classes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spacing and Typography */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Spacing & Typography
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spacing Scale */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Spacing Scale
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="w-1 h-1 bg-gray-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">xs (0.25rem)</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-gray-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">sm (0.5rem)</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-gray-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">md (1rem)</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-gray-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">lg (1.5rem)</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">xl (2rem)</span>
                </div>
              </div>
            </div>

            {/* Typography Scale */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Typography Scale
              </h3>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Heading 1</h1>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Heading 2</h2>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">Heading 3</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">Body text</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Small text</p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Notes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Development Notes
          </h2>

          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
              Next Steps for Theme Implementation
            </h3>
            <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
              <li>• Create CSS custom properties for all design tokens</li>
              <li>• Implement @theme block in Tailwind v4 configuration</li>
              <li>• Add theme toggle to workspace header</li>
              <li>• Migrate workspace components to use theme tokens</li>
              <li>• Create theme builder for user customization</li>
              <li>• Add theme persistence and import/export functionality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceThemeView;
