const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function createSubaccount(bankCode: string, accountNumber: string, businessName: string) {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('PAYSTACK_SECRET_KEY is missing. Mocking subaccount creation.')
    return `ACCT_MOCK_${accountNumber}`
  }

  const response = await fetch('https://api.paystack.co/subaccount', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 1.5, // The platform fee (e.g. 1.5%)
    }),
  })

  const data = await response.json()
  if (!data.status) {
    throw new Error(data.message || 'Failed to create Paystack Subaccount')
  }

  return data.data.subaccount_code
}

export async function initializeTransaction(
  amountMinor: number,
  email: string,
  subaccountCode: string,
  reference: string,
  callbackUrl?: string
) {
  if (!PAYSTACK_SECRET_KEY) {
    console.warn('PAYSTACK_SECRET_KEY is missing. Mocking transaction initialization.')
    return callbackUrl 
      ? `https://checkout.paystack.com/mock_${reference}?redirect=${encodeURIComponent(callbackUrl)}`
      : `https://checkout.paystack.com/mock_${reference}`
  }

  const payload: any = {
    amount: amountMinor,
    email,
    reference,
    bearer: 'subaccount', // The business pays the Paystack processing fees
  }

  if (subaccountCode) {
    payload.subaccount = subaccountCode
  }

  if (callbackUrl) {
    payload.callback_url = callbackUrl
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction')
  }

  return data.data.authorization_url
}
