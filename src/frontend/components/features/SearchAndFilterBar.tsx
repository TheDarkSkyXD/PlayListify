import { Filter, Grid, List, Search, SortAsc, SortDesc, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface SearchFilters {
  search: string;
  tags: string[];
  type?: 'all' | 'custom' | 'youtube';
  dateRange?: {
    start?: string;
    end?: string;
  };
  videoCountRange?: {
    min?: number;
    max?: number;
  };
}

export interface SortOptions {
  sortBy: 'name' | 'created_at' | 'updated_at' | 'video_count' | 'duration';
  sortOrder: 'asc' | 'desc';
}

export interface SearchAndFilterBarProps {
  filters: SearchFilters;
  sortOptions: SortOptions;
  viewMode: 'grid' | 'list';
  availableTags: string[];
  totalResults: number;
  isLoading?: boolean;
  onFiltersChange: (filters: SearchFilters) => void;
  onSortChange: (sort: SortOptions) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onClearFilters: () => void;
  className?: string;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  filters,
  sortOptions,
  viewMode,
  availableTags,
  totalResults,
  isLoading = false,
  onFiltersChange,
  onSortChange,
  onViewModeChange,
  onClearFilters,
  className,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch });
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  // Sync search input with external filter changes
  useEffect(() => {
    if (filters.search !== searchInput) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const handleTagAdd = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();
      if (trimmedTag && !filters.tags.includes(trimmedTag)) {
        onFiltersChange({
          ...filters,
          tags: [...filters.tags, trimmedTag],
        });
      }
      setTagInput('');
    },
    [filters, onFiltersChange],
  );

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      onFiltersChange({
        ...filters,
        tags: filters.tags.filter(tag => tag !== tagToRemove),
      });
    },
    [filters, onFiltersChange],
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      onFiltersChange({
        ...filters,
        type: type === 'all' ? undefined : (type as 'custom' | 'youtube'),
      });
    },
    [filters, onFiltersChange],
  );

  const handleDateRangeChange = useCallback(
    (start?: string, end?: string) => {
      onFiltersChange({
        ...filters,
        dateRange: start || end ? { start, end } : undefined,
      });
    },
    [filters, onFiltersChange],
  );

  const handleVideoCountRangeChange = useCallback(
    (min?: number, max?: number) => {
      onFiltersChange({
        ...filters,
        videoCountRange:
          min !== undefined || max !== undefined ? { min, max } : undefined,
      });
    },
    [filters, onFiltersChange],
  );

  const handleSortChange = useCallback(
    (field: string) => {
      const newSortBy = field as SortOptions['sortBy'];
      const newSortOrder =
        sortOptions.sortBy === newSortBy && sortOptions.sortOrder === 'asc'
          ? 'desc'
          : 'asc';

      onSortChange({ sortBy: newSortBy, sortOrder: newSortOrder });
    },
    [sortOptions, onSortChange],
  );

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.tags.length > 0) count++;
    if (filters.type) count++;
    if (filters.dateRange) count++;
    if (filters.videoCountRange) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search and Controls Row */}
      <div className='flex flex-wrap items-center gap-4'>
        {/* Search Input */}
        <div className='relative min-w-[300px] flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
          <Input
            placeholder='Search playlists...'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className='pl-10 pr-10'
            disabled={isLoading}
          />
          {searchInput && (
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0'
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ ...filters, search: '' });
              }}
            >
              <X className='h-3 w-3' />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <Popover
          open={showAdvancedFilters}
          onOpenChange={setShowAdvancedFilters}
        >
          <PopoverTrigger asChild>
            <Button variant='outline' className='relative'>
              <Filter className='mr-2 h-4 w-4' />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-2 flex h-5 w-5 items-center justify-center p-0 text-xs'
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-80' align='start'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onClearFilters}
                    className='text-xs'
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Playlist Type Filter */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Type</label>
                <Select
                  value={filters.type || 'all'}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='custom'>Custom</SelectItem>
                    <SelectItem value='youtube'>YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags Filter */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tags</label>
                <div className='flex gap-2'>
                  <Input
                    placeholder='Add tag...'
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(tagInput);
                      }
                    }}
                    className='flex-1'
                  />
                  <Button
                    size='sm'
                    onClick={() => handleTagAdd(tagInput)}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {/* Available Tags */}
                {availableTags.length > 0 && (
                  <div className='space-y-2'>
                    <div className='text-xs text-muted-foreground'>
                      Available tags:
                    </div>
                    <div className='flex flex-wrap gap-1'>
                      {availableTags
                        .filter(tag => !filters.tags.includes(tag))
                        .slice(0, 10)
                        .map(tag => (
                          <Button
                            key={tag}
                            variant='outline'
                            size='sm'
                            className='h-6 text-xs'
                            onClick={() => handleTagAdd(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Selected Tags */}
                {filters.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {filters.tags.map(tag => (
                      <Badge key={tag} variant='secondary' className='text-xs'>
                        {tag}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='ml-1 h-3 w-3 p-0'
                          onClick={() => handleTagRemove(tag)}
                        >
                          <X className='h-2 w-2' />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Count Range */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Video Count</label>
                <div className='flex gap-2'>
                  <Input
                    type='number'
                    placeholder='Min'
                    value={filters.videoCountRange?.min || ''}
                    onChange={e => {
                      const min = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      handleVideoCountRangeChange(
                        min,
                        filters.videoCountRange?.max,
                      );
                    }}
                    className='flex-1'
                  />
                  <Input
                    type='number'
                    placeholder='Max'
                    value={filters.videoCountRange?.max || ''}
                    onChange={e => {
                      const max = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      handleVideoCountRangeChange(
                        filters.videoCountRange?.min,
                        max,
                      );
                    }}
                    className='flex-1'
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Date Range</label>
                <div className='flex gap-2'>
                  <Input
                    type='date'
                    value={filters.dateRange?.start || ''}
                    onChange={e => {
                      handleDateRangeChange(
                        e.target.value || undefined,
                        filters.dateRange?.end,
                      );
                    }}
                    className='flex-1'
                  />
                  <Input
                    type='date'
                    value={filters.dateRange?.end || ''}
                    onChange={e => {
                      handleDateRangeChange(
                        filters.dateRange?.start,
                        e.target.value || undefined,
                      );
                    }}
                    className='flex-1'
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Dropdown */}
        <Select
          value={`${sortOptions.sortBy}-${sortOptions.sortOrder}`}
          onValueChange={value => {
            const [sortBy, sortOrder] = value.split('-') as [
              SortOptions['sortBy'],
              SortOptions['sortOrder'],
            ];
            onSortChange({ sortBy, sortOrder });
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='name-asc'>Name A-Z</SelectItem>
            <SelectItem value='name-desc'>Name Z-A</SelectItem>
            <SelectItem value='updated_at-desc'>Recently Updated</SelectItem>
            <SelectItem value='updated_at-asc'>Oldest Updated</SelectItem>
            <SelectItem value='created_at-desc'>Recently Created</SelectItem>
            <SelectItem value='created_at-asc'>Oldest Created</SelectItem>
            <SelectItem value='video_count-desc'>Most Videos</SelectItem>
            <SelectItem value='video_count-asc'>Fewest Videos</SelectItem>
            <SelectItem value='duration-desc'>Longest Duration</SelectItem>
            <SelectItem value='duration-asc'>Shortest Duration</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className='flex rounded-md border'>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onViewModeChange('grid')}
            className='rounded-r-none'
          >
            <Grid className='h-4 w-4' />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => onViewModeChange('list')}
            className='rounded-l-none'
          >
            <List className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Active filters:</span>

          {filters.search && (
            <Badge variant='secondary' className='text-xs'>
              Search: "{filters.search}"
              <Button
                variant='ghost'
                size='sm'
                className='ml-1 h-3 w-3 p-0'
                onClick={() => onFiltersChange({ ...filters, search: '' })}
              >
                <X className='h-2 w-2' />
              </Button>
            </Badge>
          )}

          {filters.type && (
            <Badge variant='secondary' className='text-xs'>
              Type: {filters.type}
              <Button
                variant='ghost'
                size='sm'
                className='ml-1 h-3 w-3 p-0'
                onClick={() => onFiltersChange({ ...filters, type: undefined })}
              >
                <X className='h-2 w-2' />
              </Button>
            </Badge>
          )}

          {filters.tags.map(tag => (
            <Badge key={tag} variant='secondary' className='text-xs'>
              Tag: {tag}
              <Button
                variant='ghost'
                size='sm'
                className='ml-1 h-3 w-3 p-0'
                onClick={() => handleTagRemove(tag)}
              >
                <X className='h-2 w-2' />
              </Button>
            </Badge>
          ))}

          {filters.videoCountRange && (
            <Badge variant='secondary' className='text-xs'>
              Videos: {filters.videoCountRange.min || 0}-
              {filters.videoCountRange.max || '∞'}
              <Button
                variant='ghost'
                size='sm'
                className='ml-1 h-3 w-3 p-0'
                onClick={() =>
                  onFiltersChange({ ...filters, videoCountRange: undefined })
                }
              >
                <X className='h-2 w-2' />
              </Button>
            </Badge>
          )}

          {filters.dateRange && (
            <Badge variant='secondary' className='text-xs'>
              Date: {filters.dateRange.start || '∞'} -{' '}
              {filters.dateRange.end || '∞'}
              <Button
                variant='ghost'
                size='sm'
                className='ml-1 h-3 w-3 p-0'
                onClick={() =>
                  onFiltersChange({ ...filters, dateRange: undefined })
                }
              >
                <X className='h-2 w-2' />
              </Button>
            </Badge>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={onClearFilters}
            className='text-xs'
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <span>
          {isLoading
            ? 'Loading...'
            : `${totalResults} playlist${totalResults !== 1 ? 's' : ''} found`}
        </span>

        {sortOptions && (
          <span className='flex items-center gap-1'>
            Sorted by {sortOptions.sortBy.replace('_', ' ')}
            {sortOptions.sortOrder === 'asc' ? (
              <SortAsc className='h-3 w-3' />
            ) : (
              <SortDesc className='h-3 w-3' />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
