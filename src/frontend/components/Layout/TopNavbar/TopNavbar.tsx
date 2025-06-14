import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '@/frontend/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/components/ui/dropdown-menu';
import { Plus, Sun, Moon, UserCircle, Download } from 'lucide-react'; // Added Download icon
import AddPlaylistDialog from '../../playlist/AddPlaylistDialog';
import DownloadVideoDialog from '../../download/DownloadVideoDialog'; // Import the new dialog

const TopNavbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAddPlaylistDialogOpen, setIsAddPlaylistDialogOpen] = useState(false);
  const [isDownloadVideoDialogOpen, setIsDownloadVideoDialogOpen] = useState(false); // State for new dialog

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <div>
        {/* Placeholder for breadcrumbs or page title */}
        <span className="text-lg font-semibold">Page Title</span>
      </div>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsAddPlaylistDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Playlist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDownloadVideoDialogOpen(true)}> {/* New menu item */}
              <Download className="mr-2 h-4 w-4" /> Download Video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-light-background-tertiary dark:hover:bg-dark-background-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-full flex items-center justify-center text-muted-foreground">
          <UserCircle className="h-6 w-6" />
        </div>
        <AddPlaylistDialog isOpen={isAddPlaylistDialogOpen} onOpenChange={setIsAddPlaylistDialogOpen} />
        {/* Render the new dialog */}
        <DownloadVideoDialog isOpen={isDownloadVideoDialogOpen} onOpenChange={setIsDownloadVideoDialogOpen} />
      </div>
    </header>
  );
};

export default TopNavbar;