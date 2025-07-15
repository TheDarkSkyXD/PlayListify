"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyPlaylists = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const PlaylistCard_1 = require("./PlaylistCard");
const AddPlaylistDialog_1 = require("./AddPlaylistDialog");
const MyPlaylists = ({ onPlaylistClick }) => {
    const [playlists, setPlaylists] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)('grid');
    const [showAddDialog, setShowAddDialog] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        loadPlaylists();
        loadViewMode();
    }, []);
    const loadPlaylists = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await window.api.playlist.getAll();
            if (response.success) {
                setPlaylists(response.data);
            }
            else {
                setError(response.error || 'Failed to load playlists');
            }
        }
        catch (error) {
            setError('An unexpected error occurred while loading playlists');
            console.error('Error loading playlists:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadViewMode = async () => {
        try {
            const response = await window.api.settings.get('playlistViewMode');
            if (response.success && (response.data === 'grid' || response.data === 'list')) {
                setViewMode(response.data);
            }
        }
        catch (error) {
            console.error('Error loading view mode:', error);
        }
    };
    const handleViewModeToggle = async () => {
        const newViewMode = viewMode === 'grid' ? 'list' : 'grid';
        setViewMode(newViewMode);
        try {
            await window.api.settings.set('playlistViewMode', newViewMode);
        }
        catch (error) {
            console.error('Error saving view mode:', error);
        }
    };
    const handleAddPlaylist = () => {
        setShowAddDialog(true);
    };
    const handlePlaylistClick = (playlistId) => {
        onPlaylistClick(playlistId);
    };
    const handlePlaylistAdded = (newPlaylist) => {
        setPlaylists(prevPlaylists => [...prevPlaylists, newPlaylist]);
        setShowAddDialog(false);
    };
    const handleEditPlaylist = (playlistId) => {
        console.log('Edit playlist:', playlistId);
    };
    const handleDeletePlaylist = (playlistId) => {
        console.log('Delete playlist:', playlistId);
    };
    const handleDownloadPlaylist = (playlistId) => {
        console.log('Download playlist:', playlistId);
    };
    const renderEmptyState = () => ((0, jsx_runtime_1.jsxs)("div", { className: "empty-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "empty-state-icon", children: "\uD83C\uDFB5" }), (0, jsx_runtime_1.jsx)("h3", { children: "No playlists yet" }), (0, jsx_runtime_1.jsx)("p", { children: "Start by creating a custom playlist or importing one from YouTube" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: handleAddPlaylist, children: "Add Your First Playlist" })] }));
    const renderError = () => ((0, jsx_runtime_1.jsxs)("div", { className: "error-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "error-icon", children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("h3", { children: "Failed to load playlists" }), (0, jsx_runtime_1.jsx)("p", { children: error }), (0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: loadPlaylists, children: "Try Again" })] }));
    const renderLoading = () => ((0, jsx_runtime_1.jsxs)("div", { className: "loading-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "loading-spinner" }), (0, jsx_runtime_1.jsx)("p", { children: "Loading playlists..." })] }));
    if (isLoading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "my-playlists", children: [(0, jsx_runtime_1.jsx)("div", { className: "playlists-header", children: (0, jsx_runtime_1.jsx)("h1", { children: "My Playlists" }) }), renderLoading()] }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "my-playlists", children: [(0, jsx_runtime_1.jsx)("div", { className: "playlists-header", children: (0, jsx_runtime_1.jsx)("h1", { children: "My Playlists" }) }), renderError()] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "my-playlists", children: [(0, jsx_runtime_1.jsxs)("div", { className: "playlists-header", children: [(0, jsx_runtime_1.jsx)("h1", { children: "My Playlists" }), (0, jsx_runtime_1.jsxs)("div", { className: "playlists-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "view-toggle-btn", onClick: handleViewModeToggle, title: `Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`, children: viewMode === 'grid' ? '☰' : '⊞' }), (0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: handleAddPlaylist, children: "+ Add Playlist" })] })] }), playlists.length === 0 ? (renderEmptyState()) : ((0, jsx_runtime_1.jsx)("div", { className: `playlists-container ${viewMode === 'list' ? 'playlists-list' : 'playlists-grid'}`, children: playlists.map(playlist => ((0, jsx_runtime_1.jsx)(PlaylistCard_1.PlaylistCard, { playlist: playlist, viewMode: viewMode, onClick: handlePlaylistClick, onEdit: handleEditPlaylist, onDelete: handleDeletePlaylist, onDownload: handleDownloadPlaylist }, playlist.id))) })), (0, jsx_runtime_1.jsx)(AddPlaylistDialog_1.AddPlaylistDialog, { isOpen: showAddDialog, onClose: () => setShowAddDialog(false), onPlaylistAdded: handlePlaylistAdded })] }));
};
exports.MyPlaylists = MyPlaylists;
//# sourceMappingURL=MyPlaylists.js.map