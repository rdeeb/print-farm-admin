import { Resend } from 'resend'
import { ReactElement } from 'react'

// Lazy singleton — avoids build-time "Missing API key" error when RESEND_API_KEY is not set
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: ReactElement
}

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Dev mode: log instead of sending
    console.log('[email] DEV MODE - would send email:', { to, subject })
    return
  }

  try {
    const from = process.env.EMAIL_FROM ?? 'notifications@3dfarmadmin.com'
    const { error } = await getResend().emails.send({ from, to, subject, react })
    if (error) {
      console.error('[email] Resend error:', error)
      return
    }
  } catch (err) {
    console.error('[email] Failed to send email:', err)
    return
  }
}
