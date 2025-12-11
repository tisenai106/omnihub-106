'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Settings, Plus, Trash2, Tag, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlowButton from '@/components/ui/GlowButton';

export default function QueueSettingsPage() {
    const {
        serviceTypes, attendants,
        fetchData,
        addServiceType, removeServiceType,
        addAttendant, removeAttendant
    } = useStore();

    useEffect(() => {
        fetchData();
    }, []);

    // Service Type Form
    const [newService, setNewService] = useState('');
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newService.trim()) return;
        await addServiceType(newService);
        setNewService('');
    };

    // Attendant Form
    const [newAttendantName, setNewAttendantName] = useState('');
    const [newAttendantDesk, setNewAttendantDesk] = useState('');
    const handleAddAttendant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAttendantName.trim()) return;
        await addAttendant(newAttendantName, newAttendantDesk);
        setNewAttendantName('');
        setNewAttendantDesk('');
    };

    return (
        <div className="p-8 max-w-6xl mx-auto text-white">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    Configurações de Atendimento
                </h1>
                <p className="text-zinc-400">Gerencie tipos de serviços e guichês.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Service Types Section */}
                <section>
                    <GlassCard className="h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                <Tag size={24} />
                            </div>
                            <h2 className="text-xl font-bold">Tipos de Serviço</h2>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddService} className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={newService}
                                onChange={e => setNewService(e.target.value)}
                                placeholder="Ex: Prioritário, Geral..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600"
                            />
                            <button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition-colors"
                            >
                                <Plus size={24} />
                            </button>
                        </form>

                        {/* List */}
                        <div className="space-y-2">
                            <AnimatePresence>
                                {serviceTypes.map((service) => (
                                    <motion.div
                                        key={service.id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group"
                                    >
                                        <span className="font-medium text-zinc-200">{service.name}</span>
                                        <button
                                            onClick={() => removeServiceType(service.id)}
                                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                                {serviceTypes.length === 0 && (
                                    <p className="text-zinc-600 text-center py-4 italic">Nenhum serviço cadastrado.</p>
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassCard>
                </section>

                {/* Attendants Section */}
                <section>
                    <GlassCard className="h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <User size={24} />
                            </div>
                            <h2 className="text-xl font-bold">Atendentes / Guichês</h2>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddAttendant} className="flex flex-col gap-3 mb-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newAttendantName}
                                    onChange={e => setNewAttendantName(e.target.value)}
                                    placeholder="Nome (Ex: Guichê 01)"
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-zinc-600"
                                />
                                <input
                                    type="text"
                                    value={newAttendantDesk}
                                    onChange={e => setNewAttendantDesk(e.target.value)}
                                    placeholder="Guichê/Mesa (Opcional)"
                                    className="w-1/3 bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-zinc-600"
                                />
                            </div>
                            <GlowButton type="submit" icon={Plus} className="w-full">
                                Adicionar
                            </GlowButton>
                        </form>

                        {/* List */}
                        <div className="space-y-2">
                            <AnimatePresence>
                                {attendants.map((attendant) => (
                                    <motion.div
                                        key={attendant.id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group"
                                    >
                                        <div>
                                            <div className="font-medium text-zinc-200">{attendant.name}</div>
                                            {attendant.desk_number && (
                                                <div className="text-xs text-zinc-500">{attendant.desk_number}</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeAttendant(attendant.id)}
                                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                                {attendants.length === 0 && (
                                    <p className="text-zinc-600 text-center py-4 italic">Nenhum atendente cadastrado.</p>
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassCard>
                </section>
            </div>
        </div>
    );
}
