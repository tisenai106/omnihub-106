'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase'; // Regular client for profile updates if we want to use RLS, but Admin is safer for "Admin managing other users"

export async function deleteUser(userId: string) {
    try {
        // 1. Unassign tickets first to avoid FK constraint error
        const { error: ticketError } = await supabaseAdmin
            .from('tickets')
            .update({ attendant_user_id: null })
            .eq('attendant_user_id', userId);

        if (ticketError) {
            console.error('Error unassigning tickets:', ticketError);
            // Decide if we stop or continue. Usually safe to continue if just no rows found, but error means DB issue.
            // However, Supabase often returns no error for 0 rows updated.
            // If strictly FK failed, we can't proceed.
        }

        // 2. Delete Profile (manually to avoid Foreign Key constraint error if no CASCADE is set)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            // If this fails, the auth delete below will likely fail too, but we proceed to try.
        }

        // 3. Delete the user from Auth
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUser(userId: string, data: { name?: string; desk_info?: string; role?: string }) {
    try {
        // Update Profile Data (Public table)
        const updates: any = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.desk_info !== undefined) updates.desk_info = data.desk_info;
        if (data.role !== undefined) updates.role = data.role;

        if (Object.keys(updates).length > 0) {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
    }
}
