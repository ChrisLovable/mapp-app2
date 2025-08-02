import React from 'react';
import ThreeDComponent from './ThreeDComponent';

const ThreeDTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>3D Component Test</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <ThreeDComponent depth="xs" backgroundColor="#333333" width="300px" height="60px">
          <h2 style={{ color: 'white', margin: 0 }}>XS Depth Test</h2>
        </ThreeDComponent>
        
        <ThreeDComponent depth="sm" backgroundColor="#444444" width="300px" height="60px">
          <h2 style={{ color: 'white', margin: 0 }}>SM Depth Test</h2>
        </ThreeDComponent>
        
        <ThreeDComponent depth="md" backgroundColor="#555555" width="300px" height="60px">
          <h2 style={{ color: 'white', margin: 0 }}>MD Depth Test</h2>
        </ThreeDComponent>
        
        <ThreeDComponent depth="lg" backgroundColor="#666666" width="300px" height="60px">
          <h2 style={{ color: 'white', margin: 0 }}>LG Depth Test</h2>
        </ThreeDComponent>
      </div>
    </div>
  );
};

export default ThreeDTest; 