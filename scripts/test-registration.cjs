const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const crypto = require("node:crypto");
const { loadEnvConfig } = require("@next/env");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

// Run the application handlers against real Strapi, with outbound messages
// captured in this process. Only the disposable test attendee is removed.
function createHarness() {
  loadEnvConfig(root);
  process.chdir(root);
  const strapiOrigin = new URL(process.env.STRAPI_URL).origin;
  const originalResolve = Module._resolveFilename;
  const originalTsLoader = require.extensions[".ts"];
  Module._resolveFilename = function (request, ...args) {
    return originalResolve.call(this, request.startsWith("@/")
      ? path.join(root, request.slice(2)) : request, ...args);
  };
  require.extensions[".ts"] = (module, filename) => {
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };

  const emails = [];
  const providerEvents = [];
  const nodemailer = require("nodemailer");
  const originalTransport = nodemailer.createTransport;
  nodemailer.createTransport = () => ({
    async sendMail(message) {
      assert.ok(message.to.endsWith("@example.invalid"), "Only dummy email recipients are allowed");
      const transport = originalTransport({ streamTransport: true, buffer: true, newline: "unix" });
      const rendered = await transport.sendMail(message);
      emails.push({ ...message, rendered: rendered.message });
      return rendered;
    },
  });

  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.url ?? input);
    if (url.origin === strapiOrigin) {
      return originalFetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(15000) });
    }
    if (url.href === process.env.BELIO_TOKEN_URL ||
        url.href === "https://account.belio.co.ke/realms/api/protocol/openid-connect/token") {
      providerEvents.push({ type: "sms-auth" });
      return Response.json({ access_token: "local-test-token" });
    }
    if (url.href.startsWith(process.env.BELIO_MESSAGE_BASE_URL || "https://api.belio.co.ke/message")) {
      const payload = JSON.parse(init.body);
      providerEvents.push({ type: "sms", payload });
      return Response.json({ success: true });
    }
    if (url.hostname === "graph.facebook.com" && url.pathname.endsWith("/media")) {
      const pdf = init.body.get("file");
      const bytes = Buffer.from(await pdf.arrayBuffer());
      assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
      const { PDFDocument } = require("pdf-lib");
      assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
      providerEvents.push({ type: "whatsapp-pdf", bytes: bytes.length });
      return Response.json({ id: "local-test-media" });
    }
    if (url.hostname === "graph.facebook.com" && url.pathname.endsWith("/messages")) {
      providerEvents.push({ type: "whatsapp", payload: JSON.parse(init.body) });
      return Response.json({ messages: [{ id: "local-test-message" }] });
    }
    throw new Error(`Unexpected outbound request blocked: ${url.origin}`);
  };

  const { POST } = require(path.join(root, "app/api/registration/request-otp/route.ts"));
  const { NextRequest } = require("next/server");
  const { authOptions } = require(path.join(root, "auth.ts"));
  const { AuthHandler } = require(path.join(root, "node_modules/next-auth/core/index.js"));
  const cookies = {};
  const email = `registration-test-${crypto.randomUUID()}@example.invalid`;
  const registration = {
    gender: "Rather not say", firstName: "Registration", lastName: "Test",
    email, countryCode: "+254", phone: "0712345678", country: "Kenya", city: "Nairobi",
    company: "Disposable registration test", jobTitle: "Tester", consent: true,
  };

  async function submit(body) {
    return POST(new NextRequest("http://localhost:3000/api/registration/request-otp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }));
  }
  async function auth(action, method = "GET", body = {}, providerId) {
    const result = await AuthHandler({
      options: { ...authOptions, secret: process.env.NEXTAUTH_SECRET },
      req: { action, method, body, providerId, cookies, query: {}, headers: { host: "localhost:3000" } },
    });
    for (const cookie of result.cookies ?? []) {
      if (cookie.options?.maxAge === 0) delete cookies[cookie.name];
      else cookies[cookie.name] = cookie.value;
    }
    return result;
  }
  async function readAttendee() {
    const url = new URL("/api/attendees", process.env.STRAPI_URL);
    url.searchParams.set("filters[email][$eq]", email);
    const response = await originalFetch(url, {
      headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }, signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200, "Strapi attendee read must succeed");
    return (await response.json()).data[0] ?? null;
  }
  async function close() {
    try {
      const attendee = await readAttendee();
      if (attendee) {
        assert.equal(attendee.email, email);
        const response = await originalFetch(new URL(`/api/attendees/${attendee.documentId}`, process.env.STRAPI_URL), {
          method: "DELETE", headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
          signal: AbortSignal.timeout(15000),
        });
        assert.ok(response.ok, `Disposable attendee cleanup failed: ${response.status}`);
        assert.equal(await readAttendee(), null);
      }
      console.log("Disposable attendee cleanup: PASS");
    } finally {
      global.fetch = originalFetch;
      nodemailer.createTransport = originalTransport;
      Module._resolveFilename = originalResolve;
      if (originalTsLoader) require.extensions[".ts"] = originalTsLoader;
      else delete require.extensions[".ts"];
    }
  }
  return { email, registration, emails, providerEvents, submit, auth, readAttendee, close };
}

async function run() {
  const test = createHarness();
  try {
    const invalid = await test.submit({ ...test.registration, consent: false });
    assert.equal(invalid.status, 400);
    assert.equal(await test.readAttendee(), null);
    console.log("Invalid registration rejected without creating attendee: PASS");

    const requested = await test.submit(test.registration);
    const requestResult = await requested.json();
    assert.equal(requested.status, 200, JSON.stringify(requestResult));
    assert.equal(requestResult.ok, true);
    assert.equal(test.emails.length, 1);
    const otp = test.emails[0].text.match(/code is: (\d{6})/)[1];
    const pending = await test.readAttendee();
    assert.equal(pending.registrationStatus, "pending-verification");
    assert.equal(pending.phone, "712345678");
    assert.equal(pending.fullPhoneNumber, "+254712345678");
    assert.ok(pending.otpHash && pending.otpSalt && pending.otpExpiresAt);
    assert.ok(!JSON.stringify(requestResult).includes(otp), "OTP must not be returned to client");
    console.log("Form submission, pending attendee and rendered OTP email: PASS");

    const cooldown = await test.submit({ email: test.email, resend: true });
    assert.equal(cooldown.status, 429);
    assert.equal(test.emails.length, 1);
    console.log("Immediate resend throttled: PASS");

    const { body: csrf } = await test.auth("csrf");
    const wrongCode = otp === "000000" ? "000001" : "000000";
    const rejected = await test.auth("callback", "POST", {
      email: test.email, otp: wrongCode, csrfToken: csrf.csrfToken, json: "true",
    }, "attendee-otp");
    assert.match(rejected.redirect, /CredentialsSignin/);
    assert.equal((await test.readAttendee()).otpAttemptCount, 1);
    console.log("Incorrect OTP rejected and attempt recorded: PASS");

    const verified = await test.auth("callback", "POST", {
      email: test.email, otp, csrfToken: csrf.csrfToken,
      callbackUrl: "http://localhost:3000/visitor-registration", json: "true",
    }, "attendee-otp");
    assert.ok(!verified.redirect?.includes("error="), verified.redirect);
    const attendee = await test.readAttendee();
    assert.equal(attendee.registrationStatus, "verified");
    assert.equal(attendee.attendanceStatus, "registered");
    assert.match(attendee.registrationReference, /^V\d{3}[A-Z]+$/);
    assert.equal(attendee.otpHash, null);
    assert.equal(attendee.otpSalt, null);
    assert.equal(attendee.otpExpiresAt, null);
    assert.ok(attendee.otpUsedAt);
    console.log("OTP verification and Strapi registration reference: PASS");

    const session = await test.auth("session");
    assert.equal(session.body.user.email, test.email);
    assert.equal(session.body.user.registrationReference, attendee.registrationReference);
    assert.equal(session.body.user.role, "attendee");
    console.log("Signed session contains attendee role and reference: PASS");

    const passEmail = test.emails.find(message => message.subject === "Your 2026 AIAE Visitor Pass");
    assert.ok(passEmail?.text.includes(attendee.registrationReference));
    const qr = Buffer.from(passEmail.attachments[0].content, "base64");
    assert.equal(qr.subarray(1, 4).toString(), "PNG");
    assert.equal(test.providerEvents.filter(event => event.type === "sms").length, 1);
    assert.equal(test.providerEvents.filter(event => event.type === "whatsapp-pdf").length, 1);
    const whatsapp = test.providerEvents.find(event => event.type === "whatsapp");
    assert.ok(JSON.stringify(whatsapp.payload).includes(attendee.registrationReference));
    console.log("Visitor pass email/QR, SMS payload and WhatsApp PDF/template: PASS (delivery captured locally)");

    const { verifyAttendeeOtp } = require(path.join(root, "src/lib/server/attendee-otp.ts"));
    assert.equal(await verifyAttendeeOtp(test.email, otp), null);
    const duplicate = await test.submit(test.registration);
    assert.ok([409, 429].includes(duplicate.status));
    assert.equal(test.emails.length, 2);
    console.log("Used OTP and duplicate registration rejected: PASS");
    console.log("Full backend registration: PASS; external delivery was simulated.");
  } finally {
    await test.close();
  }
}

module.exports = { createHarness };
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
