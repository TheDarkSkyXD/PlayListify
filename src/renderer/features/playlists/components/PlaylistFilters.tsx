import React, { useState } from 'react';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../../components/ui/popover';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Search, Tag, Filter, X, SlidersHorizontal } from 'lucide-react';

export interface FilterOptions {
  search: string;
  sources: string[];
  tags: string[];
}

interface PlaylistFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableTags: string[];
  availableSources: string[];
  totalPlaylists: number;
}

const PlaylistFilters: React.FC<PlaylistFiltersProps> = ({
  onFilterChange,
  availableTags = [],
  availableSources = ['youtube', 'local', 'other'],
  totalPlaylists
}) => {
  const [search, setSearch] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    
    onFilterChange({
      search: newSearch,
      sources: selectedSources,
      tags: selectedTags
    });
  };

  // Handle source selection
  const handleSourceToggle = (source: string) => {
    const updatedSources = selectedSources.includes(source)
      ? selectedSources.filter(s => s !== source)
      : [...selectedSources, source];
    
    setSelectedSources(updatedSources);
    
    onFilterChange({
      search,
      sources: updatedSources,
      tags: selectedTags
    });
  };

  // Handle tag selection
  const handleTagToggle = (tag: string) => {
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(updatedTags);
    
    onFilterChange({
      search,
      sources: selectedSources,
      tags: updatedTags
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedSources([]);
    setSelectedTags([]);
    
    onFilterChange({
      search: '',
      sources: [],
      tags: []
    });
  };

  // Determine if any filters are active
  const hasActiveFilters = search !== '' || selectedSources.length > 0 || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Input 
            placeholder="Search playlists..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Source Filter */}
          <Popover open={showSourceFilter} onOpenChange={setShowSourceFilter}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Source</span>
                {selectedSources.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedSources.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filter by source</h4>
                <div className="space-y-1">
                  {availableSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`source-${source}`} 
                        checked={selectedSources.includes(source)}
                        onCheckedChange={() => handleSourceToggle(source)}
                      />
                      <Label htmlFor={`source-${source}`} className="capitalize">
                        {source}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <Popover open={showTagFilter} onOpenChange={setShowTagFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>Tag</span>
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Filter by tag</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tag-${tag}`} 
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                        />
                        <Label htmlFor={`tag-${tag}`}>
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Advanced Filters Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 flex items-center gap-1"
            onClick={() => {
              // This would open an advanced filters dialog in a real implementation
              // Could include date filters, duration filters, etc.
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Advanced</span>
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-10 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              <span>Clear filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Selected filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedSources.map((source) => (
            <Badge 
              key={`selected-source-${source}`} 
              variant="secondary"
              className="capitalize flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              {source}
              <button 
                className="ml-1 hover:text-primary inline-flex items-center" 
                onClick={() => handleSourceToggle(source)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {selectedTags.map((tag) => (
            <Badge 
              key={`selected-tag-${tag}`} 
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <button 
                className="ml-1 hover:text-primary inline-flex items-center" 
                onClick={() => handleTagToggle(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {search && (
            <Badge 
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Search className="h-3 w-3" />
              "{search}"
              <button 
                className="ml-1 hover:text-primary inline-flex items-center" 
                onClick={() => {
                  setSearch('');
                  onFilterChange({
                    search: '',
                    sources: selectedSources,
                    tags: selectedTags
                  });
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistFilters; 