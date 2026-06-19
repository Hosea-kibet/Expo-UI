import type { Metadata } from "next";
import { VisitorRegistrationClient } from "@/src/components/visitor-registration-client";

export const metadata: Metadata = { title: "Visitor Registration - 2026 - AIAE" };

export default function VisitorRegistrationPage() {
  return <VisitorRegistrationClient />;
}
