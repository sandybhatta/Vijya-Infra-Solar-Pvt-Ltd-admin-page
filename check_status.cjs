
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gyusscszusbfawtsxoqb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXNzY3N6dXNiZmF3dHN4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTA1MDQsImV4cCI6MjA4NTg2NjUwNH0.o-7Z610h96G3JUNVTddDT6Uqs0-WMZvYXOVEZ567DoE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistingStatus() {
    console.log("Checking existing project statuses...")
    const { data, error } = await supabase.from('projects').select('project_status').limit(5)
    
    if (error) {
        console.error("Error fetching projects:", error.message)
    } else {
        if (data.length === 0) {
            console.log("No existing projects found to check.")
        } else {
            console.log("Found projects with statuses:", data.map(p => p.project_status))
        }
    }
}

checkExistingStatus()
