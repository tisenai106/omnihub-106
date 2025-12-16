'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, isWithinInterval,
    isBefore, isAfter, startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Assuming users are BR based on context
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onChange: (start: Date, end: Date) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const handleDateClick = (date: Date) => {
        // If we have a range already selected, clicking starts a new range
        if (startDate && endDate && !isSameDay(startDate, endDate)) {
            onChange(date, date); // Reset to single day
            return;
        }

        // If we have just a start date (or start=end), determine if we're setting end or resetting start
        if (isBefore(date, startDate)) {
            // Clicked before start -> New Start
            onChange(date, date);
        } else {
            // Clicked after start -> Set End
            onChange(startDate, date);
            setIsOpen(false); // Close on complete selection? Optional.
        }
    };

    const isInRange = (date: Date) => {
        return startDate && endDate && isWithinInterval(date, { start: startDate, end: endDate });
    };

    const isRangeStart = (date: Date) => isSameDay(date, startDate);
    const isRangeEnd = (date: Date) => isSameDay(date, endDate);

    // Preview range on hover
    const isHoverInRange = (date: Date) => {
        if (!hoverDate || (startDate && endDate && !isSameDay(startDate, endDate))) return false;
        if (isBefore(date, startDate) || isAfter(date, hoverDate)) return false;
        return isWithinInterval(date, { start: startDate, end: hoverDate });
    };

    const formattedTrigger = isSameDay(startDate, endDate)
        ? format(startDate, "d 'de' MMMM", { locale: ptBR })
        : `${format(startDate, "d MMM", { locale: ptBR })} - ${format(endDate, "d MMM", { locale: ptBR })}`;

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-xl px-4 py-2 transition-colors group"
            >
                <CalendarIcon size={16} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
                <span className={clsx("text-sm transition-colors", isOpen ? "text-white" : "text-zinc-300")}>
                    {formattedTrigger}
                </span>
            </button>

            {/* Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 z-[9999]"
                    >
                        <div className="bg-[#0f0f12] border border-white/10 rounded-2xl shadow-2xl p-4 w-[320px] backdrop-blur-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="font-semibold text-white capitalize">
                                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                                </span>
                                <button
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                    <div key={`${d}-${i}`} className="text-xs font-medium text-zinc-500 py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {daysInMonth.map((date) => {
                                    const isStart = isRangeStart(date);
                                    const isEnd = isRangeEnd(date);
                                    const inRange = isInRange(date);
                                    const hoverRange = isHoverInRange(date);

                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => handleDateClick(date)}
                                            onMouseEnter={() => setHoverDate(date)}
                                            onMouseLeave={() => setHoverDate(null)}
                                            className={clsx(
                                                "relative h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all",
                                                isStart && "bg-blue-600 text-white z-10 font-bold",
                                                isEnd && "bg-blue-600 text-white z-10 font-bold",
                                                !isStart && !isEnd && inRange && "bg-blue-500/20 text-blue-200",
                                                !isStart && !isEnd && hoverRange && "bg-blue-500/10 text-blue-200 dashed-border",
                                                !inRange && !hoverRange && "text-zinc-400 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            {format(date, 'd')}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer / Shortcuts */}
                            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        const now = new Date();
                                        onChange(now, now);
                                        setIsOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors"
                                >
                                    Hoje
                                </button>
                                <button
                                    onClick={() => {
                                        const now = new Date();
                                        onChange(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now);
                                        setIsOpen(false);
                                    }}
                                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors"
                                >
                                    Últimos 7 dias
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
