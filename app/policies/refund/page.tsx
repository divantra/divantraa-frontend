import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund, Returns & Cancellation Policy — Divantraa",
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-10">
      <h1 className="font-display mb-2 text-3xl text-ink sm:text-4xl">
        Refund, Returns & Cancellation Policy
      </h1>

      <p className="mb-10 text-sm text-ink/40">
        Last updated: 01 JAN 2026
      </p>

      <div className="prose-policy">

        <Section title="INTRODUCTION">
          <p>
            Divantraa Products Private Limited ("Divantraa", "we", "us", or
            "our") operates the website{" "}
            <strong>www.divantraa.com</strong>.
          </p>

          <p>
            This Refund, Returns & Cancellation Policy explains the conditions
            under which orders may be cancelled, returned, replaced, or
            refunded.
          </p>

          <p>
            Because our products are consumable food products, returns are
            subject to applicable food-safety, hygiene, and product-quality
            considerations.
          </p>
        </Section>

        <Section title="1. Our Commitment">
          <p>
            Your trust is important to us. If something is wrong with your
            order, we will make reasonable efforts to resolve the issue.
          </p>

          <p>
            Since we sell consumable food products, returns and replacements
            are accepted only in the circumstances described in this policy.
          </p>
        </Section>

        <Section title="2. Returns & Replacements — When Eligible">
          <p>
            We accept return or replacement requests only in the following
            circumstances, provided the issue is reported within{" "}
            <strong>[48–72 hours]</strong> of delivery and supporting
            photographs are provided:
          </p>

          <ul>
            <li>
              The product delivered is damaged, leaking, or broken during
              transit.
            </li>

            <li>
              You received an incorrect, different, or wrong product.
            </li>

            <li>
              The product is expired or has a manufacturing or quality defect,
              including a tampered or damaged seal.
            </li>
          </ul>

          <p>
            To raise a return or replacement request, please email us at{" "}
            <a
              href="mailto:support@divantraa.com"
              className="text-forest underline underline-offset-2 hover:text-leaf"
            >
              support@divantraa.com
            </a>{" "}
            with the following information:
          </p>

          <ul>
            <li>Order number</li>
            <li>Description of the issue</li>
            <li>Clear photographs of the product</li>
            <li>Photographs of the product packaging</li>
          </ul>
        </Section>

        <Section title="3. Returns — When Not Eligible">
          <p>
            For hygiene, safety, and the consumable nature of our products, we
            generally cannot accept returns in the following circumstances:
          </p>

          <ul>
            <li>
              The product has been opened, used, or its seal has been broken,
              except where the issue relates to a genuine quality or
              manufacturing defect.
            </li>

            <li>
              The return or replacement request is made after{" "}
              <strong>[48–72 hours]</strong> from delivery.
            </li>

            <li>
              The issue resulted from improper storage, handling, or use after
              delivery.
            </li>

            <li>
              The request is based solely on a change of mind or taste
              preference after the product has been opened.
            </li>
          </ul>
        </Section>

        <Section title="4. How Refunds Work">
          <p>
            Once we receive your return or replacement request, we will review
            the information and supporting photographs provided.
          </p>

          <p>
            If the request is approved, we will process a replacement or
            refund, as applicable and subject to the circumstances of the
            order.
          </p>

          <p>
            Approved refunds will be credited to the original payment method
            within <strong>[7–10 business days]</strong>.
          </p>

          <p>
            The time required for the refunded amount to appear in your account
            may vary depending on your bank, card issuer, UPI provider, or
            payment service provider.
          </p>

          <p>
            Shipping charges, if applicable, are generally non-refundable.
            However, where the issue is attributable to us, such as a damaged,
            incorrect, or defective product, we will bear the applicable return
            shipping costs.
          </p>
        </Section>

        <Section title="5. Order Cancellation">
          <p>
            You may request cancellation of an order before it has been
            dispatched by contacting us promptly at{" "}
            <a
              href="mailto:support@divantraa.com"
              className="text-forest underline underline-offset-2 hover:text-leaf"
            >
              support@divantraa.com
            </a>
            .
          </p>

          <p>
            If the cancellation request is accepted before dispatch, we will
            refund the applicable amount through the original payment method.
          </p>

          <p>
            Orders that have already been dispatched cannot normally be
            cancelled. Such orders may instead be handled under the applicable
            return or replacement conditions described in this policy.
          </p>

          <p>
            We reserve the right to cancel an order in circumstances including
            stock unavailability, pricing or listing errors, suspected
            fraudulent activity, or other legitimate operational or legal
            reasons.
          </p>

          <p>
            Where we cancel an order after payment has been received, the
            applicable amount will be refunded to the original payment method.
          </p>
        </Section>

        <Section title="6. Subscriptions">
          <p>
            If subscription services are available, you may pause, skip, or
            cancel a subscription before the applicable next billing or
            dispatch date through your account or by contacting us.
          </p>

          <p>
            Charges that have already been processed for an order that has been
            dispatched will be handled according to the standard refund and
            returns conditions described in this policy.
          </p>
        </Section>

        <Section title="7. Contact Us">
          <p>
            For refund, return, replacement, or cancellation requests, please
            contact us using the details below:
          </p>

          <address className="mt-3 not-italic leading-relaxed text-ink/80">
            <strong>Divantraa Products Private Limited</strong>
            <br />
            475, 7th Main, Hampinagar
            <br />
            Bangalore 560040
            <br />
            Email:{" "}
            <a
              href="mailto:support@divantraa.com"
              className="text-forest underline underline-offset-2 hover:text-leaf"
            >
              support@divantraa.com
            </a>
            <br />
            Phone / WhatsApp: [Phone/WhatsApp]
            <br />
            Operating Hours: [Operating Hours]
          </address>
        </Section>

      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display mb-4 text-xl text-ink">
        {title}
      </h2>

      <div
        className="
          space-y-4
          text-[15px]
          leading-relaxed
          text-ink/75
          [&_ul]:list-disc
          [&_ul]:space-y-2
          [&_ul]:pl-5
          [&_strong]:font-semibold
          [&_strong]:text-ink
        "
      >
        {children}
      </div>
    </section>
  );
}