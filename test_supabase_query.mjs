import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log("Testing MonthCard specific query...");
    const { data, error } = await supabase
        .from('campanas')
        .select('*')
        .eq('business_id', '10db8ed7-fa79-4092-9bae-760fdad63c75')
        .eq('mes', 4)
        .or(`anio.eq.2026,anio.is.null`)
        .order('semana_del_mes', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Query failed:", error);
    } else {
        console.log(`Query succeeded! Found ${data?.length} rows.`);
        console.log(JSON.stringify(data, null, 2));
    }
}


