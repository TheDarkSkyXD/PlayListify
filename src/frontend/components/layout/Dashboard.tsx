import React from 'react';

export interface DashboardProps {}

export const Dashboard: React.FC<DashboardProps> = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-section">
        <h2>Recent Playlists</h2>
        <div className="dashboard-items">
          <div className="dashboard-item">
            <p>No recent playlists</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-section">
        <h2>Continue Watching</h2>
        <div className="dashboard-items">
          <div className="dashboard-item">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-section">
        <h2>Statistics</h2>
        <div className="dashboard-items">
          <div className="dashboard-item">
            <p>Total Playlists: 0</p>
          </div>
          <div className="dashboard-item">
            <p>Total Videos: 0</p>
          </div>
          <div className="dashboard-item">
            <p>Downloaded: 0</p>
          </div>
        </div>
      </div>
    </div>
  );
};