"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmDeleteDialog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ConfirmDeleteDialog = ({ isOpen, onClose, onConfirm, playlistId, }) => {
    const [playlist, setPlaylist] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isLoadingPlaylist, setIsLoadingPlaylist] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isOpen && playlistId) {
            loadPlaylistDetails();
        }
    }, [isOpen, playlistId]);
    (0, react_1.useEffect)(() => {
        if (!isOpen) {
            // Reset state when dialog closes
            setPlaylist(null);
            setError(null);
        }
    }, [isOpen]);
    const loadPlaylistDetails = async () => {
        setIsLoadingPlaylist(true);
        setError(null);
        try {
            const response = await window.api.playlist.getById(playlistId);
            if (response.success) {
                setPlaylist(response.data);
            }
            else {
                setError(response.error || 'Failed to load playlist details');
            }
        }
        catch (error) {
            setError('An unexpected error occurred while loading playlist details');
            console.error('Error loading playlist details:', error);
        }
        finally {
            setIsLoadingPlaylist(false);
        }
    };
    const handleConfirmDelete = async () => {
        if (!playlist)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await window.api.playlist.delete(playlistId);
            if (response.success) {
                onConfirm();
                onClose();
            }
            else {
                setError(response.error || 'Failed to delete playlist');
            }
        }
        catch (error) {
            setError('An unexpected error occurred while deleting the playlist');
            console.error('Delete playlist error:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCancel = () => {
        if (!isLoading) {
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "modal-backdrop", onClick: handleCancel, children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content confirm-delete-dialog", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Delete Playlist" }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close", onClick: handleCancel, disabled: isLoading, children: "\u00D7" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-body", children: [(0, jsx_runtime_1.jsxs)("div", { className: "delete-warning", children: [(0, jsx_runtime_1.jsx)("div", { className: "delete-warning-icon", children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("h3", { children: "Are you sure you want to delete this playlist?" }), (0, jsx_runtime_1.jsx)("p", { children: "This action cannot be undone. The playlist and all its data will be permanently removed." })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error })), isLoadingPlaylist ? ((0, jsx_runtime_1.jsxs)("div", { className: "loading-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "loading-spinner" }), (0, jsx_runtime_1.jsx)("p", { children: "Loading playlist details..." })] })) : playlist ? ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-delete-details", children: [(0, jsx_runtime_1.jsx)("h4", { children: "Playlist Details" }), (0, jsx_runtime_1.jsxs)("ul", { className: "delete-details-list", children: [(0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Title:" }), " ", playlist.title] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Type:" }), (0, jsx_runtime_1.jsx)("span", { className: `playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`, children: playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom' })] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Videos:" }), " ", playlist.videoCount, " videos"] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Created:" }), " ", new Date(playlist.createdAt).toLocaleDateString()] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Updated:" }), " ", new Date(playlist.updatedAt).toLocaleDateString()] })] }), playlist.description && ((0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '16px' }, children: [(0, jsx_runtime_1.jsx)("strong", { children: "Description:" }), (0, jsx_runtime_1.jsx)("p", { style: {
                                                margin: '8px 0 0 0',
                                                color: 'var(--text-secondary)',
                                                fontSize: '14px',
                                                lineHeight: '1.5'
                                            }, children: playlist.description.length > 200
                                                ? `${playlist.description.substring(0, 200)}...`
                                                : playlist.description })] }))] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "error-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "error-icon", children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("h3", { children: "Failed to load playlist" }), (0, jsx_runtime_1.jsx)("p", { children: "Could not load playlist details for deletion confirmation." })] })), playlist && playlist.type === 'YOUTUBE' && ((0, jsx_runtime_1.jsx)("div", { className: "youtube-playlist-notice", children: (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Note:" }), " This will only remove the playlist from PlayListify. The original YouTube playlist will remain untouched."] }) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-footer", children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: handleCancel, disabled: isLoading, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-danger", onClick: handleConfirmDelete, disabled: !playlist || isLoading || isLoadingPlaylist, children: isLoading ? 'Deleting...' : 'Delete Playlist' })] })] }) }));
};
exports.ConfirmDeleteDialog = ConfirmDeleteDialog;
//# sourceMappingURL=ConfirmDeleteDialog.js.map