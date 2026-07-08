import { NextRequest, NextResponse } from "next/server";
import {
  sanitizeContactEnquiryInput,
  validateContactEnquiryInput,
} from "@/src/lib/contact-enquiry";
import { sendContactEnquiryNotificationEmail } from "@/src/lib/server/mailer";
import { createContactEnquiry } from "@/src/lib/server/strapi-admin";

const CONTACT_NOTIFICATION_EMAIL = "expo@agriexpo.africa";
const CONTACT_VALIDATION_ERRORS = new Set([
  "Full name is required.",
  "Email address is required.",
  "Invalid email address.",
  "Select a valid enquiry type.",
  "Message is required.",
  "Message must be at least 10 characters long.",
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const enquiry = sanitizeContactEnquiryInput(body);
    validateContactEnquiryInput(enquiry);

    let notified = false;
    let warning: string | undefined;
    let notificationError: string | null = null;
    let notifiedAt: string | null = null;

    try {
      await sendContactEnquiryNotificationEmail({
        recipientEmail: CONTACT_NOTIFICATION_EMAIL,
        name: enquiry.name,
        email: enquiry.email,
        enquiryType: enquiry.enquiryType,
        message: enquiry.message,
      });
      notified = true;
      notifiedAt = new Date().toISOString();
    } catch (error) {
      notificationError =
        error instanceof Error ? error.message : "Unable to send contact enquiry notification.";
      warning =
        "Your enquiry was saved in the CMS, but the email notification could not be sent right now.";
    }

    const savedEnquiry = await createContactEnquiry({
      fullName: enquiry.name,
      email: enquiry.email,
      enquiryType: enquiry.enquiryType,
      message: enquiry.message,
      submittedAt: new Date().toISOString(),
      source: "expo-contact-page",
      notificationStatus: notified ? "sent" : "failed",
      notifiedAt,
      notificationError,
    });

    return NextResponse.json({
      ok: true,
      notified,
      warning,
      enquiry: savedEnquiry,
    });
  } catch (error) {
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : error instanceof Error && CONTACT_VALIDATION_ERRORS.has(error.message)
          ? 400
          : 500;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to submit your enquiry.",
      },
      { status },
    );
  }
}
