'use client';

import { useState, useEffect } from 'react';
import { getSettings } from '@/lib/store';

export default function FocusTracks() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    getSettings().then((s) => setUrl(s.focusVideoUrl));
  }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Focus</h2>
      {url ? (
        <div className="aspect-video glass rounded-xl overflow-hidden">
          <iframe src={url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      ) : (
        <div className="aspect-video glass rounded-xl flex items-center justify-center">
          <div className="text-center text-[#55556a]">
            <p className="text-lg mb-2">No video set</p>
            <p className="text-sm">Go to Settings to add a YouTube embed URL</p>
          </div>
        </div>
      )}
    </div>
  );
}
