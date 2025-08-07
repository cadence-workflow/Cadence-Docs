import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import styles from './styles.module.css';

interface NewFeaturePopupProps {
  featureId: string;
  title: string;
  description: string;
  linkUrl: string;
  linkText: string;
  showDays?: number;
}

const NewFeaturePopup: React.FC<NewFeaturePopupProps> = ({
  featureId,
  title,
  description,
  linkUrl,
  linkText,
  showDays = 7,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const history = useHistory();

  useEffect(() => {
    // Check if popup should be shown
    const lastShown = localStorage.getItem(`popup_${featureId}_lastShown`);
    const dismissed = localStorage.getItem(`popup_${featureId}_dismissed`);
    
    console.log('🚀 Popup check:', { featureId, lastShown, dismissed, showDays });
    
    if (dismissed) {
      console.log('✅ Popup dismissed, not showing');
      return;
    }

    const now = new Date().getTime();
    
    if (!lastShown) {
      // First time - show popup immediately
      console.log('🎯 First time, showing popup immediately');
      setIsVisible(true);
      setIsAnimating(true);
      localStorage.setItem(`popup_${featureId}_lastShown`, now.toString());
    } else {
      const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      console.log('📅 Days since last shown:', daysSinceLastShown);
      if (daysSinceLastShown < showDays) {
        console.log('✨ Within show period, showing popup immediately');
        setIsVisible(true);
        setIsAnimating(true);
      } else {
        console.log('⏰ Outside show period, not showing popup');
      }
    }
  }, [featureId, showDays]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 400);
  };

  const handleDismiss = () => {
    localStorage.setItem(`popup_${featureId}_dismissed`, 'true');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 400);
  };

  const handleNavigate = () => {
    history.push(linkUrl);
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 400);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`${styles.popup} ${isAnimating ? styles.popupVisible : styles.popupHidden}`}>
      {/* Close button */}
      <button className={styles.closeButton} onClick={handleDismiss} aria-label="Close popup">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M9 7.5l3.5-3.5a1 1 0 111.414 1.414L10.414 9l3.5 3.5a1 1 0 11-1.414 1.414L9 10.414l-3.5 3.5a1 1 0 11-1.414-1.414L7.586 9 4.086 5.5A1 1 0 115.5 4.086L9 7.5z"/>
        </svg>
      </button>

      <div className={styles.content} onClick={handleNavigate}>
        {/* Badge */}
        <div className={styles.badge}>
          <div className={styles.badgeInner}>
            <span className={styles.badgeText}>NEW FEATURE</span>
          </div>
        </div>
        
        {/* Title only */}
        <h3 className={styles.title}>{title}</h3>
        
        {/* Click indicator */}
        <div className={styles.clickIndicator}>
          <span className={styles.clickText}>Click to explore →</span>
        </div>
      </div>

      {/* Maybe later button */}
      <button className={styles.secondaryButton} onClick={handleDismiss}>
        <span>Maybe later</span>
      </button>
    </div>
  );
};

export default NewFeaturePopup;