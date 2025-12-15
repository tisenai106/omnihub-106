'use server';

import { createClient } from '@supabase/supabase-js';

export async function createUser(formData: FormData) {
    // Initialize client dynamically to avoid build-time crashes if envs are missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase Config in createUser');
        return { success: false, error: 'System configuration error. Service Role Key missing.' };
    }

    const supabaseAdmin = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const name = formData.get('name') as string;
    const deskInfo = formData.get('desk_info') as string;

    try {
        // 1. Create Auth User
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { name: name } // Optional: also save to auth metadata
        });

        if (userError) throw userError;

        // 2. Update Profile with Role and Details
        if (userData.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: role,
                    name: name,
                    desk_info: deskInfo
                })
                .eq('id', userData.user.id);

            if (profileError) throw profileError;
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
