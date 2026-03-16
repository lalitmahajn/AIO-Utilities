import React from 'react';
import '../styles/global.css';

const LiveBackground: React.FC = () => {
  return (
    <div className="live-bg-container">
      <div className="mesh-ball ball-1"></div>
      <div className="mesh-ball ball-2"></div>
      <div className="mesh-ball ball-3"></div>
      <div className="mesh-ball ball-4"></div>
      <div className="mesh-ball ball-5"></div>
      <div className="bg-overlay"></div>
    </div>
  );
};

export default LiveBackground;
