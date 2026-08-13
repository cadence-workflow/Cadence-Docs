import React from 'react';
import V1 from './v1';
import V2 from './v2';
import V3 from './v3';

export default function BannerDemo(): JSX.Element {
  return (
    <div style={{ padding: '2rem 0', background: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '3rem', textAlign: 'center' }}>
          Get Involved Banner Designs
        </h2>

        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem', color: '#666' }}>
            Version 1: Horizontal Icon Grid (Compact)
          </h3>
          <V1 />
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem', color: '#666' }}>
            Version 2: Vertical Descriptive Cards (Detailed)
          </h3>
          <V2 />
        </div>

        <div style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem', color: '#666' }}>
            Version 3: Horizontal Pill Links (Minimal)
          </h3>
          <V3 />
        </div>
      </div>
    </div>
  );
}
