// src/frontend/utils/playlist-filters.ts

import type { Playlist } from '../components/features/PlaylistGrid';
import type {
  PlaylistFilters,
  SortBy,
  SortOrder,
} from '../stores/usePlaylistUIStore';

/**
 * Filter and sort playlists based on the provided filters and sorting options
 */
export function filterAndSortPlaylists(
  playlists: Playlist[],
  filters: PlaylistFilters,
  sortBy: SortBy,
  sortOrder: SortOrder,
): Playlist[] {
  // Apply filters
  let filteredPlaylists = playlists.filter(playlist => {
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const matchesTitle = playlist.title.toLowerCase().includes(searchTerm);
      const matchesDescription = playlist.description
        ?.toLowerCase()
        .includes(searchTerm);
      const matchesTags = playlist.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm),
      );

      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(filterTag =>
        playlist.tags.some(playlistTag =>
          playlistTag.toLowerCase().includes(filterTag.toLowerCase()),
        ),
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Privacy filter
    if (filters.isPrivate !== undefined) {
      if (playlist.isPrivate !== filters.isPrivate) {
        return false;
      }
    }

    // Video count range filter
    if (
      filters.minSongCount !== undefined &&
      playlist.videoCount < filters.minSongCount
    ) {
      return false;
    }
    if (
      filters.maxSongCount !== undefined &&
      playlist.videoCount > filters.maxSongCount
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const playlistDate = new Date(playlist.updatedAt);

      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (playlistDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        if (playlistDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });

  // Apply sorting
  filteredPlaylists.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'created_at':
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated_at':
        comparison =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'song_count':
        comparison = a.videoCount - b.videoCount;
        break;
      case 'duration':
        comparison = a.totalDuration - b.totalDuration;
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filteredPlaylists;
}

/**
 * Paginate playlists array
 */
export function paginatePlaylists(
  playlists: Playlist[],
  currentPage: number,
  itemsPerPage: number,
): Playlist[] {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return playlists.slice(startIndex, endIndex);
}

/**
 * Get pagination information
 */
export function getPaginationInfo(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number,
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems),
  };
}

/**
 * Generate filter summary text
 */
export function getFilterSummary(
  filters: PlaylistFilters,
  totalCount: number,
  filteredCount: number,
): string {
  if (filteredCount === totalCount) {
    return `Showing all ${totalCount} playlists`;
  }

  const activeFilters: string[] = [];

  if (filters.search.trim()) {
    activeFilters.push(`search: "${filters.search}"`);
  }

  if (filters.tags.length > 0) {
    activeFilters.push(`tags: ${filters.tags.join(', ')}`);
  }

  if (filters.isPrivate !== undefined) {
    activeFilters.push(`privacy: ${filters.isPrivate ? 'private' : 'public'}`);
  }

  if (
    filters.minSongCount !== undefined ||
    filters.maxSongCount !== undefined
  ) {
    const min = filters.minSongCount || 0;
    const max = filters.maxSongCount || '∞';
    activeFilters.push(`videos: ${min}-${max}`);
  }

  if (filters.dateRange?.start || filters.dateRange?.end) {
    const start = filters.dateRange.start
      ? new Date(filters.dateRange.start).toLocaleDateString()
      : '';
    const end = filters.dateRange.end
      ? new Date(filters.dateRange.end).toLocaleDateString()
      : '';
    activeFilters.push(`date: ${start || 'any'} to ${end || 'any'}`);
  }

  const filterText =
    activeFilters.length > 0 ? ` (${activeFilters.join(', ')})` : '';
  return `Showing ${filteredCount} of ${totalCount} playlists${filterText}`;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: PlaylistFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.tags.length > 0 ||
    filters.isPrivate !== undefined ||
    filters.minSongCount !== undefined ||
    filters.maxSongCount !== undefined ||
    filters.dateRange?.start !== undefined ||
    filters.dateRange?.end !== undefined
  );
}

/**
 * Clear all filters
 */
export function getEmptyFilters(): PlaylistFilters {
  return {
    search: '',
    tags: [],
    isPrivate: undefined,
    minSongCount: undefined,
    maxSongCount: undefined,
    dateRange: undefined,
  };
}
