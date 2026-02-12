
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gyusscszusbfawtsxoqb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXNzY3N6dXNiZmF3dHN4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTA1MDQsImV4cCI6MjA4NTg2NjUwNH0.o-7Z610h96G3JUNVTddDT6Uqs0-WMZvYXOVEZ567DoE'

const supabase = createClient(supabaseUrl, supabaseKey)

const candidates = [
    'finish_date', 'estimated_end_date', 'estimated_completion', 'completion_date',
    'date_end', 'end', 'stop_date', 'closed_at', 'delivery_date', 
    'project_deadline', 'timeline_end', 'target_completion_date',
    'expected_end_date', 'installation_date', 'install_date',
    'system_size', 'system_type', 'capacity', 'panel_count'
]


async function checkColumns() {
    console.log("Checking columns detailed...")
    for (const col of candidates) {
        const { error } = await supabase.from('projects').select(col).limit(1)
        
        if (error) {
            if (error.code === 'PGRST301' || error.message.includes('Could not find') || error.message.includes('not exist')) {
                console.log(`[❌] ${col}: Missing`)
            } else {
                 console.log(`[?] ${col}: Error ${error.code} - ${error.message}`)
            }
        } else {
             console.log(`[✅] ${col}: Exists`)
        }
    }
    // Also check current known good ones to verify script works
    // console.log("Verifying known good...")
    // const { error: e2 } = await supabase.from('projects').select('created_at').limit(1)
    // if (!e2) console.log("[✅] created_at: Exists (Verified)")
}

checkColumns()
