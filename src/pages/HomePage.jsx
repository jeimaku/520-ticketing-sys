import React, { useState, useEffect } from 'react';
import { companyThemes } from '../styles/themes'; 
import './../styles/HomePage.css'; 

const HomePage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const companies = [
    {
      slug: 'stahl-materials',
      theme: companyThemes['stahl-materials'],
      icon: '🏭', // You can replace these with SVG icons later
      description: 'Industrial solutions and materials'
    },
    {
      slug: 'paysera',
      theme: companyThemes['paysera'],
      icon: '💳',
      description: 'Digital payment solutions'
    },
    {
      slug: 'launchpad-coworking',
      theme: companyThemes['launchpad-coworking'],
      icon: '🚀',
      description: 'Creative workspace and collaboration'
    }
  ];

  return (
    <div className="landing-container">
      <div className="hero-background">
        <div className="content-wrapper">
          {/* Header with Logo Area */}
          <header className={`hero-header ${isLoaded ? 'fade-in-up' : ''}`}>
            <div className="logo-container">
               {/* Placeholder Logo constructed with CSS to match brand */}
               <div className="logo-placeholder">
                  {/* <img src="/logo.png" alt="520 Logo" />  <-- Uncomment this when you add the image */}
                  
                  {/* Text based logo fallback */}
                  <span className="logo-text-main">FIVE TWENTY</span>
                  <span className="logo-text-sub">IT SERVICES</span>
               </div>
            </div>
            
            <p className="hero-subtitle">
              Professional IT Support & Ticket Management System
            </p>

            <p className="quote-text">
              "Ephesians 5:20 - Always giving thanks to God the Father for everything, in the name of our Lord Jesus Christ"
            </p>
          </header>

          {/* Service/Company Portals */}
          <main className={`portals-section ${isLoaded ? 'fade-in-up delay-1' : ''}`}>
            <h2 className="section-title">Select Your Organization</h2>
            
            <div className="company-grid">
              {companies.map((company, index) => (
                <div
                  key={company.slug}
                  className={`fade-in-up delay-${index + 1}`}
                >
                  <a href={`/company/${company.slug}`} className="company-card-link">
                    <div className="company-card">
                      <div className="card-icon">
                        {company.icon}
                      </div>
                      
                      <h3 className="card-title">
                        {company.theme.name}
                      </h3>
                      
                      <p className="card-desc">
                        {company.description}
                      </p>
                      
                      <div className="card-btn">
                        <span>Access Portal</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>

            {/* Subtle Admin Link */}
            <div className="admin-section">
              <a href="/admin" className="admin-link">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Authorized Personnel Only</span>
              </a>
            </div>
          </main>
        </div>
      </div>

      <footer className="main-footer">
        <p>&copy; 2026 FiveTwenty IT Services. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default HomePage;