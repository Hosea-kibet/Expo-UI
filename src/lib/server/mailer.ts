import nodemailer from "nodemailer";
import QRCode from "qrcode";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

function createMailerTransport() {
  const config = getMailerConfig();

  return {
    config,
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    }),
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
  const { config, transporter } = createMailerTransport();

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

export async function sendRegistrationConfirmationEmail({
  email,
  firstName,
  registrationReference,
}: {
  email: string;
  firstName: string;
  registrationReference: string;
}) {
  const { config, transporter } = createMailerTransport();

  const qrCodeDataUrl = await QRCode.toDataURL(registrationReference, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: {
      dark: "#173422",
      light: "#F4EFE4",
    },
  });

  const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
  const safeFirstName = escapeHtml(firstName || "there");
  const safeReference = escapeHtml(registrationReference);

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Your Agri Africa registration QR code",
    text: [
      `Hi ${firstName || "there"},`,
      "",
      "Your Agri Africa registration is confirmed.",
      `Registration reference: ${registrationReference}`,
      "",
      "A QR code for your registration reference is included in this email for easy check-in.",
      "Please keep this email handy for event entry updates.",
    ].join("\n"),
    attachments: [
      {
        filename: `${registrationReference}.png`,
        content: qrCodeBase64,
        encoding: "base64",
        cid: "registration-qr-code",
      },
    ],
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#173422;background:#f4efe4;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#fffdf8;border-radius:20px;padding:32px;text-align:center">
          <p style="margin:0 0 12px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#e26f2d">
            Registration complete
          </p>
          <h1 style="margin:0 0 16px;font-size:36px;line-height:1.1;color:#173422">You're on the guest list.</h1>
          <p style="margin:0 0 20px;font-size:18px;color:#425466">
            Hi ${safeFirstName}, your Agri Africa registration has been confirmed.
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#425466">
            Present this QR code at check-in, or use the registration reference below.
          </p>
          <img
            src="cid:registration-qr-code"
            alt="QR code for registration reference ${safeReference}"
            width="220"
            height="220"
            style="display:block;margin:0 auto 24px;border-radius:16px;background:#f4efe4;padding:14px"
          />
          <div style="margin:0 auto 24px;max-width:320px;border:1px dashed #d4c8a5;border-radius:14px;padding:16px;background:#f9f4e8">
            <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#8a7e5f">Registration reference</div>
            <div style="margin-top:8px;font-size:28px;font-weight:700;color:#173422">${safeReference}</div>
          </div>
          <p style="margin:0;font-size:14px;color:#6b7280">
            Keep this email handy. Event updates and entry details will be shared closer to the expo.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendEventWelcomeEmail({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
  const { config, transporter } = createMailerTransport();

  const safeFirstName = escapeHtml(firstName || "there");

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Welcome to Agri Africa Expo",
    text: [
      `Hi ${firstName || "there"},`,
      "",
      "Welcome to Agri Africa Expo.",
      "Your event confirmation is complete and we are glad to have you with us.",
      "",
      "Please keep an eye on your email for event updates and onsite guidance.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#173422;background:#f4efe4;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#fffdf8;border-radius:20px;padding:32px">
          <p style="margin:0 0 12px;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#e26f2d">
            Welcome to the event
          </p>
          <h1 style="margin:0 0 16px;font-size:34px;line-height:1.1;color:#173422">You're confirmed for Agri Africa Expo.</h1>
          <p style="margin:0 0 16px;font-size:18px;color:#425466">
            Hi ${safeFirstName}, your event confirmation is complete and we are excited to welcome you.
          </p>
          <p style="margin:0;font-size:15px;color:#425466">
            Watch your inbox for event updates, timing details, and any onsite guidance before the expo.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendContactEnquiryNotificationEmail({
  recipientEmail,
  name,
  email,
  enquiryType,
  message,
}: {
  recipientEmail: string;
  name: string;
  email: string;
  enquiryType: string;
  message: string;
}) {
  const { config, transporter } = createMailerTransport();
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeEnquiryType = escapeHtml(enquiryType);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  await transporter.sendMail({
    from: config.from,
    to: recipientEmail,
    replyTo: email,
    subject: `New ${enquiryType} from ${name}`,
    text: [
      "A new contact enquiry was submitted on the Expo website.",
      "",
      `Full name: ${name}`,
      `Email address: ${email}`,
      `Enquiry type: ${enquiryType}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#173422;background:#f4efe4;padding:24px">
        <div style="max-width:640px;margin:0 auto;background:#fffdf8;border-radius:18px;padding:28px">
          <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#e26f2d">
            New contact enquiry
          </p>
          <h1 style="margin:0 0 20px;font-size:30px;line-height:1.1;color:#173422">Someone needs a follow-up.</h1>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tbody>
              <tr>
                <td style="padding:8px 0;font-weight:700;vertical-align:top">Full name</td>
                <td style="padding:8px 0">${safeName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:700;vertical-align:top">Email address</td>
                <td style="padding:8px 0"><a href="mailto:${safeEmail}" style="color:#173422">${safeEmail}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:700;vertical-align:top">Enquiry type</td>
                <td style="padding:8px 0">${safeEnquiryType}</td>
              </tr>
            </tbody>
          </table>
          <div style="border:1px solid #d4c8a5;border-radius:14px;padding:18px;background:#f9f4e8">
            <div style="margin-bottom:10px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8a7e5f">
              Message
            </div>
            <div style="font-size:15px;color:#425466">${safeMessage}</div>
          </div>
        </div>
      </div>
    `,
  });
}
