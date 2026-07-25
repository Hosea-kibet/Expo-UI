export function eventWelcomeContent(firstName: string, cmsMessage: string) {
  const recipientName = firstName.trim() || "there";

  return {
    eyebrow: "Welcome to the event",
    heading: "You're confirmed for Agri Africa Expo.",
    introduction:
      `Hi ${recipientName}, your event confirmation is complete and we are excited to welcome you.`,
    cmsMessage: cmsMessage.trim(),
  };
}

export function eventWelcomePlainText(firstName: string, cmsMessage: string) {
  const content = eventWelcomeContent(firstName, cmsMessage);

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
