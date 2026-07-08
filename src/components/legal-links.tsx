import Link from "next/link";

export function LegalFooterLinks() {
  return (
    <>
      <Link href="/privacy-policy">Privacy Policy</Link>
      <span aria-hidden="true"> · </span>
      <Link href="/terms-and-conditions">Terms and Conditions</Link>
    </>
  );
}
