import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TV, Playlist, Slide, Ticket } from '../types';

interface AppState {
    tvs: TV[];
    playlists: Playlist[];
    tickets: Ticket[];
    isLoading: boolean;

    // Actions
    fetchData: () => Promise<void>;

    addTV: (tv: Omit<TV, 'id' | 'displayMode'>) => Promise<void>; // Default playlist mode
    updateTV: (id: string, updates: Partial<TV>) => Promise<void>;
    removeTV: (id: string) => Promise<void>;

    addPlaylist: (name: string) => Promise<string | null>;
    removePlaylist: (id: string) => Promise<void>;

    addSlide: (playlistId: string, url: string, duration: number) => Promise<void>;
    removeSlide: (slideId: string) => Promise<void>;

    assignPlaylistToTV: (tvId: string, playlistId: string | null) => Promise<void>;

    // Queue Actions
    createTicket: () => Promise<Ticket | null>;
    callTicket: (ticketId: string) => Promise<void>;
    completeTicket: (ticketId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    tvs: [],
    playlists: [],
    tickets: [],
    isLoading: false,

    fetchData: async () => {
        set({ isLoading: true });

        // Fetch TVs
        const { data: tvsData } = await supabase
            .from('tvs')
            .select('*')
            .order('created_at', { ascending: true });

        // Fetch Playlists with Slides
        const { data: playlistsData } = await supabase
            .from('playlists')
            .select('*, slides(*)')
            .order('created_at', { ascending: true });

        // Fetch Tickets (only active ones: waiting or called recently)
        // For simplicity fetching all 'waiting' and 'called', maybe limit 'completed'
        const { data: ticketsData } = await supabase
            .from('tickets')
            .select('*')
            .neq('status', 'completed') // Just keep active queue for now
            .order('created_at', { ascending: true });

        // Check for error logging if needed, but keeping simple

        // Transform DB data to match types
        const formattedPlaylists: Playlist[] = (playlistsData || []).map((pl: any) => ({
            ...pl,
            slides: (pl.slides || []).sort((a: any, b: any) => a.order - b.order)
        }));

        const formattedTVs: TV[] = (tvsData || []).map((tv: any) => ({
            id: tv.id,
            name: tv.name,
            location: tv.location,
            resolution: { width: tv.width, height: tv.height },
            orientation: tv.orientation,
            displayMode: tv.display_mode || 'playlist',
            assignedPlaylistId: tv.assigned_playlist_id
        }));

        const formattedTickets: Ticket[] = (ticketsData || []).map((t: any) => ({
            ...t
        }));

        set({
            tvs: formattedTVs,
            playlists: formattedPlaylists,
            tickets: formattedTickets,
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
            display_mode: 'playlist' // Default
        }).select();

        if (data && !error) {
            await get().fetchData();
        }
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

        await supabase.from('slides').insert({
            playlist_id: playlistId,
            url,
            duration,
            order
        });
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
        // Simple incremental number logic could be better (e.g. daily sequence), 
        // but for now relying on a simple random format or counting?
        // Let's do a simple count of tickets created today to generate number

        // Actually, just fetching count of tickets today
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        const nextNum = (count || 0) + 1;
        const numberStr = `#${String(nextNum).padStart(3, '0')}`;

        const { data, error } = await supabase.from('tickets').insert({
            number: numberStr,
            status: 'waiting'
        }).select().single();

        if (error) {
            console.error('Error creating ticket', error);
            return null;
        }

        await get().fetchData();
        return data as Ticket;
    },

    callTicket: async (ticketId) => {
        await supabase.from('tickets').update({
            status: 'called',
            called_at: new Date().toISOString()
        }).eq('id', ticketId);
        await get().fetchData();
    },

    completeTicket: async (ticketId) => {
        await supabase.from('tickets').update({ status: 'completed' }).eq('id', ticketId);
        await get().fetchData();
    }
}));
