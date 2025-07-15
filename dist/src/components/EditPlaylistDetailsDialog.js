"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditPlaylistDetailsDialog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const EditPlaylistDetailsDialog = ({ isOpen, onClose, onPlaylistUpdated, playlistId, }) => {
    const [playlist, setPlaylist] = (0, react_1.useState)(null);
    const [title, setTitle] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isLoadingPlaylist, setIsLoadingPlaylist] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [titleError, setTitleError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (isOpen && playlistId) {
            loadPlaylistDetails();
        }
    }, [isOpen, playlistId]);
    (0, react_1.useEffect)(() => {
        if (!isOpen) {
            // Reset form when dialog closes
            setTitle('');
            setDescription('');
            setError(null);
            setTitleError(null);
            setPlaylist(null);
        }
    }, [isOpen]);
    const loadPlaylistDetails = async () => {
        setIsLoadingPlaylist(true);
        setError(null);
        try {
            const response = await window.api.playlist.getById(playlistId);
            if (response.success) {
                setPlaylist(response.data);
                setTitle(response.data.title);
                setDescription(response.data.description || '');
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
    const validateTitle = (title) => {
        if (!title.trim()) {
            setTitleError('Title is required');
            return false;
        }
        if (title.length > 255) {
            setTitleError('Title cannot exceed 255 characters');
            return false;
        }
        setTitleError(null);
        return true;
    };
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        validateTitle(newTitle);
    };
    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };
    const handleSave = async () => {
        if (!validateTitle(title)) {
            return;
        }
        if (description.length > 1000) {
            setError('Description cannot exceed 1000 characters');
            return;
        }
        if (!playlist) {
            setError('Playlist data not loaded');
            return;
        }
        // Check if anything has changed
        const hasChanges = title.trim() !== playlist.title || description.trim() !== (playlist.description || '');
        if (!hasChanges) {
            onClose();
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await window.api.playlist.update(playlistId, {
                title: title.trim(),
                description: description.trim(),
            });
            if (response.success) {
                onPlaylistUpdated(response.data);
                onClose();
            }
            else {
                if (response.error.includes('already exists')) {
                    setTitleError(response.error);
                }
                else {
                    setError(response.error || 'Failed to update playlist');
                }
            }
        }
        catch (error) {
            setError('An unexpected error occurred while updating the playlist');
            console.error('Update playlist error:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCancel = () => {
        if (playlist) {
            setTitle(playlist.title);
            setDescription(playlist.description || '');
        }
        setError(null);
        setTitleError(null);
        onClose();
    };
    const hasUnsavedChanges = playlist && (title.trim() !== playlist.title ||
        description.trim() !== (playlist.description || ''));
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "modal-backdrop", onClick: handleCancel, children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content edit-playlist-dialog", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Edit Playlist Details" }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close", onClick: handleCancel, children: "\u00D7" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-body", children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error })), isLoadingPlaylist ? ((0, jsx_runtime_1.jsxs)("div", { className: "loading-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "loading-spinner" }), (0, jsx_runtime_1.jsx)("p", { children: "Loading playlist details..." })] })) : playlist ? ((0, jsx_runtime_1.jsxs)("div", { className: "edit-playlist-form", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: "edit-title", children: ["Title ", (0, jsx_runtime_1.jsx)("span", { className: "required", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { id: "edit-title", type: "text", value: title, onChange: handleTitleChange, placeholder: "Enter playlist title", disabled: isLoading, maxLength: 255 }), (0, jsx_runtime_1.jsxs)("div", { className: "character-count", children: [title.length, "/255 characters"] }), titleError && ((0, jsx_runtime_1.jsx)("div", { className: "field-error", children: titleError }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "edit-description", children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { id: "edit-description", value: description, onChange: handleDescriptionChange, placeholder: "Enter playlist description (optional)", disabled: isLoading, maxLength: 1000, rows: 4 }), (0, jsx_runtime_1.jsxs)("div", { className: "character-count", children: [description.length, "/1000 characters"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-info", children: [(0, jsx_runtime_1.jsxs)("div", { className: "info-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "info-label", children: "Type:" }), (0, jsx_runtime_1.jsx)("span", { className: `playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`, children: playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "info-label", children: "Videos:" }), (0, jsx_runtime_1.jsxs)("span", { className: "info-value", children: [playlist.videoCount, " videos"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "info-label", children: "Created:" }), (0, jsx_runtime_1.jsx)("span", { className: "info-value", children: new Date(playlist.createdAt).toLocaleDateString() })] }), (0, jsx_runtime_1.jsxs)("div", { className: "info-item", children: [(0, jsx_runtime_1.jsx)("span", { className: "info-label", children: "Last Updated:" }), (0, jsx_runtime_1.jsx)("span", { className: "info-value", children: new Date(playlist.updatedAt).toLocaleDateString() })] })] }), playlist.type === 'YOUTUBE' && ((0, jsx_runtime_1.jsx)("div", { className: "youtube-playlist-notice", children: (0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Note:" }), " This is a YouTube playlist. Only the title and description can be edited. The original playlist content will remain unchanged."] }) }))] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "error-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "error-icon", children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("h3", { children: "Failed to load playlist" }), (0, jsx_runtime_1.jsx)("p", { children: "Could not load playlist details for editing." })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-footer", children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: handleCancel, disabled: isLoading, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: handleSave, disabled: !playlist ||
                                !title.trim() ||
                                !!titleError ||
                                isLoading ||
                                isLoadingPlaylist ||
                                !hasUnsavedChanges, children: isLoading ? 'Saving...' : 'Save Changes' })] })] }) }));
};
exports.EditPlaylistDetailsDialog = EditPlaylistDetailsDialog;
//# sourceMappingURL=EditPlaylistDetailsDialog.js.map