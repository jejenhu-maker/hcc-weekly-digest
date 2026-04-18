// sendEmail.js — send the HCC digest as HTML email
const nodemailer = require('nodemailer');
const dayjs = require('dayjs');
const config = require('./config');

async function sendEmail(htmlContent) {
  const { from, to, smtpHost, smtpPort, smtpUser, smtpPass } = config.email;

  if (!smtpPass) {
    console.error('[Email] No EMAIL_PASS set. Skipping send.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const weekEnd = dayjs().format('YYYY-MM-DD');

  const mailOptions = {
    from: `"HCC Weekly Digest" <${from}>`,
    to,
    subject: `🔬 肝癌免疫治療與局部消融文獻週報 — ${weekEnd}`,
    html: htmlContent,
  };

  console.log(`[Email] Sending to ${to}…`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Sent! MessageId: ${info.messageId}`);
  return true;
}

module.exports = { sendEmail };
