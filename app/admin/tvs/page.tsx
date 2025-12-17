'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Trash2, Monitor, Settings2, PlayCircle, Smartphone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TV, Orientation } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';

export default function TVManagementPage() {
    const { tvs, playlists, addTV, removeTV, assignPlaylistToTV, fetchData } = useStore();
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Form State
    const [newName, setNewName] = useState('');
    const [newLocation, setNewLocation] = useState('');


    const [newSizeInches, setNewSizeInches] = useState<number | undefined>(undefined);
    const [newOrientation, setNewOrientation] = useState<Orientation>('landscape');

    const handleAddTV = async (e: React.FormEvent) => {
        e.preventDefault();
        const newTV = {
            name: newName,
            location: newLocation,

            resolution: newOrientation === 'landscape' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 },
            orientation: newOrientation,

            assignedPlaylistId: null,
            size_inches: newSizeInches
        };
        await addTV(newTV);
        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setNewName('');
        setNewLocation('');

        setNewSizeInches(undefined);
        setNewOrientation('landscape');
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Displays</h2>
                    <p className="text-zinc-400 mt-2">Manage your physical screens.</p>
                </div>
                <GlowButton onClick={() => setIsAdding(true)} icon={Plus}>
                    Register Display
                </GlowButton>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {tvs.map((tv, idx) => (
                        <motion.div
                            key={tv.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <GlassCard className="relative group">
                                <div className="flex items-start gap-5">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/5 shadow-inner flex items-center justify-center ${tv.orientation === 'portrait' ? 'aspect-[9/16] h-24' : 'aspect-video w-32'}`}>
                                        <Monitor className="text-zinc-500" size={32} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-xl text-white">{tv.name}</h3>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <p className="text-zinc-500 text-sm">{tv.location}</p>
                                                    {tv.size_inches && (
                                                        <Badge>{tv.size_inches}"</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeTV(tv.id)}
                                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex gap-2 mb-4">
                                            <Badge>{tv.resolution.width}x{tv.resolution.height}</Badge>
                                            <Badge>{tv.orientation}</Badge>
                                        </div>

                                        <div className="relative w-full mb-3">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <PlayCircle size={18} className="text-blue-400" />
                                            </div>
                                            <select
                                                value={tv.assignedPlaylistId || ''}
                                                onChange={(e) => assignPlaylistToTV(tv.id, e.target.value || null)}
                                                className="w-full appearance-none bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-10 text-sm text-zinc-300 outline-none hover:bg-white/10 hover:border-white/20 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                            >
                                                <option value="" className="bg-zinc-900 text-zinc-500">No Content Assigned</option>
                                                {playlists.map(pl => (
                                                    <option key={pl.id} value={pl.id} className="bg-zinc-900 text-white font-medium">{pl.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Display Mode Selector */}
                                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/5">
                                            <span className="text-xs text-zinc-500 font-medium px-2">MODE</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => useStore.getState().updateTV(tv.id, { displayMode: 'playlist' })}
                                                    className={`px-3 py-1.5 text-xs rounded-md transition-all ${tv.displayMode === 'playlist' || !tv.displayMode ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                                                >
                                                    Playlist
                                                </button>
                                                <button
                                                    onClick={() => useStore.getState().updateTV(tv.id, { displayMode: 'queue' })}
                                                    className={`px-3 py-1.5 text-xs rounded-md transition-all ${tv.displayMode === 'queue' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                                                >
                                                    Queue
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard>
                                <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Register New TV</h3>
                                    <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                                </div>

                                <form onSubmit={handleAddTV} className="space-y-4">
                                    <InputGroup label="Display Name" value={newName} onChange={setNewName} placeholder="Lobby Display" />
                                    <InputGroup label="Location" value={newLocation} onChange={setNewLocation} placeholder="Floor 1" />



                                    <InputGroup label="Size (Inches)" type="number" value={newSizeInches || ''} onChange={setNewSizeInches} placeholder="e.g. 55" />

                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Orientation</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['landscape', 'portrait'].map((opt) => (
                                                <div
                                                    key={opt}
                                                    onClick={() => setNewOrientation(opt as Orientation)}
                                                    className={`
                                        cursor-pointer px-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all
                                        ${newOrientation === opt
                                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}
                                    `}
                                                >
                                                    {opt === 'landscape' ? <Monitor size={16} /> : <Smartphone size={16} />}
                                                    <span className="capitalize text-sm font-medium">{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <GlowButton type="button" variant="ghost" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</GlowButton>
                                        <GlowButton type="submit" className="flex-1">Register</GlowButton>
                                    </div>
                                </form>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="bg-white/5 text-zinc-400 px-2.5 py-1 rounded-md text-xs border border-white/5 font-mono">
            {children}
        </span>
    );
}

function InputGroup({ label, value, onChange, type = 'text', placeholder }: any) {
    return (
        <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">{label}</label>
            <input
                type={type}
                required
                value={value}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-white placeholder:text-zinc-600"
                placeholder={placeholder}
            />
        </div>
    );
}
