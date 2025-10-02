function App() {
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
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>🎉 Team SSO is WORKING!</h1>
      <p style={{ fontSize: '24px', marginBottom: '30px' }}>React is rendering successfully</p>
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
        onClick={() => alert('✅ React is working perfectly!')}
      >
        Click to Test React
      </button>
      <div style={{ marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
        <p>🔧 Debugging Info:</p>
        <p>✅ Vite server running on port 5174</p>
        <p>✅ React components rendering</p>
        <p>✅ Styles applied correctly</p>
        <p>Now we can add OAuth back step by step!</p>
      </div>
    </div>
  );
}

export default App;