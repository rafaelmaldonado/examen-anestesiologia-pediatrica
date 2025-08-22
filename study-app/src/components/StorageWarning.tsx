'use client';

import { useEffect, useState } from 'react';

export default function StorageWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);

  useEffect(() => {
    // Check if localStorage is accessible
    try {
      if (typeof window !== 'undefined') {
        const test = '__storage_test__';
        window.localStorage.setItem(test, test);
        window.localStorage.removeItem(test);
        setStorageBlocked(false);
      }
    } catch (e) {
      setStorageBlocked(true);
      setShowWarning(true);
    }
  }, []);

  if (!showWarning || !storageBlocked) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600/90 backdrop-blur-sm border-b border-orange-500/30 p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Storage Access Limited</p>
              <p className="text-sm text-orange-100">
                Your browser's privacy settings are blocking storage access. Some features may not work properly.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium">To fix this:</p>
              <ul className="text-xs text-orange-100 mt-1">
                <li>• Disable "Prevent cross-site tracking"</li>
                <li>• Allow cookies for this site</li>
                <li>• Refresh the page</li>
              </ul>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-white hover:text-orange-200 text-xl font-bold"
              aria-label="Close warning"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
