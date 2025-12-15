'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Ticket, Users, Megaphone, CheckCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QueueAdminPage() {
    const { tickets, profiles, serviceTypes, fetchData, callTicket, completeTicket } = useStore();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');

    useEffect(() => {
        fetchData();

        // Get current auth user and match with profile
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // We rely on store profiles being loaded, or fetch specifically
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setCurrentUser(data);
            }
        };
        getUser();

        const channel = supabase
            .channel('queue_admin_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const waitingTickets = tickets.filter(t => t.status === 'waiting');

    // Filter tickets to only show those called or completed (for history)
    const allCalledTickets = tickets
        .filter(t => t.status === 'called' || t.status === 'completed')
        .sort((a, b) => new Date(b.called_at!).getTime() - new Date(a.called_at!).getTime());

    const currentTicket = allCalledTickets.find(t => t.status === 'called' && currentUser && t.attendant_user_id === currentUser.id);
    const historyTickets = allCalledTickets.filter(t => t.id !== currentTicket?.id).slice(0, 5);

    const handleCallNext = async () => {
        if (waitingTickets.length > 0) {
            try {
                const next = waitingTickets[0];
                await callTicket(next.id);
            } catch (err) {
                alert("Erro ao chamar senha: Você precisa estar logado.");
            }
        }
    };

    const handleFinish = async () => {
        if (!currentTicket) return;
        if (!selectedServiceId) {
            alert("Por favor, selecione o Tipo de Atendimento antes de encerrar.");
            return;
        }

        await completeTicket(currentTicket.id, selectedServiceId);
        setSelectedServiceId(''); // Reset selection
    };

    return (
        <div className="p-8 max-w-7xl mx-auto text-white">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Gerenciamento de Fila
                    </h1>
                    <p className="text-zinc-400">Controle de senhas e chamadas</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Settings removed from here - moved to Sidebar */}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Caller Station */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Action Card */}
                    <div className="p-8 rounded-3xl glass-panel border border-white/10 bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Senha Atual</h2>
                                <p className="text-sm text-zinc-400">Mostrando na TV agora</p>
                            </div>
                            <div className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/20">
                                {waitingTickets.length} na fila
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-7xl font-bold tracking-tighter text-white">
                                {currentTicket ? currentTicket.number : '--'}
                            </div>

                            <div className="flex flex-col gap-3 items-end">
                                {!currentTicket ? (
                                    // State 1: No ticket called, show "Call Next"
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleCallNext}
                                        disabled={waitingTickets.length === 0}
                                        className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all ${waitingTickets.length > 0
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                            }`}
                                    >
                                        <Megaphone size={24} />
                                        Chamar Próximo
                                    </motion.button>
                                ) : (
                                    // State 2: Ticket called, show Service Selector + "End Service"
                                    <div className="flex flex-col gap-3 items-end p-4 border border-white/10 rounded-xl bg-white/5">
                                        <div className="text-right mb-2">
                                            <p className="text-sm text-zinc-400">Em Atendimento</p>
                                            <p className="text-xl font-bold">{currentTicket.number}</p>
                                        </div>
                                        <select
                                            value={selectedServiceId}
                                            onChange={(e) => setSelectedServiceId(e.target.value)}
                                            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-green-500/50 w-64"
                                        >
                                            <option value="">Selecione o que foi feito...</option>
                                            {serviceTypes.map(s => (
                                                <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                                            ))}
                                        </select>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleFinish}
                                            disabled={!selectedServiceId}
                                            className={`w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedServiceId
                                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <CheckCircle size={20} />
                                            Encerrar Atendimento
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Waiting List */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-zinc-400" />
                            Na Fila
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <AnimatePresence>
                                {waitingTickets.map(ticket => (
                                    <motion.div
                                        key={ticket.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl flex items-center justify-between"
                                    >
                                        <span className="font-mono text-xl text-zinc-200">{ticket.number}</span>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </motion.div>
                                ))}
                                {waitingTickets.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-zinc-500 italic">
                                        Ninguém na fila
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* History / Called List */}
                <div className="glass-panel p-6 rounded-3xl h-fit">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500" />
                        Últimos Chamados
                    </h3>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {historyTickets.map(ticket => (
                                <motion.div
                                    key={ticket.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 bg-zinc-900/30 border border-white/5 rounded-xl flex items-center justify-between group"
                                >
                                    <div>
                                        <span className="font-mono text-lg text-zinc-400 group-hover:text-zinc-200 transition-colors">{ticket.number}</span>
                                        <div className="text-xs text-zinc-600">
                                            Chamado às {new Date(ticket.called_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => completeTicket(ticket.id)}
                                        className="p-2 hover:bg-green-500/10 text-zinc-600 hover:text-green-500 rounded-lg transition-colors"
                                        title="Marcar como atendido"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
