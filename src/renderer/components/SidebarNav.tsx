import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';
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
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  
  return (
    <nav className="flex flex-col space-y-1 dark:bg-[#0F0F0F]">
      {items.map((item) => {
        const isActive = currentPath === item.href || 
                        (currentPath.startsWith(item.href) && item.href !== '/');
        
        if (item.href === '/') {
          const isDashboardActive = currentPath === '/';
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "sidebar-nav-item",
                isDashboardActive ? "sidebar-nav-active" : "",
                "dark:hover:bg-muted dark:hover:text-white hover:bg-[#EDEDED] hover:text-[#0F0F0F]"
              )}
              asChild
            >
              <Link to={item.href} className="flex items-center">
                {item.icon}
                {item.title}
              </Link>
            </Button>
          );
        }
        
        return (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "sidebar-nav-item",
              isActive ? "sidebar-nav-active" : "",
              "dark:hover:bg-muted dark:hover:text-white hover:bg-[#EDEDED] hover:text-[#0F0F0F]"
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