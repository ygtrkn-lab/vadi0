'use client';

import Script from 'next/script';

export type GoogleCustomerReviewsProduct = {
  gtin: string;
};

export type GoogleCustomerReviewsOptInProps = {
  merchantId: number;
  orderId: string;
  email: string;
  deliveryCountry: string;
  estimatedDeliveryDate: string; // YYYY-MM-DD
  products?: GoogleCustomerReviewsProduct[];
};

export default function GoogleCustomerReviewsOptIn(props: GoogleCustomerReviewsOptInProps) {
  const { merchantId, orderId, email, deliveryCountry, estimatedDeliveryDate, products } = props;

  // Required fields must be present; otherwise do nothing.
  if (!merchantId || !orderId || !email || !deliveryCountry || !estimatedDeliveryDate) {
    return null;
  }

  const payload = {
    merchant_id: merchantId,
    order_id: orderId,
    email,
    delivery_country: deliveryCountry,
    estimated_delivery_date: estimatedDeliveryDate,
    ...(products?.length ? { products } : {}),
  };

  // We intentionally set the global callback *before* loading platform.js so
  // the onload=renderOptIn query param can call it safely.
  const initScript = `
(function () {
  try {
    window.__gcrOptInRendered = window.__gcrOptInRendered || false;

    window.renderOptIn = function () {
      try {
        if (window.__gcrOptInRendered) return;
        if (!window.gapi || !window.gapi.load) return;

        window.gapi.load('surveyoptin', function () {
          try {
            if (window.__gcrOptInRendered) return;
            window.gapi.surveyoptin.render(${JSON.stringify(payload)});
            window.__gcrOptInRendered = true;
          } catch (e) {
            console.warn('[GCR] surveyoptin.render failed', e);
          }
        });
      } catch (e) {
        console.warn('[GCR] renderOptIn failed', e);
      }
    };
  } catch (e) {
    console.warn('[GCR] init failed', e);
  }
})();
`;

  return (
    <>
      <Script id="gcr-optin-init" strategy="beforeInteractive">
        {initScript}
      </Script>
      <Script
        src="https://apis.google.com/js/platform.js?onload=renderOptIn"
        strategy="afterInteractive"
      />
    </>
  );
}
