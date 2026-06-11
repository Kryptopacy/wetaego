import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const email = `demo-${Date.now()}@pacygrills.com`
  console.log('Signing up:', email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'demo-password-123'
  })
  console.log('Result:')
  console.log('Error:', error)
  console.log('User:', data.user?.id)
  console.log('Session:', data.session ? 'Exists' : 'NULL')
}

test()
