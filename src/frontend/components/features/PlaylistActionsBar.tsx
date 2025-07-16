import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Filter,
  Grid,
  List,
  Save,
  Search,
  SortAsc,
  SortDesc,
  Tag,
  X,
} from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { debounce } from '../../stores/store-utils';
import {
  usePlaylistFilters,
  usePlaylistSorting,
  usePlaylistUIStore,
  usePlaylistViewMode,
  type SortBy,
} from '../../stores/usePlaylistUIStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';

export interface PlaylistActionsBarProps {
  className?: string;
  onAddPlaylist?: () => void;
}

// Search Input Component
const SearchInput: React.FC = () => {
  const { search } = usePlaylistFilters();
  const { setSearch, addToSearchHistory } = usePlaylistUIStore();
  const [localSearch, setLocalSearch] = React.useState(search);

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () =>
      debounce((query: string) => {
        setSearch(query);
        if (query.trim()) {
          addToSearchHistory(query);
        }
      }, 300),
    [setSearch, addToSearchHistory],
  );

  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearch('');
  };

  return (
    <div className='relative max-w-md flex-1'>
      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
      <Input
        placeholder='Search playlists...'
        value={localSearch}
        onChange={e => handleSearchChange(e.target.value)}
        className='pl-10 pr-10'
      />
      {localSearch && (
        <Button
          variant='ghost'
          size='sm'
          className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0'
          onClick={clearSearch}
        >
          <X className='h-3 w-3' />
        </Button>
      )}
    </div>
  );
};

// Sort Controls Component
const SortControls: React.FC = () => {
  const { sortBy, sortOrder } = usePlaylistSorting();
  const { setSorting } = usePlaylistUIStore();

  const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Last Updated' },
    { value: 'song_count', label: 'Video Count' },
    { value: 'duration', label: 'Duration' },
  ];

  const handleSortChange = (newSortBy: SortBy) => {
    setSorting(newSortBy);
  };

  const toggleSortOrder = () => {
    setSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className='flex items-center gap-2'>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className='w-[140px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant='outline'
        size='sm'
        onClick={toggleSortOrder}
        className='px-2'
      >
        {sortOrder === 'asc' ? (
          <SortAsc className='h-4 w-4' />
        ) : (
          <SortDesc className='h-4 w-4' />
        )}
      </Button>
    </div>
  );
};

// View Mode Toggle Component
const ViewModeToggle: React.FC = () => {
  const viewMode = usePlaylistViewMode();
  const { setViewMode } = usePlaylistUIStore();

  return (
    <div className='flex items-center rounded-md border'>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => setViewMode('grid')}
        className='rounded-r-none border-r'
      >
        <Grid className='h-4 w-4' />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size='sm'
        onClick={() => setViewMode('list')}
        className='rounded-l-none'
      >
        <List className='h-4 w-4' />
      </Button>
    </div>
  );
};

