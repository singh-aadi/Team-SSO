
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Simple test landing page without OAuth dependencies
function SimpleLandingPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #1e3a8a, #0d9488)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Team SSO</h1>
      <p style={{ fontSize: '24px', marginBottom: '30px' }}>Startup Success Optimizer</p>
      <button 
        style={{ 
          background: 'white', 
          color: '#1e3a8a', 
          padding: '15px 30px', 
          fontSize: '18px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
        onClick={() => alert('OAuth setup working! This confirms React is rendering.')}
      >
        Test Button - Click Me!
      </button>
      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        <p>Environment check:</p>
        <p>Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Found' : 'Missing'}</p>
        <p>Mode: {import.meta.env.MODE}</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<SimpleLandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;