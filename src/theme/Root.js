import React from 'react';
import CommunityWidget from './CommunityWidget';

export default function Root({ children }) {
  return (
    <>
      {children}
      <CommunityWidget />
    </>
  );
}
