import React from 'react';
import { Outlet } from '@tanstack/react-router';

const MyPlaylistsLayout = () => {
  return (
    <div>
      <h1>My Playlists Section</h1>
      <Outlet />
    </div>
  );
};

export default MyPlaylistsLayout;