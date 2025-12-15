'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import GlassCard from './GlassCard';
import GlowButton from './GlowButton';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
    type?: 'default' | 'success' | 'danger';
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, type = 'default', footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="w-full max-w-md relative"
                >
                    <GlassCard className="border-t border-white/10 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                {type === 'success' && <CheckCircle className="text-green-400" size={24} />}
                                {type === 'danger' && <AlertCircle className="text-red-400" size={24} />}
                                <h3 className="text-xl font-bold text-white">{title}</h3>
                            </div>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="text-zinc-300 mb-6">
                            {children}
                        </div>

                        {footer && (
                            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                                {footer}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    type?: 'default' | 'danger';
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type={type}
            footer={
                <>
                    <GlowButton variant="ghost" onClick={onClose}>Cancel</GlowButton>
                    <GlowButton
                        onClick={() => { onConfirm(); onClose(); }}
                        className={type === 'danger' ? '!bg-red-500/20 !text-red-400 hover:!bg-red-500/30' : ''}
                    >
                        Confirm
                    </GlowButton>
                </>
            }
        >
            {message}
        </Modal>
    );
}

export function AlertModal({ isOpen, onClose, title, message, type = 'default' }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    type?: 'default' | 'success' | 'danger';
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            type={type}
            footer={
                <GlowButton onClick={onClose}>OK</GlowButton>
            }
        >
            {message}
        </Modal>
    );
}
