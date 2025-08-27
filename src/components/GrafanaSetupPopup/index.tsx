import React from 'react';
import NewFeaturePopup from '../NewFeaturePopup';

const GrafanaSetupPopup: React.FC = () => {
  const [shouldRender, setShouldRender] = React.useState(false);

  // Prevent multiple instances and add debug logging
  React.useEffect(() => {
    // Check if popup is already being rendered
    const existingPopup = document.querySelector('[data-popup-id="workflow_queries_formatted_data_2025"]');
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
    <div data-popup-id="workflow_queries_formatted_data_2025">
      <NewFeaturePopup
        featureId="workflow_queries_formatted_data_2025"
        title="🎨 Workflow Queries with Formatted Data "
        description="Transform your workflow queries with rich formatting! Return Markdown directly in Cadence Web UI. Create interactive status reports, data tables for better workflow monitoring."
        linkUrl="/docs/concepts/workflow-queries-formatted-data"
        linkText="📖 Learn More"
        showDays={365}
      />
    </div>
  );
};

export default GrafanaSetupPopup;