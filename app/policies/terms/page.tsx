import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Divantraa",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-10">
      <h1 className="mb-2 font-display text-3xl text-ink sm:text-4xl">
        Terms of Service
      </h1>

      <p className="mb-10 text-sm text-ink/40">
        Last updated: 01 JAN 2026
      </p>

      <div className="prose-policy">
        <Section title="INTRODUCTION">
          <p>
            These Terms of Service govern your access to and use of{" "}
            <strong>www.divantraa.com</strong> and your purchase of products
            from Divantraa Products Private Limited ("Divantraa", "we", "us",
            or "our").
          </p>

          <p>
            Please have these Terms reviewed by a legal professional and
            complete all bracketed fields before publishing.
          </p>
        </Section>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using <strong>www.divantraa.com</strong> and by
            purchasing our products, you agree to be bound by these Terms of
            Service, together with our Privacy Policy, Shipping Policy, and
            Refund Policy.
          </p>

          <p>
            If you do not agree to these Terms, please do not use the website
            or purchase products from us.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years of age and legally capable of
            entering into a binding contract to purchase from us.
          </p>

          <p>
            By placing an order, you confirm that you meet these requirements
            and that the information provided by you is accurate and complete.
          </p>
        </Section>

        <Section title="3. Products, Descriptions & Pricing">
          <p>
            We make every effort to describe our products, ingredients, and
            images accurately.
          </p>

          <p>
            Natural products may vary slightly in colour, aroma, texture, and
            sediment from batch to batch. Such variations are normal for
            cold-pressed and unrefined food products and do not necessarily
            constitute a product defect.
          </p>

          <p>
            All prices are listed in Indian Rupees (₹) and are inclusive of
            applicable GST unless stated otherwise. Shipping charges, where
            applicable, are shown at checkout.
          </p>

          <p>
            We reserve the right to modify prices, products, and offers at any
            time without prior notice.
          </p>

          <p>
            In the event of an obvious pricing or typographical error, we
            reserve the right to cancel affected orders and refund any amount
            paid.
          </p>
        </Section>

        <Section title="4. Product Information & Health Disclaimer">
          <p>
            Product information provided on our website is for general
            informational purposes and does not constitute medical, dietary,
            or professional advice.
          </p>

          <p>
            Our products are food items and are not medicines. They are not
            intended to diagnose, treat, cure, or prevent any disease.
          </p>

          <p>
            Please check the ingredients and allergen information provided on
            the product label, including allergens such as groundnut and
            sesame where applicable.
          </p>

          <p>
            If you have allergies, dietary restrictions, or specific health
            conditions, consult a qualified professional before consuming our
            products.
          </p>
        </Section>

        <Section title="5. Orders & Payment">
          <p>
            An order placed through our website constitutes an offer to
            purchase the selected products.
          </p>

          <p>
            We reserve the right to accept or decline any order, including
            where there are issues relating to stock availability,
            serviceability, suspected fraud, pricing errors, or other
            operational circumstances.
          </p>

          <p>
            Payments are processed through secure third-party payment
            gateways. You agree to provide accurate and complete payment,
            billing, and delivery information.
          </p>
        </Section>

        <Section title="6. Shipping, Returns & Refunds">
          <p>
            Delivery, returns, cancellations, replacements, and refunds are
            governed by our{" "}
            <strong>Shipping Policy</strong> and{" "}
            <strong>Refund, Returns & Cancellation Policy</strong>.
          </p>

          <p>
            These policies form an integral part of these Terms of Service and
            should be read together with them.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content available on this website, including the Divantraa
            name, logo, trademarks, text, graphics, images, photographs,
            product descriptions, and website design, is the property of
            Divantraa Products Private Limited or its licensors and is
            protected by applicable laws.
          </p>

          <p>
            You may not copy, reproduce, modify, distribute, publish, transmit,
            display, or otherwise use our content without our prior written
            consent, except where permitted by applicable law.
          </p>
        </Section>

        <Section title="8. User Conduct">
          <p>
            You agree not to use the website:
          </p>

          <ul>
            <li>For any unlawful or fraudulent purpose.</li>
            <li>
              To infringe or violate our rights or the rights of any third
              party.
            </li>
            <li>
              To introduce malicious software, viruses, or other harmful code.
            </li>
            <li>
              To interfere with or attempt to disrupt the operation or security
              of the website.
            </li>
            <li>
              To provide false, misleading, or inaccurate information.
            </li>
          </ul>

          <p>
            Any reviews, comments, photographs, or other content that you
            submit must be accurate, lawful, and must not infringe the rights
            of any third party.
          </p>

          <p>
            By submitting such content, you grant us a licence to use, display,
            reproduce, and publish the content for purposes related to our
            website, products, services, and business, subject to applicable
            law.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Divantraa shall
            not be liable for any indirect, incidental, special, or
            consequential damages arising from or relating to your use of the
            website or products.
          </p>

          <p>
            Our total liability for any claim shall not exceed the amount paid
            by you for the product giving rise to the claim, to the extent
            permitted by applicable law.
          </p>
        </Section>

        <Section title="10. Indemnity">
          <p>
            You agree to indemnify and hold Divantraa Products Private Limited,
            its officers, employees, representatives, and affiliates harmless
            from claims, losses, liabilities, damages, costs, and expenses
            arising out of:
          </p>

          <ul>
            <li>Your breach of these Terms.</li>
            <li>Your misuse of the website.</li>
            <li>Your misuse of our products.</li>
            <li>Your violation of applicable laws or third-party rights.</li>
          </ul>
        </Section>

        <Section title="11. Force Majeure">
          <p>
            We shall not be liable for any failure or delay in performing our
            obligations where such failure or delay results from events beyond
            our reasonable control.
          </p>

          <p>
            Such events may include natural disasters, strikes, courier or
            logistics disruptions, government actions, epidemics, technical
            failures, or other circumstances beyond our reasonable control.
          </p>
        </Section>

        <Section title="12. Governing Law & Jurisdiction">
          <p>
            These Terms of Service are governed by the laws of India.
          </p>

          <p>
            Any disputes arising out of or relating to these Terms or your use
            of the website shall be subject to the exclusive jurisdiction of
            the courts at <strong>[Bengaluru / Ramanagara], Karnataka</strong>.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>
            We may revise or update these Terms of Service from time to time.
            Any updated version will be published on this website with a
            revised "Last updated" date.
          </p>

          <p>
            Your continued use of the website after the revised Terms are
            published constitutes acceptance of the updated Terms, to the
            extent permitted by applicable law.
          </p>
        </Section>

        <Section title="14. Contact Us">
          <p>
            For questions, concerns, or requests relating to these Terms of
            Service, please contact us:
          </p>

          <ul>
            <li>
              <strong>Company:</strong> Divantraa Products Private Limited
            </li>
            <li>
              <strong>Registered Address:</strong> 475, 7th Main, Hampinagar, Bangalore 560040
            </li>
            <li>
              <strong>Email:</strong> support@divantraa.com
            </li>
            <li>
              <strong>Phone:</strong> +91 9008301490
            </li>
            <li>
              <strong>GST:</strong> [GSTIN]
            </li>
            <li>
              <strong>FSSAI:</strong> [FSSAI Licence No.]
            </li>
          </ul>
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
      <h2 className="mb-4 font-display text-xl text-ink">
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