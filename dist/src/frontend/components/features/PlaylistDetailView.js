"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistDetailView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const PlaylistDetailView = ({ playlistId, onBack, }) => {
    const [playlist, setPlaylist] = (0, react_1.useState)(null);
    const [filteredVideos, setFilteredVideos] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Debounced search function
    const debounceSearch = (0, react_1.useCallback)(debounce((query, videos) => {
        if (!query.trim()) {
            setFilteredVideos(videos);
            return;
        }
        const filtered = videos.filter(video => video.title.toLowerCase().includes(query.toLowerCase()) ||
            video.channelName.toLowerCase().includes(query.toLowerCase()));
        setFilteredVideos(filtered);
    }, 300), []);
    (0, react_1.useEffect)(() => {
        loadPlaylistDetails();
    }, [playlistId]);
    (0, react_1.useEffect)(() => {
        if (playlist) {
            debounceSearch(searchQuery, playlist.videos);
        }
    }, [searchQuery, playlist, debounceSearch]);
    const loadPlaylistDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await window.api.playlist.getById(playlistId);
            if (response.success) {
                setPlaylist(response.data);
                setFilteredVideos(response.data.videos);
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
            setIsLoading(false);
        }
    };
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    const clearSearch = () => {
        setSearchQuery('');
    };
    const formatDuration = (duration) => {
        // Duration is already formatted from the backend
        return duration || '0:00';
    };
    const formatViewCount = (viewCount) => {
        if (viewCount >= 1000000) {
            return `${(viewCount / 1000000).toFixed(1)}M views`;
        }
        else if (viewCount >= 1000) {
            return `${(viewCount / 1000).toFixed(1)}K views`;
        }
        else {
            return `${viewCount} views`;
        }
    };
    const formatUploadDate = (uploadDate) => {
        return new Date(uploadDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    const getAvailabilityStatusColor = (status) => {
        switch (status) {
            case 'PUBLIC':
                return 'status-public';
            case 'PRIVATE':
                return 'status-private';
            case 'DELETED':
                return 'status-deleted';
            default:
                return 'status-unknown';
        }
    };
    const renderVideoItem = (video, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "video-item", children: [(0, jsx_runtime_1.jsx)("div", { className: "video-index", children: index + 1 }), (0, jsx_runtime_1.jsxs)("div", { className: "video-thumbnail", children: [(0, jsx_runtime_1.jsx)("img", { src: video.thumbnailURL, alt: video.title, onError: (e) => {
                            e.target.src = '/assets/default-video-thumbnail.png';
                        } }), (0, jsx_runtime_1.jsx)("div", { className: "video-duration", children: formatDuration(video.duration) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "video-info", children: [(0, jsx_runtime_1.jsx)("h3", { className: "video-title", children: video.title }), (0, jsx_runtime_1.jsx)("div", { className: "video-channel", children: video.channelName }), (0, jsx_runtime_1.jsxs)("div", { className: "video-meta", children: [(0, jsx_runtime_1.jsx)("span", { className: "video-views", children: formatViewCount(video.viewCount) }), (0, jsx_runtime_1.jsxs)("span", { className: "video-upload-date", children: ["Uploaded ", formatUploadDate(video.uploadDate)] }), (0, jsx_runtime_1.jsx)("span", { className: `video-status ${getAvailabilityStatusColor(video.availabilityStatus)}`, children: video.availabilityStatus })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "video-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "video-action-btn", onClick: () => handleVideoAction(video.id, 'play'), title: "Play video", children: "\u25B6" }), (0, jsx_runtime_1.jsx)("button", { className: "video-action-btn", onClick: () => handleVideoAction(video.id, 'download'), title: "Download video", children: "\u2B07" }), (0, jsx_runtime_1.jsx)("button", { className: "video-action-btn", onClick: () => handleVideoAction(video.id, 'remove'), title: "Remove from playlist", children: "\u2715" })] })] }, video.id));
    const handleVideoAction = (videoId, action) => {
        switch (action) {
            case 'play':
                console.log('Play video:', videoId);
                // TODO: Implement video playback
                break;
            case 'download':
                console.log('Download video:', videoId);
                // TODO: Implement video download
                break;
            case 'remove':
                console.log('Remove video:', videoId);
                // TODO: Implement video removal
                break;
        }
    };
    const renderSearchResults = () => {
        if (searchQuery.trim() && filteredVideos.length === 0) {
            return ((0, jsx_runtime_1.jsxs)("div", { className: "no-results", children: [(0, jsx_runtime_1.jsx)("div", { className: "no-results-icon", children: "\uD83D\uDD0D" }), (0, jsx_runtime_1.jsx)("h3", { children: "No results found" }), (0, jsx_runtime_1.jsxs)("p", { children: ["No videos found matching \"", searchQuery, "\". Try different keywords or", ' ', (0, jsx_runtime_1.jsx)("button", { className: "link-button", onClick: clearSearch, children: "clear search" }), "."] })] }));
        }
        if (filteredVideos.length === 0) {
            return ((0, jsx_runtime_1.jsxs)("div", { className: "no-results", children: [(0, jsx_runtime_1.jsx)("div", { className: "no-results-icon", children: "\uD83D\uDCF9" }), (0, jsx_runtime_1.jsx)("h3", { children: "No videos in this playlist" }), (0, jsx_runtime_1.jsx)("p", { children: "This playlist doesn't contain any videos yet." })] }));
        }
        return ((0, jsx_runtime_1.jsx)("div", { className: "video-list", children: filteredVideos.map((video, index) => renderVideoItem(video, index)) }));
    };
    const renderLoading = () => ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-detail-loading", children: [(0, jsx_runtime_1.jsx)("div", { className: "loading-spinner" }), (0, jsx_runtime_1.jsx)("p", { children: "Loading playlist details..." })] }));
    const renderError = () => ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-detail-error", children: [(0, jsx_runtime_1.jsx)("div", { className: "error-icon", children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("h3", { children: "Failed to load playlist" }), (0, jsx_runtime_1.jsx)("p", { children: error }), (0, jsx_runtime_1.jsxs)("div", { className: "error-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: loadPlaylistDetails, children: "Try Again" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-primary", onClick: onBack, children: "Go Back" })] })] }));
    if (isLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "playlist-detail-view", children: renderLoading() }));
    }
    if (error || !playlist) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "playlist-detail-view", children: renderError() }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-detail-view", children: [(0, jsx_runtime_1.jsxs)("div", { className: "playlist-detail-header", children: [(0, jsx_runtime_1.jsx)("button", { className: "back-button", onClick: onBack, children: "\u2190 Back to Playlists" }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-header-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "playlist-header-info", children: [(0, jsx_runtime_1.jsx)("h1", { className: "playlist-detail-title", children: playlist.title }), playlist.description && ((0, jsx_runtime_1.jsx)("p", { className: "playlist-detail-description", children: playlist.description })), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-detail-meta", children: [(0, jsx_runtime_1.jsxs)("span", { className: "playlist-video-count", children: [playlist.videoCount, " videos"] }), (0, jsx_runtime_1.jsx)("span", { className: `playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`, children: playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom' }), (0, jsx_runtime_1.jsxs)("span", { className: "playlist-updated", children: ["Updated ", formatUploadDate(playlist.updatedAt)] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-header-actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: () => console.log('Play all'), children: "\u25B6 Play All" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: () => console.log('Download all'), children: "\u2B07 Download All" }), (0, jsx_runtime_1.jsx)("button", { className: "btn-secondary", onClick: () => console.log('Edit playlist'), children: "\u270F\uFE0F Edit" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-content", children: [(0, jsx_runtime_1.jsxs)("div", { className: "playlist-search-section", children: [(0, jsx_runtime_1.jsxs)("div", { className: "search-input-container", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", className: "playlist-search-input", placeholder: "Search videos by title or channel...", value: searchQuery, onChange: handleSearchChange }), searchQuery && ((0, jsx_runtime_1.jsx)("button", { className: "clear-search-btn", onClick: clearSearch, children: "\u2715" }))] }), searchQuery && ((0, jsx_runtime_1.jsxs)("div", { className: "search-results-info", children: ["Showing ", filteredVideos.length, " of ", playlist.videoCount, " videos", searchQuery && ` for "${searchQuery}"`] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "playlist-videos-section", children: renderSearchResults() })] })] }));
};
exports.PlaylistDetailView = PlaylistDetailView;
// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
//# sourceMappingURL=PlaylistDetailView.js.map