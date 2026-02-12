import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim()
    }
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function check() {
    try {
        const { data: u1, error: e1 } = await supabase.from('Users').select('*')
        if (e1) console.log('RESULT_USERS_CAP: ERROR ' + e1.message)
        else console.log('RESULT_USERS_CAP: COUNT ' + u1.length)

        const { data: u2, error: e2 } = await supabase.from('Users').select('*')
        if (e2) console.log('RESULT_USERS_LOW: ERROR ' + e2.message)
        else console.log('RESULT_USERS_LOW: COUNT ' + u2.length)

        const { data: leads, error: eL } = await supabase.from('leads').select('*')
        if (eL) console.log('RESULT_LEADS: ERROR ' + eL.message)
        else console.log('RESULT_LEADS: COUNT ' + leads.length)
    } catch (err) {
        console.log('FATAL: ' + err.message)
    }
}

check()
