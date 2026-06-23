import nodemailer from "nodemailer";

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME ?? "Agri Africa";

  if (!host || !user || !pass || !fromEmail) {
    throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL must be configured.");
  }

  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE ?? "false") === "true",
    auth: { user, pass },
    from: `${fromName} <${fromEmail}>`,
  };
}

export async function sendRegistrationOtpEmail({
  email,
  firstName,
  otp,
}: {
  email: string;
  firstName: string;
  otp: string;
}) {
  const config = getMailerConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Your Agri Africa verification code",
    text: [
      `Hi ${firstName || "there"},`,
      "",
      `Your Agri Africa verification code is: ${otp}`,
      "",
      "This code expires in 10 minutes.",
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#173422">
        <p>Hi ${firstName || "there"},</p>
        <p>Your Agri Africa verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.18em">${otp}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });
}
