import type { Metadata } from "next";
import { ContactPageClient } from "@/src/components/contact-page-client";
import { getHomepageSnapshot } from "@/src/lib/homepage-cms";

export const metadata: Metadata = { title: "Contact Us - Agri Africa" };

export default async function ContactPage() {
  const homepage = await getHomepageSnapshot();

  return (
    <ContactPageClient
      contact={{
        email: homepage.email,
        phone: homepage.phone,
        address: homepage.address,
      }}
    />
  );
}
