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
    
    if (dismissed) {
      return;
    }

    const now = new Date().getTime();
    
    if (!lastShown) {
      // First time - show popup immediately
      setIsVisible(true);
      setIsAnimating(true);
      localStorage.setItem(`popup_${featureId}_lastShown`, now.toString());
    } else {
      const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastShown < showDays) {
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
    <div 
      className={`${styles.popup} ${isAnimating ? styles.popupVisible : styles.popupHidden}`}
      onClick={handleNavigate}
    >
      <div className={styles.content}>
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
    </div>
  );
};

export default NewFeaturePopup;
