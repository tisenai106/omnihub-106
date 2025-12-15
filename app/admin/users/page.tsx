'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createUser } from '@/actions/createUser';
import { deleteUser, updateUser } from '@/actions/manageUser';
import { Users, UserPlus, Shield, ShieldAlert, Mail, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowButton from '@/components/ui/GlowButton';
import { AlertModal, ConfirmModal } from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [alertState, setAlertState] = useState<{ open: boolean, title: string, message: string, type: 'success' | 'danger' | 'default' }>({ open: false, title: '', message: '', type: 'default' });
    const [confirmState, setConfirmState] = useState<{ open: boolean, title: string, message: string, onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const showAlert = (title: string, message: string, type: 'success' | 'danger' | 'default' = 'default') => {
        setAlertState({ open: true, title, message, type });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmState({ open: true, title, message, onConfirm });
    };

    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at');
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
            showAlert('Success', 'User created successfully.', 'success');
            setIsAdding(false);
            fetchUsers();
        } else {
            showAlert('Error', 'Failed to create user: ' + res.error, 'danger');
        }
        setLoading(false);
    };

    const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingUser) return;
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const updates = {
            name: formData.get('name') as string,
            desk_info: formData.get('desk_info') as string,
            role: formData.get('role') as string
        };

        const res = await updateUser(editingUser.id, updates);
        if (res.success) {
            showAlert('Success', 'User updated successfully!', 'success');
            setEditingUser(null);
            fetchUsers();
        } else {
            showAlert('Error', 'Failed to update user: ' + res.error, 'danger');
        }
        setLoading(false);
    };

    const handleDeleteUser = async (user: any) => {
        showConfirm(
            'Delete User',
            `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
            async () => {
                const res = await deleteUser(user.id);
                if (res.success) {
                    showAlert('Deleted', 'User deleted successfully.', 'success');
                    fetchUsers();
                } else {
                    showAlert('Error', 'Failed to delete user: ' + res.error, 'danger');
                }
            }
        );
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Users</h2>
                    <p className="text-zinc-400 mt-2">Manage system access and roles.</p>
                </div>
                <GlowButton onClick={() => setIsAdding(true)} icon={UserPlus}>
                    Add User
                </GlowButton>
            </div>

            {/* Modals */}
            <AlertModal
                isOpen={alertState.open}
                onClose={() => setAlertState(prev => ({ ...prev, open: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
            <ConfirmModal
                isOpen={confirmState.open}
                onClose={() => setConfirmState(prev => ({ ...prev, open: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <GlassCard key={user.id} className="relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setEditingUser(user)}
                                className="p-2 bg-white/10 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 bg-white/10 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${user.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {user.role === 'super_admin' ? <ShieldAlert size={24} /> : <Shield size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg mb-0.5">{user.name || 'Sem Nome'}</h3>
                                <p className="text-zinc-400 text-sm mb-2">{user.email}</p>

                                <div className="flex gap-2">
                                    <span className="inline-flex px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-zinc-400 capitalize">
                                        {user.role?.replace('_', ' ')}
                                    </span>
                                    {user.desk_info && (
                                        <span className="inline-flex px-2 py-1 rounded-md bg-green-500/10 border border-green-500/10 text-xs text-green-400">
                                            {user.desk_info}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* ADD USER MODAL */}
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
                                    <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
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
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Name / Nome</label>
                                        <input name="name" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: João Silva" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Desk / Guichê</label>
                                        <input name="desk_info" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: Guichê 05" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Role</label>
                                        <select name="role" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                                            <option value="editor" className="bg-zinc-900">Editor</option>
                                            <option value="attendant" className="bg-zinc-900">Attendant / Atendente</option>
                                            <option value="super_admin" className="bg-zinc-900">Super Admin</option>
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

            {/* EDIT USER MODAL */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard>
                                <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">Edit User</h3>
                                    <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                                </div>

                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
                                        <input
                                            type="text"
                                            value={editingUser.email}
                                            disabled
                                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-zinc-400 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Name / Nome</label>
                                        <input
                                            name="name"
                                            type="text"
                                            defaultValue={editingUser.name}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Desk / Guichê</label>
                                        <input
                                            name="desk_info"
                                            type="text"
                                            defaultValue={editingUser.desk_info}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Ex: Guichê 05"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Role</label>
                                        <select
                                            name="role"
                                            defaultValue={editingUser.role}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                        >
                                            <option value="editor" className="bg-zinc-900">Editor</option>
                                            <option value="attendant" className="bg-zinc-900">Attendant / Atendente</option>
                                            <option value="super_admin" className="bg-zinc-900">Super Admin</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <GlowButton type="button" variant="ghost" className="flex-1" onClick={() => setEditingUser(null)}>Cancel</GlowButton>
                                        <GlowButton type="submit" isLoading={loading} className="flex-1">Save Changes</GlowButton>
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

