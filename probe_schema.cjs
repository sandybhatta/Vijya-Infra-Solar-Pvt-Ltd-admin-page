
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gyusscszusbfawtsxoqb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXNzY3N6dXNiZmF3dHN4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTA1MDQsImV4cCI6MjA4NTg2NjUwNH0.o-7Z610h96G3JUNVTddDT6Uqs0-WMZvYXOVEZ567DoE'

const supabase = createClient(supabaseUrl, supabaseKey)

const candidates = [
    'start_date', 'end_date',
    'project_start_date', 'project_end_date',
    'deadline', 'completion_date',
    'title', 'name', 'project_name',
    'description', 'notes',
    'budget', 'cost',
    'status', 'project_status'
]

async function probe() {
    console.log("Probing schema via INSERT...")
    for (const col of candidates) {
        // Try to insert a row with just this column (and maybe a valid one like lead_id if strict)
        // Actually, just sending the column is enough to trigger "Column not found"
        const payload = {}
        payload[col] = null // sending null is safe for types usually

        const { error } = await supabase.from('projects').insert([payload])

        if (error) {
            if (error.code === '42703' || error.message.includes('Could not find') || error.message.includes('not exist')) {
                 console.log(`[❌] ${col}: Missing`)
            } else if (error.code === '42501') { 
                console.log(`[✅] ${col}: Exists (RLS Blocked)`)
            } else {
                 // Other error (e.g. valid constraint failure) also implies existence
                 console.log(`[✅] ${col}: Exists (Error: ${error.message})`)
            }
        } else {
            console.log(`[✅] ${col}: Exists (Insert Success?!)`)
        }
    }
}

probe()
