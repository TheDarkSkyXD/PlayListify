import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface SidebarNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
}

function SidebarNav({ items }: SidebarNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <nav className="flex flex-col space-y-1">
      {items.map((item) => {
        const isActive = currentPath === item.href || 
                        (item.href !== '/dashboard' && currentPath.startsWith(item.href));
        
        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "justify-start",
              isActive ? "bg-secondary font-medium" : "font-normal"
            )}
            asChild
          >
            <Link to={item.href} className="flex items-center">
              {item.icon}
              {item.title}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

export default SidebarNav; 