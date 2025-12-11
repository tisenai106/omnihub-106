import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    if (typeof window !== "undefined") {
        console.warn("Supabase credentials missing! Please check .env.local");
    }
}

// Use createBrowserClient for Client Components to ensure cookies are handled correctly
// across client/server boundary (Middleware).
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
);
