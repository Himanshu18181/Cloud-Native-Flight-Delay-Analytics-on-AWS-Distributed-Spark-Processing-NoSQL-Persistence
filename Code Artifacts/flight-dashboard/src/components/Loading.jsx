import React from 'react';
import './Loading.css';

function Loading() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <h2>Loading Flight Data Dashboard...</h2>
      <p>Processing and visualizing 48M+ flight records</p>
      <div className="progress-bar">
        <div className="progress-fill"></div>
      </div>
    </div>
  );
}

export default Loading;
