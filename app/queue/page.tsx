'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';

export default function QueuePage() {
    const { createTicket } = useStore();
    const [myTicket, setMyTicket] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGetTicket = async () => {
        setLoading(true);
        const ticket = await createTicket();
        if (ticket) {
            setMyTicket(ticket.number);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black -z-10" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />

            <main className="w-full max-w-md z-10 flex flex-col items-center text-center space-y-8">
                <div className="mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mx-auto transform rotate-3">
                        <Ticket size={40} className="text-white" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Bem-vindo
                    </h1>
                    <p className="text-zinc-400">
                        Retire sua senha digital para ser atendido.
                    </p>
                </div>

                {!myTicket ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGetTicket}
                        disabled={loading}
                        className="group relative px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 group-hover:opacity-100 blur transition-opacity duration-500 -z-10" />

                        <span className="relative text-xl font-bold flex items-center gap-2">
                            {loading ? 'Gerando...' : 'Retirar Senha'}
                            {!loading && <Ticket size={20} />}
                        </span>
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />

                        <p className="text-sm text-zinc-500 uppercase tracking-widest mb-2">Sua Senha</p>
                        <div className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500 tracking-tighter">
                            {myTicket}
                        </div>
                        <p className="mt-4 text-zinc-400 text-sm">
                            Aguarde ser chamado pela TV.
                        </p>

                        <div className="mt-8 pt-6 border-t border-zinc-800">
                            <button
                                onClick={() => setMyTicket(null)}
                                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                Retirar outra senha
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>

            <footer className="absolute bottom-6 text-zinc-700 text-xs">
                SENAI Digital Systems
            </footer>
        </div>
    );
}
