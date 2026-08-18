declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const SIGN_UP_CONVERSION_ID = "AW-18389275739/luArCLOVwOMcENuo2MBE";

export function trackGoogleAdsSignUp({
  transactionId,
  value = 1,
  currency = "USD",
}: {
  transactionId?: string;
  value?: number;
  currency?: string;
} = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: SIGN_UP_CONVERSION_ID,
    value,
    currency,
    ...(transactionId ? { transaction_id: transactionId } : {}),
  });
}

