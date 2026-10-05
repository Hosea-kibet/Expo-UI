export type VisitorPassChannel = "Email" | "WhatsApp" | "SMS";

export type VisitorPassDelivery = {
  channel: VisitorPassChannel;
  status: "sent" | "failed";
  error?: string;
};

export type VisitorPassResendResult = {
  documentId: string;
  name?: string;
  registrationReference?: string;
  deliveries: VisitorPassDelivery[];
  error?: string;
};

export const VISITOR_PASS_RESEND_BATCH_SIZE = 5;
