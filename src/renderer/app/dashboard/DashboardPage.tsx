import React from 'react';
import { Separator } from '../../components/ui/separator';
import { Youtube } from 'lucide-react';
import SidebarNav from '../../components/SidebarNav';
import PlaylistList, { PlaylistSkeleton } from '../../features/playlists/components/PlaylistList';
import CreatePlaylistForm from '../../features/playlists/components/CreatePlaylistForm';
import { usePlaylists } from '../../services/queryHooks';
import { LoadingDialog } from '../../components/LoadingDialog';

const sidebarNavItems = [
  {
    title: 'Playlists',
    href: '/dashboard',
    icon: <Youtube className="mr-2 h-4 w-4" />
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: <svg className="mr-2 h-4 w-4" fill="none" height="24" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M19.622 10.395c-.198-.33-.396-.759-.396-1.395 0-.66.132-1.056.33-1.395.198-.33 0-.726-.33-.924l-1.716-1.32c-.33-.198-.726-.066-.924.264-.198.33-.594.66-1.254.66-.594 0-.99-.33-1.188-.66-.198-.33-.594-.462-.924-.264L11.484 6.7c-.33.198-.462.594-.264.924.198.33.33.726.33 1.386 0 .66-.132 1.056-.33 1.386-.198.33-.066.726.264.924l1.716 1.32c.33.198.726.066.924-.264.198-.33.594-.66 1.254-.66.66 0 1.056.33 1.254.66.198.33.594.462.924.264l1.716-1.32c.33-.198.528-.594.33-.924ZM15.66 19.328c.264-.264.264-.66 0-.924-.264-.264-.594-.594-.594-1.254 0-.594.33-.99.594-1.254.264-.264.264-.66 0-.924l-1.32-1.32c-.264-.264-.66-.264-.924 0-.264.264-.594.594-1.254.594-.66 0-.99-.33-1.254-.594-.264-.264-.66-.264-.924 0l-1.32 1.32c-.264.264-.264.66 0 .924.264.264.594.594.594 1.254 0 .66-.33 1.056-.594 1.32-.264.264-.264.66 0 .924l1.32 1.32c.264.264.66.264.924 0 .264-.264.594-.594 1.254-.594.66 0 .99.33 1.254.594.264.264.66.264.924 0l1.32-1.386Z" stroke="currentColor" strokeWidth="1.5"></path></svg>
  },
  {
    title: 'About',
    href: '/dashboard/about',
    icon: <svg className="mr-2 h-4 w-4" fill="none" height="24" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle><path d="M12 17v-6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"></path><path d="M12 7.51l.01-.011" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path></svg>
  }
];

function DashboardPage() {
  const { data: playlists, isLoading, error } = usePlaylists();

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block border-r w-64 p-6">
        <div className="mb-8 flex items-center">
          <Youtube className="h-6 w-6 mr-2" />
          <h1 className="text-xl font-semibold">PlayListify</h1>
        </div>
        <SidebarNav items={sidebarNavItems} />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">My Playlists</h1>
        </div>
        <Separator className="my-4" />
        
        <CreatePlaylistForm />
        
        {error ? (
          <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error.message}</span>
          </div>
        ) : isLoading ? (
          <PlaylistSkeleton count={3} />
        ) : (
          <PlaylistList playlists={playlists || []} />
        )}
      </div>
    </div>
  );
}

export default DashboardPage; 