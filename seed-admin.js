const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load envs manually since we are running via node
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envs = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envs[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
    }
});

const SUPABASE_URL = envs.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envs.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
    const email = 'admin@tvsenai.com';
    const password = 'admin123'; // Default password

    console.log(`Creating user ${email}...`);

    // 1. Check if user exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === email);

    let userId;

    if (existingUser) {
        console.log('⚠️ User already exists. Updating role...');
        userId = existingUser.id;
    } else {
        // 2. Create User
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (error) {
            console.error('❌ Error creating user:', error.message);
            return;
        }
        userId = data.user.id;
        console.log('✅ Auth User created.');
    }

    // 3. Force Role to super_admin (Upsert)
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'super_admin'
        });

    if (profileError) {
        console.error('❌ Error updating profile:', profileError.message);
    } else {
        console.log('🎉 SUCCESS! Super Admin created.');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('👉 Go to /admin and login!');
    }
}

createAdmin();
