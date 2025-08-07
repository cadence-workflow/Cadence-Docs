import React from 'react';
import NewFeatureBanner from '../NewFeatureBanner';

const GrafanaBanner: React.FC = () => {
  return (
    <NewFeatureBanner
      featureId="grafana_helm_setup_2025_banner_v1"
      title="✨ Brand New: Grafana Helm Setup Guide"
      description=""
      linkUrl="/docs/concepts/grafana-helm-setup"
      linkText="🚀 Explore the Guide"
      showDays={365}
    />
  );
};

export default GrafanaBanner;
