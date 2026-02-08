// Temporary test file to debug blank page
import React from 'react';

export default function TestApp() {
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'green', fontSize: '32px' }}>✅ React is Working!</h1>
      <p style={{ fontSize: '18px', color: '#333' }}>If you see this, React is rendering correctly.</p>
      <p style={{ fontSize: '14px', color: '#666' }}>The blank page issue is likely in one of the components.</p>
    </div>
  );
}
