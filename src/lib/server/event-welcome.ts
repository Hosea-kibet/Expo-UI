export function eventWelcomeContent(firstName: string, lastName: string, cmsMessage: string) {
  const recipientName = [firstName, lastName].map((name) => name.trim()).filter(Boolean).join(" ") || "there";

  return {
    eyebrow: "Welcome to the event",
    heading: "You're confirmed for Agri Africa Expo.",
    introduction:
      `Hi ${recipientName},\nWelcome to the 2026 AIAE. We're delighted to host you as our valued guest.`,
    cmsMessage: cmsMessage.trim(),
  };
}

export function eventWelcomePlainText(firstName: string, lastName: string, cmsMessage: string) {
  const content = eventWelcomeContent(firstName, lastName, cmsMessage);

  return [
    content.eyebrow.toUpperCase(),
    "",
    content.heading,
    "",
    content.introduction,
    "",
    content.cmsMessage,
  ].join("\n");
}
