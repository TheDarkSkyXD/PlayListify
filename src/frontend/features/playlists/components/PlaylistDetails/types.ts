import { Playlist, Video } from '../../../../../shared/types/appTypes';

export interface PlaylistDetailsProps {
  playlist: Playlist;
  onPlayVideo: (video: Video) => void;
  onRefresh: () => void;
}

export interface PlaylistHeaderProps {
  playlist: Playlist;
  onRefresh: () => void;
}

export interface PlaylistInfoProps {
  playlist: Playlist;
}

export interface VideoListProps {
  playlist: Playlist;
  onPlayVideo: (video: Video) => void;
}

export interface VideoItemProps {
  video: Video;
  playlistId: string;
  onPlayVideo: (video: Video) => void;
  onVideoDeleted: () => void;
}

export interface EmptyStateProps {
  playlistId: string;
}

export interface PlaylistActionsProps {
  playlist: Playlist;
  onRefresh: () => void;
}
