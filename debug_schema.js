
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    const { data, error } = await supabase.from('projects').select('*').limit(1)
    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Project Keys:', data && data.length > 0 ? Object.keys(data[0]) : 'No projects found')
        if (data && data.length > 0) console.log('Sample:', data[0])
    }
}

checkSchema()
