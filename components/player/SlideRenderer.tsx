'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Slide } from '@/types';

interface SlideRendererProps {
    slide: Slide;
}

export default function SlideRenderer({ slide }: SlideRendererProps) {
    if (!slide) return null;

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {slide.type === 'image' && (
                        <img
                            src={slide.url}
                            alt="Slide"
                            className="w-full h-full object-cover"
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Optional Overlay/Metadata could go here */}
        </div>
    );
}
