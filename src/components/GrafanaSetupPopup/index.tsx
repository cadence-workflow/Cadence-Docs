import React from 'react';
import NewFeaturePopup from '../NewFeaturePopup';

const GrafanaSetupPopup: React.FC = () => {
  const [shouldRender, setShouldRender] = React.useState(false);

  // Prevent multiple instances and add debug logging
  React.useEffect(() => {
    // Check if popup is already being rendered
    const existingPopup = document.querySelector('[data-popup-id="grafana_helm_setup_2025_ultra_v2"]');
    if (!existingPopup) {
      console.log('🚀 GrafanaSetupPopup component mounted - rendering popup');
      setShouldRender(true);
    } else {
      console.log('⚠️ Popup already exists, skipping render');
    }
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <div data-popup-id="grafana_helm_setup_2025_ultra_v2">
      <NewFeaturePopup
        featureId="grafana_helm_setup_2025_ultra_v2"
        title="✨ Brand New: Grafana Helm Setup Guide"
        description=""
        linkUrl="/docs/concepts/grafana-helm-setup"
        linkText="📖 View Guide"
        showDays={365}
      />
    </div>
  );
};

export default GrafanaSetupPopup;