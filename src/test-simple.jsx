// Simple test component to verify React is working
import React from 'react';

export default function TestSimple() {
  return (
    <div style={{ 
      padding: '50px', 
      fontFamily: 'Arial', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: 'green', fontSize: '48px', marginBottom: '20px' }}>✅ React is Working!</h1>
      <p style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>If you see this, React is rendering correctly.</p>
      <p style={{ fontSize: '18px', color: '#666' }}>The blank page issue is likely in one of the components.</p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: '30px',
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Go to App
      </button>
    </div>
  );
}
