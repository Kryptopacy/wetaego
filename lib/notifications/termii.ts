const TERMII_API_KEY = process.env.TERMII_API_KEY
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID

export async function sendWhatsAppMessage(toPhoneNumber: string, message: string) {
  if (!TERMII_API_KEY || !TERMII_SENDER_ID) {
    console.warn(`TERMII keys missing. Mocking WhatsApp message to ${toPhoneNumber}: ${message}`)
    return true
  }

  // Strip all non-digit characters (spaces, +, dashes, parentheses)
  let formattedNumber = toPhoneNumber.replace(/\D/g, '')
  // If it's a local number starting with 0, default to 234 (Nigeria). Otherwise assume international.
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '234' + formattedNumber.slice(1)
  }

  const response = await fetch('https://api.ng.termii.com/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: formattedNumber,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'whatsapp',
      api_key: TERMII_API_KEY,
    }),
  })

  const data = await response.json()
  
  if (data.message !== 'Successfully Sent') {
    console.error('Failed to send WhatsApp message via Termii:', data)
    return false
  }

  return true
}
