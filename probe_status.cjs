
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gyusscszusbfawtsxoqb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXNzY3N6dXNiZmF3dHN4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTA1MDQsImV4cCI6MjA4NTg2NjUwNH0.o-7Z610h96G3JUNVTddDT6Uqs0-WMZvYXOVEZ567DoE'

const supabase = createClient(supabaseUrl, supabaseKey)

const statusCandidates = [
    'Planned', 'PLANNED', 
    'Pending', 'pending',
    'Active', 'active',
    'In Progress', 'in_progress', 'ongoing', 'Ongoing',
    'Completed', 'completed',
    'On Hold', 'on_hold',
    'Cancelled', 'cancelled',
    'Draft', 'draft'
]

async function probeStatus() {
    console.log("Probing project_status values...")
    
    // We need a valid project_name to avoid the NOT NULL constraint we just hit
    const basePayload = { project_name: "Status Probe " + Date.now() }

    for (const status of statusCandidates) {
        const payload = { ...basePayload, project_status: status }
        
        // We expect:
        // - "violates check constraint" -> Invalid Status
        // - "violates row-level security" -> Valid Status (but blocked by RLS)
        // - Success -> Valid Status
        
        const { error } = await supabase.from('projects').insert([payload])

        if (error) {
            if (error.message.includes('check constraint')) {
                console.log(`[❌] '${status}': Invalid (Check Constraint)`)
            } else if (error.code === '42501') {
                 console.log(`[✅] '${status}': Valid (RLS Violation)`)
            } else {
                 console.log(`[?] '${status}': Error ${error.code} - ${error.message}`)
            }
        } else {
             console.log(`[✅] '${status}': Valid (Success)`)
        }
    }
}

probeStatus()
