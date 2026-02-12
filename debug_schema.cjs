
const { createClient } = require('@supabase/supabase-js')

// Hardcoded for debugging purposes only
const supabaseUrl = 'https://gyusscszusbfawtsxoqb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXNzY3N6dXNiZmF3dHN4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTA1MDQsImV4cCI6MjA4NTg2NjUwNH0.o-7Z610h96G3JUNVTddDT6Uqs0-WMZvYXOVEZ567DoE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Fetching project schema info...')
    const { data, error } = await supabase.from('projects').select('*').limit(1)
    
    if (error) {
        console.error('Error fetching projects:', error)
         // Try sending an invalid column to get a hint
         const { error: error2 } = await supabase.from('projects').select('non_existent_column').limit(1)
         if (error2) console.log('Hint from error:', error2.message, error2.hint)

    } else {
        if (data && data.length > 0) {
            console.log('Project Keys:', Object.keys(data[0]))
        } else {
            console.log('No projects found. Trying to insert dummy to trigger schema error...')
            // Try to insert with just status, maybe it returns error with required columns
            const { error: insertError } = await supabase.from('projects').insert([{ project_status: 'planned' }]).select()
            if (insertError) {
                 console.log('Insert Error:', insertError.message, insertError.details, insertError.hint)
            }
        }
    }
}

checkSchema()
