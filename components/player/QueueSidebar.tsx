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
            <div className="p-[5cqw] border-b border-zinc-800 bg-black/20 flex flex-col items-center text-center">
                <div className="bg-white p-[2cqw] rounded-xl mb-[3cqw] shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://omnihub-106.vercel.app/queue')}`}
                        alt="Join Queue"
                        className="w-[50cqw] h-[50cqw]"
                    />
                </div>
                <h3 className="font-bold text-white mb-1 leading-tight" style={{ fontSize: '7cqw' }}>Entre na Fila</h3>
                <p className="text-zinc-400" style={{ fontSize: '4cqw' }}>Escaneie para retirar sua senha</p>
            </div>

            {/* Current Ticket */}
            <div className="flex-1 flex flex-col items-center justify-center p-[5cqw] bg-gradient-to-b from-blue-900/10 to-transparent">
                <span className="text-zinc-500 uppercase tracking-widest font-medium mb-[4cqw]" style={{ fontSize: '4cqw' }}>Senha Atual</span>
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
                                <div className="font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 tracking-tighter drop-shadow-2xl mb-[4cqw]" style={{ fontSize: '35cqw', lineHeight: 1 }}>
                                    {currentTicket.number}
                                </div>
                                {(currentAttendant?.desk_info || currentAttendant?.name) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-block px-[4cqw] py-[1cqw] rounded-full bg-blue-600/20 border border-blue-500/30 backdrop-blur-md"
                                    >
                                        <p className="text-blue-200 font-bold uppercase tracking-wide" style={{ fontSize: '6cqw' }}>
                                            {currentAttendant.desk_info || currentAttendant.name}
                                        </p>
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <div className="font-bold text-zinc-700" style={{ fontSize: '15cqw' }}>--</div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* History */}
            <div className="p-[5cqw] bg-black/40">
                <h4 className="font-medium text-zinc-500 mb-[3cqw] uppercase tracking-wider" style={{ fontSize: '3.5cqw' }}>Últimas Senhas</h4>
                <div className="space-y-[2cqw]">
                    {previousTickets.map((t, i) => (
                        <div key={t.id} className="flex items-center justify-between p-[3cqw] rounded-lg bg-white/5 border border-white/5">
                            <span className="font-mono text-zinc-300 font-bold opacity-80" style={{ fontSize: '7cqw' }}>{t.number}</span>
                            <span className="text-zinc-600" style={{ fontSize: '4cqw' }}>
                                {new Date(t.called_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {previousTickets.length === 0 && (
                        <p className="text-zinc-700 italic text-center py-4" style={{ fontSize: '4cqw' }}>Histórico vazio</p>
                    )}
                </div>
            </div>
        </div>
    );
}
