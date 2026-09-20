import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy — Divantraa",
};

export default function ShippingPolicyPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-10">
      <h1 className="font-display mb-2 text-3xl text-ink sm:text-4xl">
        Shipping & Delivery Policy
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
            This Shipping & Delivery Policy explains how we process, ship, and
            deliver orders placed through our website. Please review this policy
            before placing an order.
          </p>
        </Section>

        <Section title="1. Order Processing">
          <p>
            Orders are processed within <strong>[1–2 business days]</strong>{" "}
            of successful payment confirmation.
          </p>

          <p>
            Orders placed on Sundays or public holidays are processed on the
            next business day.
          </p>

          <p>
            Because our oils are freshly pressed to order where possible, some
            batches may take slightly longer to process. If there is any
            significant delay, we will inform you using the contact details
            provided with your order.
          </p>
        </Section>

        <Section title="2. Shipping Coverage">
          <p>
            We currently ship across <strong>[India / specified states]</strong>{" "}
            through reputed courier and logistics partners such as{" "}
            <strong>[Delhivery, Blue Dart, India Post, Shiprocket]</strong>.
          </p>

          <p>
            Shipping availability depends on the serviceability of your PIN
            code. If your location is not serviceable, we will contact you and,
            where possible, provide an alternative delivery option.
          </p>

          <p>
            <strong>International Shipping:</strong>{" "}
            [Available to select countries / Not currently available].
          </p>
        </Section>

        <Section title="3. Shipping Charges">
          <p>
            Shipping is{" "}
            <strong>
              [free on orders above ₹____ / charged at actuals shown at
              checkout]
            </strong>
            .
          </p>

          <p>
            Any applicable shipping charges will be clearly displayed at
            checkout before you confirm and pay for your order.
          </p>
        </Section>

        <Section title="4. Delivery Timelines">
          <p>
            The estimated delivery time is{" "}
            <strong>[3–7 business days]</strong> from the date of dispatch,
            depending on your location and courier serviceability.
          </p>

          <p>
            Delivery timelines may vary between metro, non-metro, and remote
            locations.
          </p>

          <p>
            Delivery estimates may also be affected by courier delays, adverse
            weather conditions, public holidays, festivals, natural events,
            transportation disruptions, or other circumstances beyond our
            reasonable control.
          </p>
        </Section>

        <Section title="5. Order Tracking">
          <p>
            Once your order has been dispatched, we will provide tracking
            information through{" "}
            <strong>email, SMS, and/or WhatsApp</strong>, depending on the
            contact information available for your order.
          </p>

          <p>
            Where available, you can also track your order through the{" "}
            <strong>My Account</strong> section of our website.
          </p>
        </Section>

        <Section title="6. Packaging">
          <p>
            We take reasonable care when packaging our products for
            transportation. Products, especially glass bottles, are packed
            using appropriate protective materials to reduce the risk of damage
            during transit.
          </p>

          <p>
            If your order arrives damaged, broken, or leaking, please refer to
            our Refund & Returns Policy and contact us within{" "}
            <strong>[48 hours]</strong> of delivery with photographs and
            relevant order details.
          </p>
        </Section>

        <Section title="7. Delays & Failed Deliveries">
          <p>
            Delivery attempts may fail due to an incorrect or incomplete
            address, recipient unavailability, incorrect contact information,
            refusal to accept the shipment, or other circumstances affecting
            delivery.
          </p>

          <p>
            In the event of a failed delivery, re-delivery may be subject to
            additional shipping charges.
          </p>

          <p>
            Please ensure that your shipping address, PIN code, and contact
            number are accurate when placing your order.
          </p>
        </Section>

        <Section title="8. Perishability & Storage">
          <p>
            Our products are natural, cold-pressed products and should be
            stored appropriately after delivery.
          </p>

          <p>
            We recommend keeping our oils away from direct sunlight, excessive
            heat, and other unsuitable storage conditions.
          </p>

          <p>
            Please follow the storage and handling instructions provided on the
            product label.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p>
            If you have questions about shipping, delivery, tracking, or an
            existing order, please contact us at:
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