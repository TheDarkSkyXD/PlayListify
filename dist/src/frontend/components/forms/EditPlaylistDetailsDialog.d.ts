import React from 'react';
export interface EditPlaylistDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onPlaylistUpdated: (updatedPlaylist: any) => void;
    playlistId: number;
}
export declare const EditPlaylistDetailsDialog: React.FC<EditPlaylistDetailsDialogProps>;
//# sourceMappingURL=EditPlaylistDetailsDialog.d.ts.map