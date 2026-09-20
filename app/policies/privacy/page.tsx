import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Divantraa",
  description:
    "Privacy Policy for Divantraa Products Private Limited and www.divantraa.com.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-6 py-10">
      <h1 className="mb-2 font-display text-3xl text-ink sm:text-4xl">
        Privacy Policy
      </h1>

      <p className="mb-10 text-sm text-ink/40">
        Last updated: 01 JAN 2026
      </p>

      <div className="prose-policy">
        {/* INTRODUCTION */}
        <Section title="1. Introduction">
          <p>
            Divantraa Products Private Limited (&quot;Divantraa&quot;,
            &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company
            incorporated under the Companies Act, 2013, with its registered
            office at 475, 7th Main, Hampinagar, Bangalore 560040, respects
            your privacy.
          </p>

          <p>
            This Privacy Policy explains what personal data we collect when
            you visit or purchase from{" "}
            <strong>www.divantraa.com</strong>, how we use it, and the choices
            and rights you have.
          </p>

          <p>
            By using our website or placing an order, you consent to the
            practices described in this policy.
          </p>

          <p>
            This policy is intended to align with applicable Indian privacy and
            data protection laws, including the Digital Personal Data
            Protection Act, 2023 (DPDP Act) and the Information Technology Act
            framework.
          </p>
        </Section>

        {/* INFORMATION WE COLLECT */}
        <Section title="2. Information We Collect">
          <p>We collect only what we need to serve you:</p>

          <ul>
            <li>
              <strong>Information you provide:</strong> name, billing and
              shipping address, email address, phone number, and order details
              when you register, place an order, subscribe, or contact us.
            </li>

            <li>
              <strong>Payment information:</strong> payment transactions are
              processed securely by our third-party payment gateway
              ([e.g., Razorpay/PayU/Cashfree]). We do not store your full card,
              UPI, or bank details on our servers.
            </li>

            <li>
              <strong>Automatically collected data:</strong> device
              information, browser information, IP address, and browsing
              behaviour through cookies and similar technologies to operate
              and improve our website.
            </li>

            <li>
              <strong>Communications:</strong> messages you send us through
              email, WhatsApp, contact forms, reviews, or other customer
              support channels.
            </li>
          </ul>
        </Section>

        {/* HOW WE USE */}
        <Section title="3. How We Use Your Information">
          <p>We use your personal data to:</p>

          <ul>
            <li>
              process, fulfil, and deliver your orders and manage
              subscriptions;
            </li>

            <li>
              communicate order updates, respond to enquiries, and provide
              customer support;
            </li>

            <li>
              send offers, newsletters, and product updates only where you
              have opted in. You may opt out of marketing communications at
              any time;
            </li>

            <li>
              improve our products, website, services, and overall customer
              experience;
            </li>

            <li>
              detect and prevent fraud, misuse, or unauthorised activity;
            </li>

            <li>
              comply with applicable legal, tax, accounting, regulatory, and
              other lawful obligations.
            </li>
          </ul>

          <p>
            We process your personal data only for lawful purposes and limit
            collection to information that is necessary for the purposes
            described above.
          </p>
        </Section>

        {/* COOKIES */}
        <Section title="4. Cookies">
          <p>
            We use cookies and similar technologies to keep your cart,
            remember your preferences, analyse traffic, maintain website
            functionality, and improve your browsing experience.
          </p>

          <p>
            You can disable cookies through your browser settings. However,
            disabling certain cookies may cause some features of the website
            to function incorrectly or become unavailable.
          </p>
        </Section>

        {/* SHARING */}
        <Section title="5. Sharing Your Information">
          <p>
            We do not sell your personal data. We may share your personal data
            only where necessary with:
          </p>

          <ul>
            <li>
              <strong>Service providers</strong> who help us operate our
              business, including payment gateways, logistics and courier
              partners, IT service providers, hosting providers, and analytics
              providers. Such information is shared only as necessary for them
              to perform their services and, where applicable, subject to
              confidentiality obligations.
            </li>

            <li>
              <strong>Authorities</strong> where disclosure is required by
              applicable law, regulation, court order, government request, or
              other valid legal process.
            </li>
          </ul>
        </Section>

        {/* SECURITY */}
        <Section title="6. Data Security">
          <p>
            We apply reasonable technical and organisational safeguards to
            protect your personal data against unauthorised access,
            disclosure, alteration, destruction, or loss.
          </p>

          <p>
            However, no method of transmission or storage over the internet is
            completely secure. Therefore, while we take reasonable measures to
            protect your information, we cannot guarantee absolute security.
          </p>
        </Section>

        {/* RETENTION */}
        <Section title="7. Data Retention">
          <p>
            We retain personal data only for as long as necessary to fulfil
            the purposes described in this Privacy Policy and to meet
            applicable legal, accounting, tax, reporting, dispute resolution,
            and regulatory requirements.
          </p>

          <p>
            When personal data is no longer required for these purposes, it
            will be deleted or anonymised in accordance with applicable law
            and our internal retention practices.
          </p>
        </Section>

        {/* RIGHTS */}
        <Section title="8. Your Rights">
          <p>Subject to applicable law, you may have the right to:</p>

          <ul>
            <li>access your personal data held by us;</li>
            <li>correct or update inaccurate personal data;</li>
            <li>
              withdraw consent or unsubscribe from marketing communications;
            </li>
            <li>
              request deletion of your personal data where we are not required
              to retain it by law;
            </li>
            <li>raise a grievance with our Grievance Officer.</li>
          </ul>

          <p>
            To exercise any applicable rights or submit a privacy-related
            request, please contact us using the details provided in the
            &quot;Grievance Officer &amp; Contact&quot; section below.
          </p>
        </Section>

        {/* CHILDREN */}
        <Section title="9. Children's Privacy">
          <p>
            Our website is not directed at children under the age of 18, and
            we do not knowingly collect personal data from children under 18.
          </p>

          <p>
            If you believe that a child has provided personal data to us,
            please contact us so that we can take appropriate steps.
          </p>
        </Section>

        {/* THIRD PARTY LINKS */}
        <Section title="10. Third-Party Links">
          <p>
            Our website may contain links to third-party websites, services,
            social media platforms, marketplaces, or other external websites.
          </p>

          <p>
            We are not responsible for the privacy practices, content, or
            security of third-party websites. We recommend reviewing the
            privacy policies of those third parties before providing them with
            your personal information.
          </p>
        </Section>

        {/* CHANGES */}
        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, services, technology, or applicable
            legal and regulatory requirements.
          </p>

          <p>
            The revised version will be posted on this page with an updated
            &quot;Last updated&quot; date. We encourage you to review this
            Privacy Policy periodically.
          </p>
        </Section>

        {/* GRIEVANCE */}
        <Section title="12. Grievance Officer & Contact">
          <p>
            In accordance with applicable law, the Grievance Officer is:
          </p>

          <address className="mt-3 not-italic leading-relaxed text-ink/80">
            <strong>Name:</strong> Divantraa Products Pvt. Ltd
            <br />
            <strong>Email:</strong>{" "}
            <a
              href="mailto:grievance@divantraa.com"
              className="text-forest underline underline-offset-2 hover:text-leaf"
            >
              grievance@divantraa.com
            </a>
            <br />
            <strong>Phone:</strong> 9008301490
            <br />
            <strong>Address:</strong> 475, 7th Main, Hampinagar, Bangalore 560040
          </address>

          <p className="mt-4">
            For any privacy questions, requests, or concerns, please email us
            at{" "}
            <a
              href="mailto:support@divantraa.com"
              className="text-forest underline underline-offset-2 hover:text-leaf"
            >
              support@divantraa.com
            </a>
            .
          </p>
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
      <h2 className="mb-4 font-display text-xl text-ink">{title}</h2>

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