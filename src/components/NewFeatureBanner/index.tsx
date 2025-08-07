import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import styles from './styles.module.css';

interface NewFeatureBannerProps {
  featureId: string;
  title: string;
  description: string;
  linkUrl: string;
  linkText: string;
  showDays?: number;
}

const NewFeatureBanner: React.FC<NewFeatureBannerProps> = ({
  featureId,
  title,
  description,
  linkUrl,
  linkText,
  showDays = 7,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const history = useHistory();

  useEffect(() => {
    // Check if banner should be shown
    const lastShown = localStorage.getItem(`banner_${featureId}_lastShown`);
    const dismissed = localStorage.getItem(`banner_${featureId}_dismissed`);
    
    console.log('🚀 Banner check:', { featureId, lastShown, dismissed, showDays });
    
    if (dismissed) {
      console.log('✅ Banner dismissed, not showing');
      return;
    }

    const now = new Date().getTime();
    
    if (!lastShown) {
      // First time - show banner immediately
      console.log('🎯 First time, showing banner immediately');
      setIsVisible(true);
      localStorage.setItem(`banner_${featureId}_lastShown`, now.toString());
    } else {
      const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      console.log('📅 Days since last shown:', daysSinceLastShown);
      if (daysSinceLastShown < showDays) {
        console.log('✨ Within show period, showing banner immediately');
        setIsVisible(true);
      } else {
        console.log('⏰ Outside show period, not showing banner');
      }
    }
  }, [featureId, showDays]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dismiss both banner and popup
    localStorage.setItem(`banner_${featureId}_dismissed`, 'true');
    localStorage.setItem(`popup_grafana_helm_setup_2025_ultra_v2_dismissed`, 'true');
    setIsVisible(false);
  };

  const handleNavigate = () => {
    history.push(linkUrl);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.banner} onClick={handleNavigate}>
      <div className={styles.content}>
        {/* NEW FEATURE Badge */}
        <div className={styles.badge}>
          <div className={styles.badgeInner}>
            <span className={styles.badgeText}>NEW FEATURE</span>
          </div>
        </div>
        
        {/* Title */}
        <h3 className={styles.title}>{title}</h3>
        
        {/* Description (only show if not empty) */}
        {description && <p className={styles.description}>{description}</p>}
        
        {/* Feature highlights */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <span>Quick Setup</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📊</div>
            <span>Pre-built Dashboards</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🔄</div>
            <span>Auto ServiceMonitor</span>
          </div>
        </div>
        
        {/* Click indicator */}
        <div className={styles.clickIndicator}>
          <span className={styles.clickText}>Click to explore →</span>
        </div>
      </div>

      {/* Close button */}
      <button className={styles.closeButton} onClick={handleDismiss} aria-label="Close banner">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 6.5l3.5-3.5a1 1 0 111.414 1.414L9.414 8l3.5 3.5a1 1 0 11-1.414 1.414L8 9.414l-3.5 3.5a1 1 0 11-1.414-1.414L6.586 8 3.086 4.5A1 1 0 114.5 3.086L8 6.5z"/>
        </svg>
      </button>
      
      {/* Maybe later button */}
      <button className={styles.maybeButton} onClick={handleDismiss}>
        Maybe later
      </button>
    </div>
  );
};

export default NewFeatureBanner;
