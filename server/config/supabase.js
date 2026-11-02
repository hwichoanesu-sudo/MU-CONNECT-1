const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role for secure backend operations

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in backend!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
