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
  lastName,
  registrationReference,
}: {
  email: string;
  firstName: string;
  lastName: string;
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
  const safeLastName = escapeHtml(lastName || "");
  const safeFullName = `${safeFirstName} ${safeLastName}`.trim();
  const safeReference = escapeHtml(registrationReference);

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Your 2026 AIAE Visitor Pass",
    text: [
      "YOUR VISITOR PASS",
      "",
      `Dear ${[firstName, lastName].filter(Boolean).join(" ") || "Visitor"},`,
      "",
      "Thank you for registering to attend the 2026 Africa International Agricultural Expo (AIAE).",
      "We are pleased to confirm your registration and look forward to welcoming you to Africa's premier agricultural trade exhibition.",
      "",
      `Reference ID: ${registrationReference}`,
      "Your QR code is attached to this email.",
      "",
      "EVENT DETAILS",
      "Theme: Gathering Global Agricultural Wisdom to Promote Modernization of African Agriculture",
      "Dates: 23–25 October 2026",
      "Venue: Kenyatta International Convention Centre (KICC), Nairobi, Kenya",
      "",
      "ENTRY INSTRUCTIONS",
      "Your Visitor Pass consists of the QR Code and Reference ID shown above.",
      "Upon arrival at the venue, present either your QR Code for quick scanning or your Reference ID for manual verification if required.",
      "You may present your pass on your mobile phone or as a printed copy.",
      "",
      "We look forward to welcoming you to the 2026 AIAE and wish you a rewarding and enjoyable experience.",
      "If you require any assistance before the event, please contact the Secretariat.",
      "",
      "Kind regards,",
      "Agri-Africa Exhibition Limited",
      "www.agriexpo.africa",
      "info@agriexpo.africa",
      "+254 710883625",
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
      <div style="margin:0;background:#f4efe4;padding:24px 12px;font-family:Arial,sans-serif;line-height:1.6;color:#173422">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
          <div style="background:#173422;padding:28px 32px;border-bottom:6px solid #e26f2d;color:#ffffff">
            <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#f2a36f">Visitor Pass</div>
            <div style="margin-top:8px;font-size:28px;font-weight:700;line-height:1.25">2026 Africa International Agricultural Expo (AIAE)</div>
          </div>

          <div style="padding:32px">
            <h1 style="margin:0 0 22px;font-size:30px;line-height:1.2;color:#173422">YOUR VISITOR PASS</h1>

            <div style="margin-bottom:28px;padding:22px;text-align:center;border:1px solid #d8dfd9;border-radius:12px;background:#f9fbf9">
              <img src="cid:registration-qr-code" alt="QR code for reference ${safeReference}" width="220" height="220" style="display:block;margin:0 auto 16px;max-width:100%;height:auto" />
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#64736a">Reference ID</div>
              <div style="margin-top:4px;font-size:28px;font-weight:700;letter-spacing:.08em;color:#173422">${safeReference}</div>
            </div>

            <p style="margin:0 0 18px;font-size:18px">Dear <strong>${safeFullName}</strong>,</p>
            <p style="margin:0 0 16px">Thank you for registering to attend the <strong>2026 Africa International Agricultural Expo (AIAE).</strong></p>
            <p style="margin:0 0 26px">We are pleased to confirm your registration and look forward to welcoming you to Africa's premier agricultural trade exhibition.</p>

            <h2 style="margin:0 0 16px;font-size:22px;color:#173422">Event Details</h2>
            <p style="margin:0 0 16px"><strong>Theme</strong><br /><em>Gathering Global Agricultural Wisdom to Promote Modernization of African Agriculture</em></p>
            <p style="margin:0 0 16px"><strong>Dates</strong><br /><strong>23–25 October 2026</strong></p>
            <p style="margin:0 0 26px"><strong>Venue</strong><br /><strong>Kenyatta International Convention Centre (KICC), Nairobi, Kenya</strong></p>

            <h2 style="margin:0 0 16px;font-size:22px;color:#173422">Entry Instructions</h2>
            <p style="margin:0 0 14px">Your <strong>Visitor Pass</strong> consists of the <strong>QR Code</strong> and <strong>Reference ID</strong> shown above.</p>
            <p style="margin:0 0 8px">Upon arrival at the venue, simply present either:</p>
            <ul style="margin:0 0 18px;padding-left:24px">
              <li style="margin-bottom:8px">Your <strong>QR Code</strong> for quick scanning; or</li>
              <li>Your <strong>Reference ID</strong> for manual verification if required.</li>
            </ul>
            <p style="margin:0 0 16px">You may present your pass on your mobile phone or as a printed copy.</p>
            <p style="margin:0 0 16px">We look forward to welcoming you to the 2026 AIAE and wish you a rewarding and enjoyable experience.</p>
            <p style="margin:0 0 22px">If you require any assistance before the event, please contact the Secretariat.</p>

            <p style="margin:0 0 4px">Kind regards,</p>
            <p style="margin:0 0 18px"><strong>Agri-Africa Exhibition Limited</strong></p>
            <p style="margin:0;color:#425466">
              🌐 <a href="https://www.agriexpo.africa" style="color:#147b9e">www.agriexpo.africa</a><br />
              ✉ <a href="mailto:info@agriexpo.africa" style="color:#147b9e">info@agriexpo.africa</a><br />
              ☎ <a href="tel:+254710883625" style="color:#147b9e">+254 710883625</a>
            </p>
            <p style="margin:24px 0 0;font-style:italic;color:#425466">Gathering Global Agricultural Wisdom to Promote Modernization of African Agriculture.</p>
          </div>
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
