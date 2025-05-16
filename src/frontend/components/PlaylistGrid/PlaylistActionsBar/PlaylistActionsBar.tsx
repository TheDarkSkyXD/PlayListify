import React from 'react';
import { Input } from '@/frontend/components/ui/input';
import { Button } from '@/frontend/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/frontend/components/ui/dropdown-menu';
import { Search, SlidersHorizontal, ArrowUpDown, Check, XCircle } from 'lucide-react';

export type PlaylistSortOption = 
  | 'name_asc' 
  | 'name_desc' 
  | 'date_added_newest' 
  | 'date_added_oldest'
  | 'item_count_most'
  | 'item_count_least';

export type PlaylistFilterSource = 'all' | 'youtube' | 'custom';

interface PlaylistActionsBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  currentSort: PlaylistSortOption;
  onSortChange: (sortOption: PlaylistSortOption) => void;
  
  currentFilterSource: PlaylistFilterSource;
  onFilterSourceChange: (filterSource: PlaylistFilterSource) => void;

  onClearFilters: () => void;
}

const sortOptions: { value: PlaylistSortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'date_added_newest', label: 'Date Added (Newest)' },
  { value: 'date_added_oldest', label: 'Date Added (Oldest)' },
  { value: 'item_count_most', label: 'Item Count (Most)' },
  { value: 'item_count_least', label: 'Item Count (Least)' },
];

const filterSourceOptions: { value: PlaylistFilterSource; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'custom', label: 'Custom' },
];

const PlaylistActionsBar: React.FC<PlaylistActionsBarProps> = ({
  searchQuery,
  onSearchChange,
  currentSort,
  onSortChange,
  currentFilterSource,
  onFilterSourceChange,
  onClearFilters,
}) => {

  const isAnyFilterActive = 
    searchQuery !== '' || 
    currentFilterSource !== 'all' || 
    currentSort !== 'date_added_newest';

  return (
    <div className="mb-4 p-4 bg-neutral-800/50 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
      {/* Search Input */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {currentFilterSource !== 'all' && <span className="ml-1 text-xs opacity-70">({filterSourceOptions.find(opt => opt.value === currentFilterSource)?.label})</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={currentFilterSource} onValueChange={(value) => onFilterSourceChange(value as PlaylistFilterSource)}>
              {filterSourceOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1.5">
              <ArrowUpDown className="h-4 w-4" />
              Sort
              <span className="ml-1 text-xs opacity-70">({sortOptions.find(opt => opt.value === currentSort)?.label})</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={currentSort} onValueChange={(value) => onSortChange(value as PlaylistSortOption)}>
              {sortOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Button */}
        {isAnyFilterActive && (
          <Button variant="ghost" onClick={onClearFilters} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <XCircle className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlaylistActionsBar; 