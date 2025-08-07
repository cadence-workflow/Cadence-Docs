import React from 'react';
import GrafanaSetupPopup from '../components/GrafanaSetupPopup';

export default function Root({ children }) {
  console.log('🎯 Root component loaded - single popup system initialized');
  
  return (
    <>
      {children}
      <GrafanaSetupPopup />
    </>
  );
}