'use client'; 

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Captured Runtime Layout Error:', error);
  }, [error]);

  return (
    <div style={{
      padding: '40px 24px',
      maxWidth: '440px',
      margin: '80px auto',
      textAlign: 'center',
      border: '1px solid #fee2e2',
      backgroundColor: '#fef2f2',
      borderRadius: '16px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ color: '#991b1b', margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#b91c1c', fontSize: '14px', lineHeight: '20px', marginBottom: '24px' }}>
        The interface encountered an unexpected error while loading this segment. Try refreshing the view grid.
      </p>
      <button
        onClick={() => reset()} // Next.js built-in mechanism to re-render the segment
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        Try Again
      </button>
    </div>
  );
}