'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import SlideRenderer from './player/SlideRenderer';
import QueueSidebar from './player/QueueSidebar';

interface PlayerViewProps {
    tvId: string;
    onReset: () => void;
}

export default function PlayerView({ tvId, onReset }: PlayerViewProps) {
    const { tvs, playlists, fetchData } = useStore();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Sync with Admin changes via Supabase Realtime
    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => {
                    console.log('Change received!', payload);
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Find configuration
    const tv = tvs.find(t => t.id === tvId);
    const playlist = playlists.find(p => p.id === tv?.assignedPlaylistId);

    // Auto-play logic
    useEffect(() => {
        if (!playlist || playlist.slides.length === 0) return;

        const currentSlide = playlist.slides[currentSlideIndex];
        if (!currentSlide) {
            // Reset if index out of bounds
            setCurrentSlideIndex(0);
            return;
        }

        const timer = setTimeout(() => {
            setCurrentSlideIndex((prev) => (prev + 1) % playlist.slides.length);
        }, currentSlide.duration * 1000);

        return () => clearTimeout(timer);
    }, [currentSlideIndex, playlist]);

    // Handle Missing Config
    if (!tv) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-xl font-bold mb-4">TV Configuration Not Found</p>
                <button
                    onClick={onReset}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                    Reset Configuration
                </button>
            </div>
        );
    }

    // Handle Aspect Ratio Container
    const aspectRatio = tv.resolution.width / tv.resolution.height;

    if (!playlist || playlist.slides.length === 0) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500 text-center p-8">
                <Loader2 size={48} className="animate-spin mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-zinc-300 mb-2">{tv.name}</h2>
                <p>Waiting for content...</p>
                <p className="text-sm mt-4 text-zinc-600">
                    ID: {tv.id} • {tv.resolution.width}x{tv.resolution.height}
                </p>
            </div>
        );
    }

    const currentSlide = playlist.slides[currentSlideIndex];
    const isQueueMode = tv.displayMode === 'queue';

    return (
        <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
            {isQueueMode ? (
                // Queue Mode Layout (Split)
                <div className="w-full h-full flex">
                    {/* Main Content Area (75%) */}
                    <div className="flex-1 relative bg-black border-r border-zinc-800">
                        <SlideRenderer slide={currentSlide} />

                        {/* Overlay Info */}
                        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md opacity-20 hover:opacity-100 transition-opacity">
                            {tv.name} • {tv.resolution.width}x{tv.resolution.height}
                        </div>
                    </div>

                    {/* Sidebar (25%) */}
                    <div className="w-[25%] max-w-sm h-full">
                        <QueueSidebar />
                    </div>
                </div>
            ) : (
                // Standard Playlist Mode
                <div
                    style={{
                        aspectRatio: `${tv.resolution.width}/${tv.resolution.height}`,
                        width: '100vw',
                        maxHeight: '100vh',
                    }}
                    className="relative shadow-2xl bg-black"
                >
                    <SlideRenderer slide={currentSlide} />

                    {/* Optional Debug Overlay */}
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md opacity-20 hover:opacity-100 transition-opacity">
                        {tv.name} • Slide {currentSlideIndex + 1}/{playlist.slides.length}
                    </div>
                </div>
            )}
        </div>
    );
}
