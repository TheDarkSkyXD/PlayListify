import React, { useState } from 'react';
import { useCreatePlaylist, useImportPlaylist } from '../../../services/queryHooks';

function CreatePlaylistForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  const createPlaylistMutation = useCreatePlaylist();
  const importPlaylistMutation = useImportPlaylist();

  const resetForm = () => {
    setName('');
    setDescription('');
    setUrl('');
    setIsImportMode(false);
    setIsFormOpen(false);
  };

  // Separate submission logic from event handling
  function submitForm() {
    if (isImportMode) {
      if (!url) return;
      importPlaylistMutation.mutate(url, {
        onSuccess: () => resetForm()
      });
    } else {
      if (!name) return;
      createPlaylistMutation.mutate(
        {
          name,
          description,
          videos: [],
        },
        {
          onSuccess: () => resetForm()
        }
      );
    }
  }

  // Display loading state during mutation
  const isLoading = createPlaylistMutation.isPending || importPlaylistMutation.isPending;

  // Show an error message if there's an error
  const error = createPlaylistMutation.error || importPlaylistMutation.error;

  // If the form is closed, only show the button
  if (!isFormOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded transition-colors"
        >
          Create New Playlist
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isImportMode ? 'Import Playlist' : 'Create Playlist'}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsImportMode(false)}
            className={`px-3 py-1 rounded text-sm ${
              !isImportMode
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setIsImportMode(true)}
            className={`px-3 py-1 rounded text-sm ${
              isImportMode
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Import
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
        {isImportMode ? (
          <div className="mb-4">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              YouTube Playlist URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="w-full p-2 border rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Playlist Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : isImportMode ? 'Import' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePlaylistForm; 