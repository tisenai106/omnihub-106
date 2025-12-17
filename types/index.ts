export type Orientation = 'landscape' | 'portrait';
export type DisplayMode = 'playlist' | 'queue';

export interface TV {
    id: string;
    name: string;
    location: string;
    resolution: {
        width: number;
        height: number;
    };
    orientation: Orientation;
    displayMode: DisplayMode;
    assignedPlaylistId: string | null;
    size_inches?: number;
    spotifyId?: string;
}

export type SlideType = 'image';

export interface Slide {
    id: string;
    type: SlideType;
    url: string; // For images
    duration: number; // in seconds
    order: number;
}

export interface Playlist {
    id: string;
    name: string;
    slides: Slide[];
}

export type TicketStatus = 'waiting' | 'called' | 'completed';



export interface Profile {
    id: string;
    email?: string;
    name?: string;
    desk_info?: string;
    role: 'super_admin' | 'editor' | 'viewer' | 'attendant';
}

export interface ServiceType {
    id: string;
    name: string;
}

export interface Ticket {
    id: string;
    number: string;
    status: TicketStatus;
    created_at: string;
    called_at?: string;
    attendant_id?: string; // Legacy
    attendant_user_id?: string; // New V3
    service_type_id?: string;
}

export interface Attendant {
    id: string;
    name: string;
    desk_number?: string;
}
