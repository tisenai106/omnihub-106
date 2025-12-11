import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TV, Playlist, Slide, Ticket, ServiceType, Attendant } from '../types';

interface AppState {
    tvs: TV[];
    playlists: Playlist[];
    tickets: Ticket[];
    serviceTypes: ServiceType[];
    attendants: Attendant[];
    isLoading: boolean;

    // Actions
    fetchData: () => Promise<void>;

    addTV: (tv: Omit<TV, 'id' | 'displayMode'>) => Promise<void>;
    updateTV: (id: string, updates: Partial<TV>) => Promise<void>;
    removeTV: (id: string) => Promise<void>;

    addPlaylist: (name: string) => Promise<string | null>;
    removePlaylist: (id: string) => Promise<void>;

    addSlide: (playlistId: string, url: string, duration: number) => Promise<void>;
    removeSlide: (slideId: string) => Promise<void>;

    assignPlaylistToTV: (tvId: string, playlistId: string | null) => Promise<void>;

    // Queue Actions
    createTicket: () => Promise<Ticket | null>;
    callTicket: (ticketId: string, attendantId: string) => Promise<void>;
    completeTicket: (ticketId: string) => Promise<void>;

    // Settings Actions
    addServiceType: (name: string) => Promise<void>;
    removeServiceType: (id: string) => Promise<void>;
    addAttendant: (name: string, desk?: string) => Promise<void>;
    removeAttendant: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    tvs: [],
    playlists: [],
    tickets: [],
    serviceTypes: [],
    attendants: [],
    isLoading: false,

    fetchData: async () => {
        set({ isLoading: true });

        // Parallel fetching
        const [tvsReq, plReq, ticketsReq, servicesReq, attendantsReq] = await Promise.all([
            supabase.from('tvs').select('*').order('created_at', { ascending: true }),
            supabase.from('playlists').select('*, slides(*)').order('created_at', { ascending: true }),
            supabase.from('tickets').select('*').neq('status', 'completed').order('created_at', { ascending: true }),
            supabase.from('service_types').select('*').order('created_at'),
            supabase.from('attendants').select('*').order('created_at')
        ]);

        // Transform Data
        const formattedPlaylists: Playlist[] = (plReq.data || []).map((pl: any) => ({
            ...pl,
            slides: (pl.slides || []).sort((a: any, b: any) => a.order - b.order)
        }));

        const formattedTVs: TV[] = (tvsReq.data || []).map((tv: any) => ({
            id: tv.id,
            name: tv.name,
            location: tv.location,
            resolution: { width: tv.width, height: tv.height },
            orientation: tv.orientation,
            displayMode: tv.display_mode || 'playlist',
            assignedPlaylistId: tv.assigned_playlist_id
        }));

        const formattedTickets: Ticket[] = (ticketsReq.data || []).map((t: any) => ({ ...t }));
        const formattedServices: ServiceType[] = (servicesReq.data || []).map((s: any) => ({ ...s }));
        const formattedAttendants: Attendant[] = (attendantsReq.data || []).map((a: any) => ({ ...a }));

        set({
            tvs: formattedTVs,
            playlists: formattedPlaylists,
            tickets: formattedTickets,
            serviceTypes: formattedServices,
            attendants: formattedAttendants,
            isLoading: false
        });
    },

    addTV: async (tv) => {
        const { data, error } = await supabase.from('tvs').insert({
            name: tv.name,
            location: tv.location,
            width: tv.resolution.width,
            height: tv.resolution.height,
            orientation: tv.orientation,
            display_mode: 'playlist'
        }).select();

        if (data && !error) await get().fetchData();
    },

    updateTV: async (id, updates) => {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.displayMode) dbUpdates.display_mode = updates.displayMode;
        if (updates.assignedPlaylistId !== undefined) {
            dbUpdates.assigned_playlist_id = updates.assignedPlaylistId;
        }

        await supabase.from('tvs').update(dbUpdates).eq('id', id);
        await get().fetchData();
    },

    removeTV: async (id) => {
        await supabase.from('tvs').delete().eq('id', id);
        await get().fetchData();
    },

    addPlaylist: async (name) => {
        const { data } = await supabase.from('playlists').insert({ name }).select().single();
        await get().fetchData();
        return data ? data.id : null;
    },

    removePlaylist: async (id) => {
        await supabase.from('playlists').delete().eq('id', id);
        await get().fetchData();
    },

    addSlide: async (playlistId, url, duration) => {
        const playlist = get().playlists.find(p => p.id === playlistId);
        const order = playlist ? playlist.slides.length : 0;
        await supabase.from('slides').insert({ playlist_id: playlistId, url, duration, order });
        await get().fetchData();
    },

    removeSlide: async (slideId) => {
        await supabase.from('slides').delete().eq('id', slideId);
        await get().fetchData();
    },

    assignPlaylistToTV: async (tvId, playlistId) => {
        await supabase.from('tvs').update({ assigned_playlist_id: playlistId }).eq('id', tvId);
        await get().fetchData();
    },

    createTicket: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', today);

        const nextNum = (count || 0) + 1;
        const numberStr = `#${String(nextNum).padStart(3, '0')}`;

        const { data, error } = await supabase.from('tickets').insert({
            number: numberStr,
            status: 'waiting'
        }).select().single();

        if (error) console.error('Error creating ticket', error);
        else {
            await get().fetchData();
            return data as Ticket;
        }
        return null;
    },

    callTicket: async (ticketId, attendantId) => {
        await supabase.from('tickets').update({
            status: 'called',
            called_at: new Date().toISOString(),
            attendant_id: attendantId
        }).eq('id', ticketId);
        await get().fetchData();
    },

    completeTicket: async (ticketId) => {
        await supabase.from('tickets').update({ status: 'completed' }).eq('id', ticketId);
        await get().fetchData();
    },

    addServiceType: async (name) => {
        await supabase.from('service_types').insert({ name });
        await get().fetchData();
    },

    removeServiceType: async (id) => {
        await supabase.from('service_types').delete().eq('id', id);
        await get().fetchData();
    },

    addAttendant: async (name, desk) => {
        await supabase.from('attendants').insert({ name, desk_number: desk });
        await get().fetchData();
    },

    removeAttendant: async (id) => {
        await supabase.from('attendants').delete().eq('id', id);
        await get().fetchData();
    }
}));
