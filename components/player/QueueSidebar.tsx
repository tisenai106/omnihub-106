'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Ticket, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


export default function QueueSidebar() {
    const { tickets, profiles } = useStore(); // V3: use profiles

    // Sort logic
    const calledTickets = tickets
        .filter(t => t.status === 'called' || t.status === 'completed')
        .sort((a, b) => new Date(b.called_at!).getTime() - new Date(a.called_at!).getTime());

    const currentTicket = calledTickets[0];
    const previousTickets = calledTickets.slice(1, 4);

    // Get Attendant Info (From Profiles via attendant_user_id)
    const currentAttendant = currentTicket && currentTicket.attendant_user_id
        ? profiles.find(p => p.id === currentTicket.attendant_user_id)
        : null;

    // Fallback? If no user ID check legacy? Maybe not needed for clean V3.

    // Audio Effect (TTS + Chime)
    const lastCalledIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (currentTicket && currentTicket.id !== lastCalledIdRef.current) {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.warn('Audio play failed', e));

            setTimeout(() => {
                if ('speechSynthesis' in window) {
                    const synth = window.speechSynthesis;
                    if (synth.speaking) synth.cancel();

                    // Name of attendant user or Desk Info if available
                    // "Senha 001. Guichê 05" (if desk_info exists, else use Name)
                    const location = currentAttendant?.desk_info || currentAttendant?.name || '';
                    const text = `Senha ${currentTicket.number}. ${location}`;

                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'pt-BR';
                    utterance.rate = 0.9;
                    synth.speak(utterance);
                }
            }, 1000);

            lastCalledIdRef.current = currentTicket.id;
        }
    }, [currentTicket, currentAttendant]);

    return (
        <div className="h-full w-full bg-zinc-900 border-l border-zinc-800 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            {/* Header / QR */}
            <div className="p-6 border-b border-zinc-800 bg-black/20 flex flex-col items-center text-center">
                <div className="bg-white p-2 rounded-xl mb-3 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://tv-senai.vercel.app/queue')}`}
                        alt="Join Queue"
                        className="w-32 h-32"
                    />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Entre na Fila</h3>
                <p className="text-zinc-400 text-sm">Escaneie para retirar sua senha</p>
            </div>

            {/* Current Ticket */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-900/10 to-transparent">
                <span className="text-zinc-500 uppercase tracking-widest text-sm mb-4 font-medium">Senha Atual</span>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTicket ? currentTicket.id : 'none'}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="text-center"
                    >
                        {currentTicket ? (
                            <>
                                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 tracking-tighter drop-shadow-2xl mb-4">
                                    {currentTicket.number}
                                </div>
                                {(currentAttendant?.desk_info || currentAttendant?.name) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-block px-6 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 backdrop-blur-md"
                                    >
                                        <p className="text-blue-200 font-bold text-xl uppercase tracking-wide">
                                            {currentAttendant.desk_info || currentAttendant.name}
                                        </p>
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <div className="text-4xl font-bold text-zinc-700">--</div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* History */}
            <div className="p-6 bg-black/40">
                <h4 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">Últimas Senhas</h4>
                <div className="space-y-3">
                    {previousTickets.map((t, i) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                            <span className="font-mono text-xl text-zinc-300 font-bold opacity-80">{t.number}</span>
                            <span className="text-xs text-zinc-600">
                                {new Date(t.called_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {previousTickets.length === 0 && (
                        <p className="text-zinc-700 text-sm italic text-center py-4">Histórico vazio</p>
                    )}
                </div>
            </div>
        </div>
    );
}
