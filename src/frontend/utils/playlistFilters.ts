import { Playlist } from '../components/features/PlaylistGrid';
import {
  SearchFilters,
  SortOptions,
} from '../components/features/SearchAndFilterBar';

/**
 * Filters playlists based on search criteria
 */
export function filterPlaylists(
  playlists: Playlist[],
  filters: SearchFilters,
): Playlist[] {
  return playlists.filter(playlist => {
    // Search filter
    if (filters.search) {
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

    // Type filter
    if (filters.type && filters.type !== 'all') {
      if (playlist.type !== filters.type) {
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

    // Video count range filter
    if (filters.videoCountRange) {
      const { min, max } = filters.videoCountRange;
      if (min !== undefined && playlist.videoCount < min) {
        return false;
      }
      if (max !== undefined && playlist.videoCount > max) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const playlistDate = new Date(playlist.updatedAt);

      if (start && playlistDate < new Date(start)) {
        return false;
      }
      if (end && playlistDate > new Date(end)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sorts playlists based on sort options
 */
export function sortPlaylists(
  playlists: Playlist[],
  sortOptions: SortOptions,
): Playlist[] {
  const { sortBy, sortOrder } = sortOptions;

  return [...playlists].sort((a, b) => {
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

      case 'video_count':
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
}

/**
 * Combines filtering and sorting operations
 */
export function filterAndSortPlaylists(
  playlists: Playlist[],
  filters: SearchFilters,
  sortOptions: SortOptions,
): Playlist[] {
  const filtered = filterPlaylists(playlists, filters);
  return sortPlaylists(filtered, sortOptions);
}

/**
 * Extracts unique tags from playlists
 */
export function extractAvailableTags(playlists: Playlist[]): string[] {
  const tagSet = new Set<string>();

  playlists.forEach(playlist => {
    playlist.tags.forEach(tag => {
      tagSet.add(tag.toLowerCase());
    });
  });

  return Array.from(tagSet).sort();
}

/**
 * Gets search suggestions based on playlist data
 */
export function getSearchSuggestions(
  playlists: Playlist[],
  query: string,
): string[] {
  if (!query || query.length < 2) return [];

  const suggestions = new Set<string>();
  const queryLower = query.toLowerCase();

  playlists.forEach(playlist => {
    // Title suggestions
    if (playlist.title.toLowerCase().includes(queryLower)) {
      suggestions.add(playlist.title);
    }

    // Tag suggestions
    playlist.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.add(tag);
      }
    });
  });

  return Array.from(suggestions).slice(0, 10);
}

/**
 * Validates filter values
 */
export function validateFilters(filters: SearchFilters): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate video count range
  if (filters.videoCountRange) {
    const { min, max } = filters.videoCountRange;
    if (min !== undefined && min < 0) {
      errors.push('Minimum video count cannot be negative');
    }
    if (max !== undefined && max < 0) {
      errors.push('Maximum video count cannot be negative');
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push('Minimum video count cannot be greater than maximum');
    }
  }

  // Validate date range
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    if (start && end && new Date(start) > new Date(end)) {
      errors.push('Start date cannot be after end date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a URL-safe string from filters for sharing/bookmarking
 */
export function filtersToUrlParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type);
  }

  if (filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
  }

  if (filters.videoCountRange) {
    if (filters.videoCountRange.min !== undefined) {
      params.set('minVideos', filters.videoCountRange.min.toString());
    }
    if (filters.videoCountRange.max !== undefined) {
      params.set('maxVideos', filters.videoCountRange.max.toString());
    }
  }

  if (filters.dateRange) {
    if (filters.dateRange.start) {
      params.set('startDate', filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      params.set('endDate', filters.dateRange.end);
    }
  }

  return params;
}

/**
 * Parses URL parameters back to filters
 */
export function urlParamsToFilters(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {
    search: params.get('search') || '',
    tags: params.get('tags') ? params.get('tags')!.split(',') : [],
  };

  const type = params.get('type');
  if (type === 'custom' || type === 'youtube') {
    filters.type = type;
  }

  const minVideos = params.get('minVideos');
  const maxVideos = params.get('maxVideos');
  if (minVideos || maxVideos) {
    filters.videoCountRange = {
      min: minVideos ? parseInt(minVideos) : undefined,
      max: maxVideos ? parseInt(maxVideos) : undefined,
    };
  }

  const startDate = params.get('startDate');
  const endDate = params.get('endDate');
  if (startDate || endDate) {
    filters.dateRange = {
      start: startDate || undefined,
      end: endDate || undefined,
    };
  }

  return filters;
}
