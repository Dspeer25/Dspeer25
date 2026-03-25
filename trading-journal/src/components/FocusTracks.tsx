'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/lib/store';

export default function FocusTracks() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const settings = getSettings();
    setUrl(settings.focusVideoUrl);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Focus</h2>
      {url ? (
        <div className="aspect-video bg-bg-secondary rounded-lg overflow-hidden border border-border-primary">
          <iframe
            src={url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video bg-bg-secondary rounded-lg border border-border-primary flex items-center justify-center">
          <div className="text-center text-text-muted">
            <p className="text-lg mb-2">No video set</p>
            <p className="text-sm">Go to Settings to add a YouTube embed URL</p>
          </div>
        </div>
      )}
    </div>
  );
}
