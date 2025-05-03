import React from 'react';

interface TopNavbarProps {
  appVersion?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ 
  appVersion 
}) => {
  return (
    <header className="bg-primary text-primary-foreground p-4 shadow z-10">
      <div className="container mx-auto">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">PlayListify</h1>
          {appVersion && (
            <span className="ml-2 text-xs opacity-70">v{appVersion}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar; 