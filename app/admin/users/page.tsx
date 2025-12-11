'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createUser } from '@/actions/createUser';
import { Users, UserPlus, Shield, ShieldAlert, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        // We fetch from profiles view
        const { data } = await supabase.from('profiles').select('*');
        if (data) setUsers(data);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await createUser(formData);

        if (res.success) {
            alert('User created successfully');
            setIsAdding(false);
            fetchUsers();
        } else {
            alert('Error: ' + res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Users</h2>
                    <p className="text-zinc-400 mt-2">Manage system access and roles.</p>
                </div>
                <GlowButton onClick={() => setIsAdding(true)} icon={UserPlus}>
                    Add User
                </GlowButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <GlassCard key={user.id} className="relative group">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${user.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {user.role === 'super_admin' ? <ShieldAlert size={24} /> : <Shield size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">{user.email}</h3>
                                <div className="inline-flex px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-zinc-400 capitalize">
                                    {user.role.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

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
                                    <h3 className="text-xl font-bold text-white">Add New User</h3>
                                    <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white">✕</button>
                                </div>

                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
                                        <input name="email" type="email" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="user@company.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Password</label>
                                        <input name="password" type="password" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Role</label>
                                        <select name="role" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                                            <option value="editor" className="bg-zinc-900">Editor (TVs & Playlists)</option>
                                            <option value="super_admin" className="bg-zinc-900">Super Admin (Full Access)</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <GlowButton type="button" variant="ghost" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</GlowButton>
                                        <GlowButton type="submit" isLoading={loading} className="flex-1">Create User</GlowButton>
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
