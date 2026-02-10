import { supabase } from '../lib/supabase'

class CompanyAccessManager {
  constructor() {
    this.companyMappings = new Map()
    this.lastFetch = 0
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  async getCompanySlugById(companyId) {
    // Check cache first
    if (this.companyMappings.has(companyId) && 
        Date.now() - this.lastFetch < this.cacheTimeout) {
      return this.companyMappings.get(companyId)
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, slug')
        .eq('id', companyId)
        .single()

      if (error) throw error

      this.companyMappings.set(companyId, data.slug)
      this.lastFetch = Date.now()
      
      return data.slug
    } catch (error) {
      console.error('Error fetching company slug:', error)
      return null
    }
  }

  async getAllCompanyMappings() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, slug')

      if (error) throw error

      // Update cache
      data.forEach(company => {
        this.companyMappings.set(company.id, company.slug)
      })
      this.lastFetch = Date.now()

      return data
    } catch (error) {
      console.error('Error fetching company mappings:', error)
      return []
    }
  }

  getActiveCompanySession() {
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('company_access_') && 
      sessionStorage.getItem(key) === 'granted'
    )

    if (sessionKeys.length > 0) {
      return sessionKeys[0].replace('company_access_', '')
    }

    return null
  }

  async getActiveCompanySlug() {
    const companyId = this.getActiveCompanySession()
    if (!companyId) return null

    return await this.getCompanySlugById(companyId)
  }

  clearCompanyAccess(companyId) {
    sessionStorage.removeItem(`company_access_${companyId}`)
    this.companyMappings.delete(companyId)
  }

  clearAllCompanyAccess() {
    // Clear all company sessions
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('company_access_')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Clear cache
    this.companyMappings.clear()
  }

  isAdminAuthenticated() {
    const adminSession = localStorage.getItem('adminSession')
    if (!adminSession) return false

    try {
      const session = JSON.parse(adminSession)
      // Check if session is not expired (optional)
      const loginTime = new Date(session.loginTime)
      const now = new Date()
      const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
      
      // Session expires after 8 hours
      return hoursDiff < 8
    } catch (error) {
      return false
    }
  }

  getAccessType() {
    if (this.isAdminAuthenticated()) return 'admin'
    if (this.getActiveCompanySession()) return 'company'
    return 'none'
  }
}

// Create singleton instance
export const companyAccessManager = new CompanyAccessManager()

// Helper functions for components
export const checkHomepageAccess = async () => {
  const accessType = companyAccessManager.getAccessType()
  
  switch (accessType) {
    case 'admin':
      return { allowed: true, type: 'admin' }
      
    case 'company':
      const slug = await companyAccessManager.getActiveCompanySlug()
      if (slug) {
        return { allowed: false, type: 'company', redirectTo: `/company/${slug}` }
      }
      break
      
    case 'none':
    default:
      // Check if coming from legitimate referrer
      if (document.referrer.includes('/company/') || 
          document.referrer.includes('/admin')) {
        return { allowed: true, type: 'referrer' }
      }
      
      // Check for admin access parameter
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('admin_access') === 'fivetwenty_admin_2024') {
        return { allowed: true, type: 'param' }
      }
      
      return { allowed: false, type: 'denied' }
  }
  
  return { allowed: false, type: 'denied' }
}