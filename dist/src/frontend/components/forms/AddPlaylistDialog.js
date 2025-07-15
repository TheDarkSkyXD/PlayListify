"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPlaylistDialog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AddPlaylistDialog = ({ isOpen, onClose, onPlaylistAdded, }) => {
    const [activeTab, setActiveTab] = (0, react_1.useState)('youtube');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    // YouTube import state
    const [youtubeUrl, setYoutubeUrl] = (0, react_1.useState)('');
    const [playlistPreview, setPlaylistPreview] = (0, react_1.useState)(null);
    const [isValidatingUrl, setIsValidatingUrl] = (0, react_1.useState)(false);
    // Custom playlist state
    const [customTitle, setCustomTitle] = (0, react_1.useState)('');
    const [customDescription, setCustomDescription] = (0, react_1.useState)('');
    const [titleError, setTitleError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!isOpen) {
            // Reset form when dialog closes
            setYoutubeUrl('');
            setPlaylistPreview(null);
            setCustomTitle('');
            setCustomDescription('');
            setError(null);
            setTitleError(null);
            setActiveTab('youtube');
        }
    }, [isOpen]);
    const validateYouTubeUrl = async (url) => {
        if (!url.trim()) {
            setPlaylistPreview(null);
            return;
        }
        setIsValidatingUrl(true);
        setError(null);
        try {
            const response = await window.api.youtube.validateUrl(url);
            if (!response.success) {
                setError(response.error || 'Invalid URL');
                setPlaylistPreview(null);
                return;
            }
            if (!response.data.isValid) {
                setError('Please enter a valid YouTube playlist URL');
                setPlaylistPreview(null);
                return;
            }
            // Get playlist metadata
            const metadataResponse = await window.api.youtube.getPlaylistMetadata(response.data.sanitizedUrl);
            if (metadataResponse.success) {
                setPlaylistPreview({
                    title: metadataResponse.data.title,
                    description: metadataResponse.data.description,
                    thumbnailUrl: metadataResponse.data.thumbnailUrl,
                    videoCount: metadataResponse.data.videoCount,
                    uploader: metadataResponse.data.uploader,
                });
                setError(null);
            }
            else {
                setError(metadataResponse.error || 'Failed to fetch playlist information');
                setPlaylistPreview(null);
            }
        }
        catch (error) {
            setError('An unexpected error occurred while validating the URL');
            setPlaylistPreview(null);
            console.error('URL validation error:', error);
        }
        finally {
            setIsValidatingUrl(false);
        }
    };
    const handleUrlChange = (e) => {
        const url = e.target.value;
        setYoutubeUrl(url);
        // Debounce URL validation
        const timeoutId = setTimeout(() => {
            validateYouTubeUrl(url);
        }, 1000);
        return () => clearTimeout(timeoutId);
    };
    const handleImportPlaylist = async () => {
        if (!playlistPreview) {
            setError('Please enter a valid YouTube playlist URL');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await window.api.youtube.importPlaylist(youtubeUrl);
            if (response.success) {
                onPlaylistAdded(response.data.playlist);
                onClose();
            }
            else {
                setError(response.error || 'Failed to import playlist');
            }
        }
        catch (error) {
            setError('An unexpected error occurred while importing the playlist');
            console.error('Import error:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const validateCustomTitle = async (title) => {
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
    const handleCustomTitleChange = (e) => {
        const title = e.target.value;
        setCustomTitle(title);
        validateCustomTitle(title);
    };
    const handleCreateCustomPlaylist = async () => {
        if (!(await validateCustomTitle(customTitle))) {
            return;
        }
        if (customDescription.length > 1000) {
            setError('Description cannot exceed 1000 characters');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await window.api.playlist.create({
                title: customTitle.trim(),
                description: customDescription.trim(),
                type: 'CUSTOM',
            });
            if (response.success) {
                onPlaylistAdded(response.data);
                onClose();
            }
            else {
                if (response.error.includes('already exists')) {
                    setTitleError(response.error);
                }
                else {
                    setError(response.error || 'Failed to create playlist');
                }
            }
        }
        catch (error) {
            setError('An unexpected error occurred while creating the playlist');
            console.error('Create playlist error:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "modal-backdrop", onClick: onClose, children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content add-playlist-dialog", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)("div", { className: "modal-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Add New Playlist" }), (0, jsx_runtime_1.jsx)("button", { className: "modal-close", onClick: onClose, children: "\u00D7" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "dialog-tabs", children: [(0, jsx_runtime_1.jsx)("button", { className: `tab-button ${activeTab === 'youtube' ? 'active' : ''}`, onClick: () => setActiveTab('youtube'), children: "From YouTube" }), (0, jsx_runtime_1.jsx)("button", { className: `tab-button ${activeTab === 'custom' ? 'active' : ''}`, onClick: () => setActiveTab('custom'), children: "Custom Playlist" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-body", children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error })), activeTab === 'youtube' && ((0, jsx_runtime_1.jsxs)("div", { className: "youtube-tab", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "youtube-url", children: "YouTube Playlist URL" }), (0, jsx_runtime_1.jsx)("input", { id: "youtube-url", type: "url", value: youtubeUrl, onChange: handleUrlChange, placeholder: "https://www.youtube.com/playlist?list=...", disabled: isLoading }), isValidatingUrl && ((0, jsx_runtime_1.jsx)("div", { className: "validation-spinner", children: "Validating URL..." }))] }), playlistPreview && ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-preview", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Playlist Preview" }), (0, jsx_runtime_1.jsxs)("div", { className: "preview-content", children: [playlistPreview.thumbnailUrl && ((0, jsx_runtime_1.jsx)("img", { src: playlistPreview.thumbnailUrl, alt: "Playlist thumbnail", className: "preview-thumbnail", onError: (e) => {
                                                        e.target.style.display = 'none';
                                                    } })), (0, jsx_runtime_1.jsxs)("div", { className: "preview-info", children: [(0, jsx_runtime_1.jsx)("h4", { className: "preview-title", children: playlistPreview.title }), (0, jsx_runtime_1.jsxs)("p", { className: "preview-uploader", children: ["by ", playlistPreview.uploader] }), (0, jsx_runtime_1.jsxs)("p", { className: "preview-video-count", children: [playlistPreview.videoCount, " videos"] }), playlistPreview.description && ((0, jsx_runtime_1.jsx)("p", { className: "preview-description", children: playlistPreview.description.length > 200
                                                                ? `${playlistPreview.description.substring(0, 200)}...`
                                                                : playlistPreview.description }))] })] })] }))] })), activeTab === 'custom' && ((0, jsx_runtime_1.jsxs)("div", { className: "custom-tab", children: [(0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsxs)("label", { htmlFor: "custom-title", children: ["Title ", (0, jsx_runtime_1.jsx)("span", { className: "required", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { id: "custom-title", type: "text", value: customTitle, onChange: handleCustomTitleChange, placeholder: "Enter playlist title", disabled: isLoading, maxLength: 255 }), (0, jsx_runtime_1.jsxs)("div", { className: "character-count", children: [customTitle.length, "/255 characters"] }), titleError && ((0, jsx_runtime_1.jsx)("div", { className: "field-error", children: titleError }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "form-group", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "custom-description", children: "Description" }), (0, jsx_runtime_1.jsx)("textarea", { id: "custom-description", value: customDescription, onChange: (e) => setCustomDescription(e.target.value), placeholder: "Enter playlist description (optional)", disabled: isLoading, maxLength: 1000, rows: 4 }), (0, jsx_runtime_1.jsxs)("div", { className: "character-count", children: [customDescription.length, "/1000 characters"] })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-footer", children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: onClose, disabled: isLoading, children: "Cancel" }), activeTab === 'youtube' ? ((0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: handleImportPlaylist, disabled: !playlistPreview || isLoading || isValidatingUrl, children: isLoading ? 'Importing...' : 'Import Playlist' })) : ((0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: handleCreateCustomPlaylist, disabled: !customTitle.trim() || !!titleError || isLoading, children: isLoading ? 'Creating...' : 'Create Playlist' }))] })] }) }));
};
exports.AddPlaylistDialog = AddPlaylistDialog;
//# sourceMappingURL=AddPlaylistDialog.js.map