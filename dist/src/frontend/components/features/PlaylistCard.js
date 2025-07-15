"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistCard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const PlaylistCard = ({ playlist, viewMode, onClick, onEdit, onDelete, onDownload, }) => {
    const [showActions, setShowActions] = (0, react_1.useState)(false);
    const [imageError, setImageError] = (0, react_1.useState)(false);
    const handleCardClick = (e) => {
        // Don't trigger card click if clicking on action buttons
        if (e.target.closest('.playlist-actions')) {
            return;
        }
        onClick(playlist.id);
    };
    const handleImageError = () => {
        setImageError(true);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength) + '...';
    };
    const renderThumbnail = () => {
        if (imageError || !playlist.thumbnailUrl) {
            return ((0, jsx_runtime_1.jsx)("div", { className: "playlist-thumbnail-placeholder", children: (0, jsx_runtime_1.jsx)("span", { className: "playlist-icon", children: playlist.type === 'YOUTUBE' ? '📺' : '🎵' }) }));
        }
        return ((0, jsx_runtime_1.jsx)("img", { src: playlist.thumbnailUrl, alt: playlist.title, onError: handleImageError, loading: "lazy" }));
    };
    const renderActions = () => ((0, jsx_runtime_1.jsxs)("div", { className: `playlist-actions ${showActions ? 'show' : ''}`, onMouseLeave: () => setShowActions(false), children: [(0, jsx_runtime_1.jsx)("button", { className: "playlist-action-toggle", onClick: (e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                }, title: "More actions", children: "\u22EE" }), showActions && ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-actions-menu", children: [onEdit && ((0, jsx_runtime_1.jsxs)("button", { className: "action-item", onClick: (e) => {
                            e.stopPropagation();
                            onEdit(playlist.id);
                            setShowActions(false);
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "action-icon", children: "\u270F\uFE0F" }), "Edit Details"] })), onDownload && ((0, jsx_runtime_1.jsxs)("button", { className: "action-item", onClick: (e) => {
                            e.stopPropagation();
                            onDownload(playlist.id);
                            setShowActions(false);
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "action-icon", children: "\u2B07\uFE0F" }), "Download All"] })), onDelete && ((0, jsx_runtime_1.jsxs)("button", { className: "action-item action-item-danger", onClick: (e) => {
                            e.stopPropagation();
                            onDelete(playlist.id);
                            setShowActions(false);
                        }, children: [(0, jsx_runtime_1.jsx)("span", { className: "action-icon", children: "\uD83D\uDDD1\uFE0F" }), "Delete"] }))] }))] }));
    if (viewMode === 'list') {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-card playlist-card-list", onClick: handleCardClick, children: [(0, jsx_runtime_1.jsx)("div", { className: "playlist-thumbnail", children: renderThumbnail() }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-info", children: [(0, jsx_runtime_1.jsxs)("div", { className: "playlist-main-info", children: [(0, jsx_runtime_1.jsx)("h3", { className: "playlist-title", children: playlist.title }), (0, jsx_runtime_1.jsx)("p", { className: "playlist-description", children: truncateText(playlist.description, 100) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-meta", children: [(0, jsx_runtime_1.jsxs)("span", { className: "video-count", children: [playlist.videoCount, " videos"] }), (0, jsx_runtime_1.jsx)("span", { className: `playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`, children: playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom' }), (0, jsx_runtime_1.jsxs)("span", { className: "playlist-date", children: ["Updated ", formatDate(playlist.updatedAt)] })] })] }), renderActions()] }));
    }
    // Grid view
    return ((0, jsx_runtime_1.jsxs)("div", { className: "playlist-card playlist-card-grid", onClick: handleCardClick, children: [(0, jsx_runtime_1.jsxs)("div", { className: "playlist-thumbnail", children: [renderThumbnail(), (0, jsx_runtime_1.jsx)("div", { className: "playlist-overlay", children: (0, jsx_runtime_1.jsxs)("span", { className: "video-count-overlay", children: [playlist.videoCount, " videos"] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-info", children: [(0, jsx_runtime_1.jsx)("h3", { className: "playlist-title", title: playlist.title, children: truncateText(playlist.title, 40) }), playlist.description && ((0, jsx_runtime_1.jsx)("p", { className: "playlist-description", title: playlist.description, children: truncateText(playlist.description, 60) })), (0, jsx_runtime_1.jsxs)("div", { className: "playlist-meta", children: [(0, jsx_runtime_1.jsx)("span", { className: `playlist-type-badge playlist-type-${playlist.type.toLowerCase()}`, children: playlist.type === 'YOUTUBE' ? 'YouTube' : 'Custom' }), (0, jsx_runtime_1.jsx)("span", { className: "playlist-date", children: formatDate(playlist.updatedAt) })] })] }), renderActions()] }));
};
exports.PlaylistCard = PlaylistCard;
//# sourceMappingURL=PlaylistCard.js.map