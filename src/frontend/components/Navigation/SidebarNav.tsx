import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface SidebarNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  className?: string;
}

/**
 * A sidebar navigation component that displays a list of navigation items
 * Used for the main app navigation
 */
export default function SidebarNav({ items, className }: SidebarNavProps) {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <nav className={cn("flex-1 overflow-auto py-2", className)}>
      <div className="px-3 py-2">
        <div className="space-y-1">
          {items.map((item) => {
            // Check if the current path matches the item's href
            // We need to handle both exact matches and nested routes
            const isActive = 
              currentPath === item.href || 
              (item.href !== '/' && currentPath.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className="block"
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon && (
                    <span className="mr-2">{item.icon}</span>
                  )}
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
