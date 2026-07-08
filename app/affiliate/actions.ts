'use server'

import { createClient } from '@/lib/supabase/server'
import { createTransferRecipient } from '@/lib/payments/paystack'
import { redirect } from 'next/navigation'

export async function registerAffiliate(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) {
    throw new Error('You must be logged in to register as an affiliate')
  }

  const referralCode = formData.get('referral_code') as string
  const bankCode = formData.get('bank_code') as string
  const accountNumber = formData.get('account_number') as string
  const accountName = formData.get('account_name') as string // we'll use this as business_name for paystack

  if (!referralCode || !bankCode || !accountNumber || !accountName) {
    throw new Error('All fields are required')
  }

  // 1. Create Paystack Transfer Recipient
  let recipientCode = ''
  try {
    recipientCode = await createTransferRecipient(accountName, accountNumber, bankCode)
  } catch (error) {
    console.error('Failed to create transfer recipient', error)
    throw new Error('Failed to verify bank details with Paystack. Please check your account number and bank code.')
  }

  // 2. Create Affiliate record
  const { error: insertError } = await supabase
    .from('affiliates')
    .insert({
      user_id: userData.user.id,
      referral_code: referralCode,
      paystack_recipient_code: recipientCode,
      status: 'active'
    })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('That referral code is already taken. Please choose another one.')
    }
    console.error('DB Insert error', insertError)
    throw new Error('Failed to register affiliate')
  }

  redirect('/affiliate/dashboard')
}
