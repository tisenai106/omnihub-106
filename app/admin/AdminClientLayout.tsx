'use client';

import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';

export default function AdminClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen mesh-bg text-zinc-100 font-sans selection:bg-blue-500/30">
            <Sidebar />

            {/* Main Content Area - indented to right of fixed sidebar */}
            <main className="ml-80 min-h-screen p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-7xl mx-auto pt-4"
                >
                    {children}
                </motion.div>
            </main>

            {/* Ambient background glow elements */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        </div>
    );
}
