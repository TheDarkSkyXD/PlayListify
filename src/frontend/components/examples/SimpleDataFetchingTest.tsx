/**
 * Simple test component for data fetching and state management
 *
 * This component demonstrates the core functionality without relying on
 * backend services that may not be fully implemented yet.
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { useAppStore } from "../../stores/app-store";
import { useDependencyStore } from "../../stores/dependency-store";

export const SimpleDataFetchingTest: React.FC = () => {
  // Zustand stores
  const {
    theme,
    setTheme,
    addNotification,
    notifications,
    removeNotification,
    clearNotifications,
    isLoading,
    setLoading,
    toggleSidebar,
    isSidebarOpen,
  } = useAppStore();

  const {
    isInstalling,
    allReady,
    dependencies,
    startInstallation,
    completeInstallation,
    setAllReady,
  } = useDependencyStore();

  const handleThemeToggle = () => {
    const newTheme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(newTheme);
    addNotification({
      type: "success",
      title: "Theme Updated",
      message: `Theme changed to ${newTheme}`,
    });
  };

  const handleTestLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addNotification({
        type: "info",
        title: "Loading Test",
        message: "Loading state test completed",
      });
    }, 2000);
  };

  const handleTestInstallation = () => {
    startInstallation(["ytdlp", "ffmpeg"]);

    // Simulate installation progress
    setTimeout(() => {
      completeInstallation("ytdlp", true);
    }, 1500);

    setTimeout(() => {
      completeInstallation("ffmpeg", true);
      setAllReady(true);
      addNotification({
        type: "success",
        title: "Installation Complete",
        message: "All dependencies installed successfully",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Store Test */}
        <Card>
          <CardHeader>
            <CardTitle>App Store Test</CardTitle>
            <CardDescription>
              Test Zustand app store functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Current Theme:</span>
              <span className="capitalize font-medium">{theme}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Sidebar Open:</span>
              <span className="font-medium">
                {isSidebarOpen ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Loading:</span>
              <span className="font-medium">{isLoading ? "Yes" : "No"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Notifications:</span>
              <span className="font-medium">{notifications.length}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleThemeToggle} size="sm">
                Toggle Theme
              </Button>
              <Button onClick={toggleSidebar} size="sm" variant="outline">
                Toggle Sidebar
              </Button>
              <Button onClick={handleTestLoading} size="sm" variant="outline">
                Test Loading
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dependency Store Test */}
        <Card>
          <CardHeader>
            <CardTitle>Dependency Store Test</CardTitle>
            <CardDescription>Test dependency management store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>All Ready:</span>
              <span
                className={`font-medium ${allReady ? "text-green-600" : "text-red-600"}`}
              >
                {allReady ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Installing:</span>
              <span className="font-medium">{isInstalling ? "Yes" : "No"}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>yt-dlp:</span>
                <span
                  className={`text-sm ${dependencies.ytdlp.installed ? "text-green-600" : "text-red-600"}`}
                >
                  {dependencies.ytdlp.installed ? "Installed" : "Not Installed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>FFmpeg:</span>
                <span
                  className={`text-sm ${dependencies.ffmpeg.installed ? "text-green-600" : "text-red-600"}`}
                >
                  {dependencies.ffmpeg.installed
                    ? "Installed"
                    : "Not Installed"}
                </span>
              </div>
            </div>

            <Button
              onClick={handleTestInstallation}
              disabled={isInstalling}
              size="sm"
              className="w-full"
            >
              {isInstalling ? "Installing..." : "Test Installation"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Display */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications ({notifications.length})</CardTitle>
            <CardDescription>
              Current notifications in the store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      notification.type === "success"
                        ? "bg-green-100 text-green-800"
                        : notification.type === "error"
                          ? "bg-red-100 text-red-800"
                          : notification.type === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {notification.type}
                  </span>
                  <Button
                    onClick={() => removeNotification(notification.id)}
                    size="sm"
                    variant="ghost"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
            <Button
              onClick={clearNotifications}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear All Notifications
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Store State Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Store State Debug</CardTitle>
          <CardDescription>Raw store state for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">App Store State</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(
                  {
                    theme,
                    isLoading,
                    isSidebarOpen,
                    notificationCount: notifications.length,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dependency Store State</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(
                  {
                    allReady,
                    isInstalling,
                    ytdlpInstalled: dependencies.ytdlp.installed,
                    ffmpegInstalled: dependencies.ffmpeg.installed,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
