import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}

export class EmailService {
  /**
   * Send email notification via Brevo SMTP (or Resend API fallback) with responsive Lumora AI HTML layout.
   */
  static async sendEmail({
    to,
    subject,
    title,
    message,
    actionText = "Open Lumora AI",
    actionUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    if (!to || !to.includes("@")) {
      return { success: false, error: "Invalid recipient email address" };
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5; }
    .container { max-width: 560px; margin: 30px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 9999px; color: #818cf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; line-height: 1.3; }
    .message { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 24px 0; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; text-align: center; }
    .footer { margin-top: 32px; border-top: 1px solid #27272a; pt: 16px; font-size: 11px; color: #71717a; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Lumora AI Alert</div>
    <h1 class="title">${title}</h1>
    <div class="message">${message.replace(/\n/g, "<br>")}</div>
    <div>
      <a href="${actionUrl}" class="btn">${actionText}</a>
    </div>
    <div class="footer">
      Sent by Lumora Finance AI • You are receiving this because your email notifications are enabled.
    </div>
  </div>
</body>
</html>
    `;

    const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || "b3cc77001@smtp-brevo.com";
    const pass = process.env.SMTP_PASS || "";
    const fromName = process.env.SMTP_FROM_NAME || "Lumora AI";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "yuvamr86@gmail.com";

    // If Brevo SMTP credentials (pass) are present, send via Nodemailer / Brevo SMTP
    if (pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
        });

        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject,
          html,
          text: `${title}\n\n${message}\n\n${actionUrl}`,
        });

        console.log(`[BREVO SMTP EMAIL SENT] Message ID: ${info.messageId} | To: ${to} | Subject: "${subject}"`);
        return { success: true };
      } catch (err) {
        console.error(`[BREVO SMTP ERROR] Failed to send email via Brevo SMTP:`, err);
      }
    }

    // Attempt Resend API if API Key is available
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            subject: subject,
            html: html,
          }),
        });

        if (res.ok) {
          console.log(`[RESEND EMAIL SENT] To: ${to} | Subject: "${subject}"`);
          return { success: true };
        }
      } catch (err) {
        console.error(`[RESEND DISPATCH FAILED]`, err);
      }
    }

    // Fallback/Dev mode console dispatch logging
    console.log(`=======================================================`);
    console.log(`[EMAIL DISPATCH SERVICE - BREVO CONFIG READY]`);
    console.log(`From: "${fromName}" <${fromEmail}>`);
    console.log(`To: ${to}`);
    console.log(`Host: ${host}:${port} (User: ${user})`);
    console.log(`Subject: ${subject}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log(`Note: Add SMTP_PASS in .env to send live emails via Brevo.`);
    console.log(`=======================================================`);

    return { success: true };
  }
}
