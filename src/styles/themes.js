// src/styles/themes.js

// 1. Import your logos from the assets folder
import stahlLogo from '../assets/stahl-logo.png'
import payseraLogo from '../assets/paysera-logo.png'
import launchpadLogo from '../assets/launchpad-logo.png'
import bestloanLogo from '../assets/bestloan-logo.png'

export const companyThemes = {
  'stahl-materials': {
    name: 'Stahl Materials Philippines, Inc',
    primary: '#D32F2F', 
    secondary: '#B71C1C',
    bgGradient: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', 
    sidebarColor: '#1a1a1a', 
    textColor: '#1a1a1a',
    logo: stahlLogo // <--- UPDATED: Use the imported image variable
  },
  'paysera': {
    name: 'Paysera',
    primary: '#2196F3', 
    secondary: '#0D47A1', 
    accent: '#4CAF50', 
    bgGradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    sidebarColor: '#1258c1',
    textColor: '#0D47A1',
    logo: payseraLogo // <--- UPDATED
  },
  'launchpad-coworking': {
    name: 'Launchpad Coworking',
    primary: '#C6FF00', 
    secondary: '#76FF03',
    bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', 
    sidebarColor: '#c8ff00dc', 
    textColor: '#C6FF00', 
    formDark: true, 
    logo: launchpadLogo // <--- UPDATED
  },
  'bestloan': {
    name: 'Bestloan Credit Corporation',
    primary: '#0033a0', 
    secondary: '#ffd700', 
    accent: '#d32f2f', 
    bgGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
    sidebarColor: '#2e56ad', 
    textColor: '#0033a0',
    logo: bestloanLogo // <--- UPDATED
  }
}

export const getTheme = (slug) => {
  return companyThemes[slug] || {
    name: 'Support System',
    primary: '#6366f1',
    secondary: '#4f46e5',
    bgGradient: 'linear-gradient(to right, #f8fafc, #e2e8f0)',
    sidebarColor: '#1e293b',
    textColor: '#1e293b',
    logo: null
  }
}