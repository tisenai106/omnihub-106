import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { TV, Playlist, Slide, Ticket, ServiceType, Attendant, Profile } from '../types';

interface AppState {
    tvs: TV[];
    playlists: Playlist[];
    tickets: Ticket[];
    serviceTypes: ServiceType[];
    attendants: Attendant[]; // Kept for legacy/v2
    profiles: Profile[]; // New V3
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
    callTicket: (ticketId: string) => Promise<void>;
    completeTicket: (ticketId: string, serviceTypeId?: string) => Promise<void>;

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
    profiles: [],
    isLoading: false,

    fetchData: async () => {
        set({ isLoading: true });

        // Parallel fetching
        const [tvsReq, plReq, ticketsReq, servicesReq, attendantsReq, profilesReq] = await Promise.all([
            supabase.from('tvs').select('*').order('created_at', { ascending: true }),
            supabase.from('playlists').select('*, slides(*)').order('created_at', { ascending: true }),
            supabase.from('tickets').select('*').order('created_at', { ascending: true }), // Fetch ALL tickets for history? Or separate history call? Fetching all for now for History Page.
            supabase.from('service_types').select('*').order('created_at'),
            supabase.from('attendants').select('*').order('created_at'),
            supabase.from('profiles').select('*')
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
            assignedPlaylistId: tv.assigned_playlist_id,
            size_inches: tv.size_inches,
            spotifyId: tv.spotify_id
        }));

        const formattedTickets: Ticket[] = (ticketsReq.data || []).map((t: any) => ({ ...t }));
        const formattedServices: ServiceType[] = (servicesReq.data || []).map((s: any) => ({ ...s }));
        const formattedAttendants: Attendant[] = (attendantsReq.data || []).map((a: any) => ({ ...a }));
        const formattedProfiles: Profile[] = (profilesReq.data || []).map((p: any) => ({ ...p }));

        set({
            tvs: formattedTVs,
            playlists: formattedPlaylists,
            tickets: formattedTickets,
            serviceTypes: formattedServices,
            attendants: formattedAttendants,
            profiles: formattedProfiles,
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
            display_mode: 'playlist',
            size_inches: tv.size_inches,
            spotify_id: tv.spotifyId
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
        if (updates.spotifyId !== undefined) {
            dbUpdates.spotify_id = updates.spotifyId;
        }
        if (updates.location) dbUpdates.location = updates.location;
        if (updates.resolution) {
            dbUpdates.width = updates.resolution.width;
            dbUpdates.height = updates.resolution.height;
        }
        if (updates.orientation) dbUpdates.orientation = updates.orientation;
        if (updates.size_inches) dbUpdates.size_inches = updates.size_inches;

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

        if (error) {
            console.error('Error creating ticket - Details:', JSON.stringify(error, null, 2));
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Error hint:', error.hint);
        }
        else {
            await get().fetchData();
            return data as Ticket;
        }
        return null;
    },

    callTicket: (ticketId) => {
        return new Promise(async (resolve, reject) => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                reject(new Error("Usuário não autenticado"));
                return;
            }

            // Verify if user is in profiles (it should be)
            // We link the ticket to this user
            // We NO LONGER save the service type here. It comes at the end.
            await supabase.from('tickets').update({
                status: 'called',
                called_at: new Date().toISOString(),
                attendant_user_id: user.id
            }).eq('id', ticketId);

            await get().fetchData();
            resolve();
        });
    },

    completeTicket: async (ticketId, serviceTypeId) => {
        const updates: any = { status: 'completed' };
        if (serviceTypeId) updates.service_type_id = serviceTypeId;

        await supabase.from('tickets').update(updates).eq('id', ticketId);
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

    // Deprecated? No, maybe keep for manual overrides if needed, 
    // but user wanted "Selected attendant is logged in user".
    // We will remove addAttendant/removeAttendant from UI later, but keep store for now or remove if strictly following v3.
    // Let's keep them but maybe unused.
    addAttendant: async (name, desk) => {
        await supabase.from('attendants').insert({ name, desk_number: desk });
        await get().fetchData();
    },

    removeAttendant: async (id) => {
        await supabase.from('attendants').delete().eq('id', id);
        await get().fetchData();
    }
}));
