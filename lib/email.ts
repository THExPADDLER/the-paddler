import nodemailer from "nodemailer"

type SendEmailOptions = {
  to?: string
  subject: string
  text: string
}

export const sendEmail = async ({ to, subject, text }: SendEmailOptions) => {
  if (!to) {
    console.warn("EMAIL SKIPPED: recipient missing.")
    return { sent: false, reason: "recipient_missing" }
  }

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = process.env.SMTP_FROM || user

  if (!host || !user || !pass || !from) {
    console.warn("EMAIL SKIPPED: SMTP env is not configured.")
    return { sent: false, reason: "smtp_not_configured" }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  })

  return { sent: true }
}
