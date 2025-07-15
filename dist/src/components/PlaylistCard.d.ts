import React from 'react';
export interface PlaylistCardProps {
    playlist: {
        id: number;
        title: string;
        description: string;
        type: 'YOUTUBE' | 'CUSTOM';
        videoCount: number;
        thumbnailUrl?: string;
        createdAt: Date;
        updatedAt: Date;
    };
    viewMode: 'grid' | 'list';
    onClick: (playlistId: number) => void;
    onEdit?: (playlistId: number) => void;
    onDelete?: (playlistId: number) => void;
    onDownload?: (playlistId: number) => void;
}
export declare const PlaylistCard: React.FC<PlaylistCardProps>;
//# sourceMappingURL=PlaylistCard.d.ts.map