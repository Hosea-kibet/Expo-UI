import type { Metadata } from "next";
import { ContactPageClient } from "@/src/components/contact-page-client";

export const metadata: Metadata = { title: "Contact Us - Agri Africa" };

export default function ContactPage() {
  return <ContactPageClient />;
}
