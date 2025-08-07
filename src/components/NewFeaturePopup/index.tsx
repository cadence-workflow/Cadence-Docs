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
      // First time - show popup with delay for better UX
      console.log('🎯 First time, showing popup');
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }, 2000); // 2 second delay
      localStorage.setItem(`popup_${featureId}_lastShown`, now.toString());
    } else {
      const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      console.log('📅 Days since last shown:', daysSinceLastShown);
      if (daysSinceLastShown < showDays) {
        console.log('✨ Within show period, showing popup');
        setTimeout(() => {
          setIsVisible(true);
          setTimeout(() => setIsAnimating(true), 100);
        }, 2000);
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
    <>
      <div 
        className={`${styles.overlay} ${isAnimating ? styles.overlayVisible : styles.overlayHidden}`} 
        onClick={handleClose} 
      />
      <div className={`${styles.popup} ${isAnimating ? styles.popupVisible : styles.popupHidden}`}>
        {/* Decorative elements */}
        <div className={styles.decorativeTop}></div>
        <div className={styles.floatingOrbs}>
          <div className={styles.orb1}></div>
          <div className={styles.orb2}></div>
          <div className={styles.orb3}></div>
        </div>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <div className={styles.sparkles}>✨</div>
            <div className={styles.iconGlow}></div>
          </div>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close popup">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M9 7.5l3.5-3.5a1 1 0 111.414 1.414L10.414 9l3.5 3.5a1 1 0 11-1.414 1.414L9 10.414l-3.5 3.5a1 1 0 11-1.414-1.414L7.586 9 4.086 5.5A1 1 0 115.5 4.086L9 7.5z"/>
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {/* Premium badge */}
          <div className={styles.badge}>
            <div className={styles.badgeInner}>
              <span className={styles.badgeText}>NEW FEATURE</span>
              <div className={styles.badgeShine}></div>
            </div>
            <div className={styles.badgePulse}></div>
          </div>
          
          {/* Title */}
          <h3 className={styles.title}>{title}</h3>
          
          {/* Description */}
          <p className={styles.description}>{description}</p>
          
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
          
          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={handleNavigate}>
              <span className={styles.buttonText}>{linkText}</span>
              <div className={styles.buttonShine}></div>
              <svg className={styles.buttonIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
              </svg>
            </button>
            <button className={styles.secondaryButton} onClick={handleDismiss}>
              <span>Maybe later</span>
            </button>
          </div>
        </div>
        
        {/* Bottom gradient border */}
        <div className={styles.gradientBorder}></div>
      </div>
    </>
  );
};

export default NewFeaturePopup;