/* eslint-disable no-console, @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseSMTP() {
  console.log('Initiating test signup to trigger Supabase SMTP (via Resend)...');
  
  // We use a + alias so it routes to your main Gmail inbox without cluttering your real account
  const testEmail = 'kryptopacy+smtptest2@gmail.com';
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!@#',
  });

  if (error) {
    console.error('❌ Supabase Auth Error:', error.message);
  } else {
    console.log('✅ Signup triggered successfully!');
    console.log(`Please check the inbox for: ${testEmail} (this routes to kryptopacy@gmail.com)`);
    console.log('You should see a "Confirm your signup" email sent from hello@ourmenuos.online.');
  }
}

testSupabaseSMTP();