// Advanced Filter Panel Component
const FilterPanel: React.FC = () => {
  const filters = usePlaylistFilters();
  const {
    setTags,
    addTag,
    removeTag,
    setPrivacyFilter,
    setSongCountRange,
    setDateRange,
    clearFilters,
    saveCurrentFilters,
    loadSavedFilters,
    deleteSavedFilters,
    hasActiveFilters,
  } = usePlaylistUIStore();

  const [newTag, setNewTag] = React.useState('');
  const [minSongs, setMinSongs] = React.useState(
    filters.minSongCount?.toString() || '',
  );
  const [maxSongs, setMaxSongs] = React.useState(
    filters.maxSongCount?.toString() || '',
  );
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined,
  );
  const [saveFilterName, setSaveFilterName] = React.useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleSongCountChange = () => {
    const min = minSongs ? parseInt(minSongs) : undefined;
    const max = maxSongs ? parseInt(maxSongs) : undefined;
    setSongCountRange(min, max);
  };

  const handleDateRangeChange = () => {
    setDateRange(
      dateFrom ? dateFrom.toISOString() : undefined,
      dateTo ? dateTo.toISOString() : undefined,
    );
  };

  React.useEffect(() => {
    handleSongCountChange();
  }, [minSongs, maxSongs]);

  React.useEffect(() => {
    handleDateRangeChange();
  }, [dateFrom, dateTo]);

  const handleSaveFilters = () => {
    if (saveFilterName.trim()) {
      saveCurrentFilters(saveFilterName.trim());
      setSaveFilterName('');
    }
  };

  return (
    <div className='space-y-6 p-4'>
      {/* Tags Filter */}
      <div className='space-y-3'>
        <Label className='text-sm font-medium'>Tags</Label>
        <div className='flex gap-2'>
          <Input
            placeholder='Add tag...'
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            className='flex-1'
          />
          <Button size='sm' onClick={handleAddTag}>
            <Tag className='h-4 w-4' />
          </Button>
        </div>
        {filters.tags.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {filters.tags.map(tag => (
              <Badge key={tag} variant='secondary' className='gap-1'>
                {tag}
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-3 w-3 p-0'
                  onClick={() => removeTag(tag)}
                >
                  <X className='h-2 w-2' />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Privacy Filter */}
      <div className='space-y-3'>
        <Label className='text-sm font-medium'>Privacy</Label>
        <div className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='all-privacy'
              checked={filters.isPrivate === undefined}
              onCheckedChange={() => setPrivacyFilter(undefined)}
            />
            <Label htmlFor='all-privacy' className='text-sm'>
              All playlists
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='public-only'
              checked={filters.isPrivate === false}
              onCheckedChange={() => setPrivacyFilter(false)}
            />
            <Label htmlFor='public-only' className='text-sm'>
              Public only
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='private-only'
              checked={filters.isPrivate === true}
              onCheckedChange={() => setPrivacyFilter(true)}
            />
            <Label htmlFor='private-only' className='text-sm'>
              Private only
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Video Count Range */}
      <div className='space-y-3'>
        <Label className='text-sm font-medium'>Video Count</Label>
        <div className='flex gap-2'>
          <Input
            placeholder='Min'
            type='number'
            value={minSongs}
            onChange={e => setMinSongs(e.target.value)}
            className='flex-1'
          />
          <Input
            placeholder='Max'
            type='number'
            value={maxSongs}
            onChange={e => setMaxSongs(e.target.value)}
            className='flex-1'
          />
        </div>
      </div>

      <Separator />

      {/* Date Range */}
      <div className='space-y-3'>
        <Label className='text-sm font-medium'>Date Range</Label>
        <div className='flex gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'flex-1 justify-start text-left font-normal',
                  !dateFrom && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0'>
              <Calendar
                mode='single'
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'flex-1 justify-start text-left font-normal',
                  !dateTo && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {dateTo ? format(dateTo, 'PPP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0'>
              <Calendar
                mode='single'
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* Save/Load Filters */}
      <div className='space-y-3'>
        <Label className='text-sm font-medium'>Save Filters</Label>
        <div className='flex gap-2'>
          <Input
            placeholder='Filter name...'
            value={saveFilterName}
            onChange={e => setSaveFilterName(e.target.value)}
            className='flex-1'
          />
          <Button
            size='sm'
            onClick={handleSaveFilters}
            disabled={!saveFilterName.trim() || !hasActiveFilters()}
          >
            <Save className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters() && (
        <Button
          variant='outline'
          onClick={clearFilters}
          className='w-full'
          size='sm'
        >
          <X className='mr-2 h-4 w-4' />
          Clear All Filters
        </Button>
      )}
    </div>
  );
};

// Main Actions Bar Component
export const PlaylistActionsBar: React.FC<PlaylistActionsBarProps> = ({
  className,
  onAddPlaylist,
}) => {
  const { showFilterPanel, toggleFilterPanel, hasActiveFilters } =
    usePlaylistUIStore();
  const activeFilterCount = usePlaylistUIStore(
    state => state.activeFilterCount,
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Actions Row */}
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-4'>
          <SearchInput />
          <SortControls />
          <Popover open={showFilterPanel} onOpenChange={toggleFilterPanel}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className={cn(
                  'relative',
                  hasActiveFilters() && 'border-primary text-primary',
                )}
              >
                <Filter className='mr-2 h-4 w-4' />
                Filter
                {activeFilterCount > 0 && (
                  <Badge
                    variant='secondary'
                    className='ml-2 h-5 w-5 rounded-full p-0 text-xs'
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-80' align='start'>
              <FilterPanel />
            </PopoverContent>
          </Popover>
        </div>

        <div className='flex items-center gap-2'>
          <ViewModeToggle />
          {onAddPlaylist && (
            <Button onClick={onAddPlaylist}>
              <Search className='mr-2 h-4 w-4' />
              Add Playlist
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Active filters:</span>
          <ActiveFiltersDisplay />
        </div>
      )}
    </div>
  );
};

// Active Filters Display Component
const ActiveFiltersDisplay: React.FC = () => {
  const filters = usePlaylistFilters();
  const {
    setSearch,
    removeTag,
    setPrivacyFilter,
    setSongCountRange,
    setDateRange,
  } = usePlaylistUIStore();

  const activeFilters: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      onRemove: () => setSearch(''),
    });
  }

  filters.tags.forEach(tag => {
    activeFilters.push({
      key: `tag-${tag}`,
      label: `Tag: ${tag}`,
      onRemove: () => removeTag(tag),
    });
  });

  if (filters.isPrivate !== undefined) {
    activeFilters.push({
      key: 'privacy',
      label: `Privacy: ${filters.isPrivate ? 'Private' : 'Public'}`,
      onRemove: () => setPrivacyFilter(undefined),
    });
  }

  if (
    filters.minSongCount !== undefined ||
    filters.maxSongCount !== undefined
  ) {
    const min = filters.minSongCount || 0;
    const max = filters.maxSongCount || '∞';
    activeFilters.push({
      key: 'song-count',
      label: `Videos: ${min} - ${max}`,
      onRemove: () => setSongCountRange(undefined, undefined),
    });
  }

  if (filters.dateRange) {
    const from = filters.dateRange.start
      ? format(new Date(filters.dateRange.start), 'MMM dd')
      : '';
    const to = filters.dateRange.end
      ? format(new Date(filters.dateRange.end), 'MMM dd')
      : '';
    activeFilters.push({
      key: 'date-range',
      label: `Date: ${from} - ${to}`,
      onRemove: () => setDateRange(undefined, undefined),
    });
  }

  return (
    <>
      {activeFilters.map(filter => (
        <Badge key={filter.key} variant='secondary' className='gap-1'>
          {filter.label}
          <Button
            variant='ghost'
            size='sm'
            className='h-3 w-3 p-0'
            onClick={filter.onRemove}
          >
            <X className='h-2 w-2' />
          </Button>
        </Badge>
      ))}
    </>
  );
};
