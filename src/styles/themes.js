// src/styles/themes.js

export const companyThemes = {
  'stahl-materials': {
    name: 'Stahl Materials Philippines, Inc',
    // Red from the logo gradient
    primary: '#D32F2F', 
    secondary: '#B71C1C',
    // Industrial grey/white background
    bgGradient: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', 
    sidebarColor: '#1a1a1a', // Dark side panel like the black border in logo
    textColor: '#1a1a1a',
    logo: '🏭' 
  },
  'paysera': {
    name: 'Paysera',
    // The specific blue from the P logo
    primary: '#2196F3', 
    // The dark blue from the bottom of the P
    secondary: '#0D47A1', 
    // The green accent from the P stem
    accent: '#4CAF50', 
    bgGradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    sidebarColor: '#0D47A1',
    textColor: '#0D47A1',
    logo: '💳'
  },
  'launchpad-coworking': {
    name: 'Launchpad Coworking',
    // The lime green background from the logo
    primary: '#C6FF00', 
    secondary: '#76FF03',
    // Black contrast from the logo text
    bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', 
    sidebarColor: '#C6FF00', // Lime sidebar
    textColor: '#C6FF00', // Lime text on dark background
    formDark: true, // Special flag for dark mode form
    logo: '🚀'
  },
  'bestloan': {
    name: 'Bestloan Credit Corporation',
    // Royal Blue from the outer ring
    primary: '#0033a0', 
    // Gold/Yellow from the center badge
    secondary: '#ffd700', 
    // Red from the ribbon elements
    accent: '#d32f2f', 
    // A professional blue-to-white gradient
    bgGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
    sidebarColor: '#0033a0', 
    textColor: '#0033a0',
    logo: '💰' // Or use '🏦'
  }
}

export const getTheme = (slug) => {
  return companyThemes[slug] || {
    name: 'Support System',
    primary: '#6366f1',
    secondary: '#4f46e5',
    bgGradient: 'linear-gradient(to right, #f8fafc, #e2e8f0)',
    sidebarColor: '#1e293b',
    textColor: '#1e293b'
  }
}