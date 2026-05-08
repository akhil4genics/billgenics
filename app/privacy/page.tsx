import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Privacy Policy - BillGenics',
  description:
    'How BillGenics collects, uses, and protects your information, and your responsibilities when using the service.',
};

const LAST_UPDATED = 'May 2, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen bg-background font-sans'>
      <Header />
      <main className='mx-auto max-w-3xl px-4 pt-32 pb-16 sm:px-6 lg:px-8'>
        <div className='inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5'>
          <span className='text-xs font-semibold uppercase tracking-[0.18em] text-muted'>Legal</span>
        </div>
        <h1 className='mt-6 text-4xl font-bold text-foreground sm:text-5xl'>Privacy Policy</h1>
        <p className='mt-3 text-sm text-muted'>Last updated: {LAST_UPDATED}</p>

        <div className='mt-10 space-y-10 text-[15px] leading-relaxed text-foreground/90'>
          <Section title='1. Introduction'>
            <p>
              BillGenics (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) provides a smart
              expense tracking, receipt scanning, and bill splitting service (the
              &ldquo;Service&rdquo;). This Privacy Policy explains what information we collect, how
              we use it, and the choices and responsibilities you have when using the Service. By
              creating an account or using the Service, you agree to this Policy.
            </p>
          </Section>

          <Section title='2. Information We Collect'>
            <ul className='list-disc space-y-2 pl-5'>
              <li>
                <strong>Account information:</strong> name, email address, and a hashed password
                you create when you register.
              </li>
              <li>
                <strong>Bill and receipt data you submit:</strong> store name, items, totals,
                category, dates, tags, notes, warranty information, and any receipt image or
                attachment you upload.
              </li>
              <li>
                <strong>Group expense data:</strong> events you create or join, the members you
                invite, and the expenses and settlements you record.
              </li>
              <li>
                <strong>Operational data:</strong> minimal logs needed to keep the Service running
                (for example error logs and request metadata).
              </li>
            </ul>
          </Section>

          <Section title='3. What We Do Not Do'>
            <ul className='list-disc space-y-2 pl-5'>
              <li>
                <strong>We do not intentionally store sensitive information</strong> such as
                government identification numbers, full payment card numbers, health records, or
                other regulated personal data. The Service is not designed to handle this kind of
                data.
              </li>
              <li>
                <strong>We do not sell your data.</strong> We do not share your information with
                third parties for marketing, advertising, or any unrelated commercial purpose.
              </li>
              <li>
                We only share data with the operational service providers strictly required to run
                BillGenics (cloud hosting, database, email delivery, and the AI provider that
                parses receipt images you submit).
              </li>
            </ul>
          </Section>

          <Section title='4. How We Use Your Information'>
            <ul className='list-disc space-y-2 pl-5'>
              <li>To provide the core features you request: scanning, categorising, searching, and splitting your bills.</li>
              <li>To authenticate you and keep your account secure.</li>
              <li>To send transactional emails you trigger (verification, password reset, event invites, settlement notifications).</li>
              <li>To diagnose problems and improve reliability of the Service.</li>
            </ul>
          </Section>

          <Section title='5. User Responsibilities'>
            <ul className='list-disc space-y-2 pl-5'>
              <li>
                <strong>Do not upload sensitive information.</strong> Do not submit images,
                attachments, notes, or messages that contain government ID numbers, full credit
                card or bank details, medical records, passwords, or any other regulated or
                confidential data.
              </li>
              <li>
                <strong>Do not share sensitive information through the Service</strong>, including
                via event invites, expense descriptions, attachments, or any free-text fields.
              </li>
              <li>
                You are responsible for the accuracy of the information you submit and for
                obtaining consent from any other person whose information you choose to enter
                (for example, members you invite to an event).
              </li>
              <li>
                <strong>Use of the Service is solely at your own responsibility and risk.</strong>{' '}
                BillGenics is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
                basis, without warranties of any kind. You are responsible for keeping your own
                copies of any data you consider important.
              </li>
            </ul>
          </Section>

          <Section title='6. Service Availability'>
            <p>
              BillGenics is in an initial development phase. As part of ongoing enhancements and
              maintenance, the Service may be unavailable, partially functional, or under
              maintenance from time to time without prior notice. Features may change, be removed,
              or behave differently between releases. We make no guarantee of uninterrupted
              availability or backwards compatibility during this phase.
            </p>
          </Section>

          <Section title='7. Pricing'>
            <p>
              The Service is currently free to use. We expect to introduce pricing plans in the
              future, including a free tier with usage limits and paid tiers that unlock
              additional capacity or features. We will notify users in advance of any change that
              would restrict access to features you currently rely on, and existing accounts will
              continue to be able to access their stored data.
            </p>
          </Section>

          <Section title='8. Data Retention and Deletion'>
            <p>
              We retain your account data and the bills, attachments, and events you create for as
              long as your account is active. You may delete individual bills and attachments from
              within the Service. To request deletion of your entire account, contact us at the
              address below.
            </p>
          </Section>

          <Section title='9. Security'>
            <p>
              We use industry-standard practices to protect your data in transit and at rest,
              including hashed passwords, signed authentication tokens, and access-controlled
              storage for receipt images and attachments. No system is perfectly secure; you are
              responsible for keeping your account credentials confidential.
            </p>
          </Section>

          <Section title='10. Children'>
            <p>
              The Service is not directed to children under 13, and we do not knowingly collect
              personal information from children. If you believe a child has provided us
              information, please contact us so we can remove it.
            </p>
          </Section>

          <Section title='11. Changes to This Policy'>
            <p>
              We may update this Privacy Policy as the Service evolves. When we do, we will update
              the &ldquo;Last updated&rdquo; date above and, where appropriate, notify you in the
              app or by email. Continued use of the Service after a change means you accept the
              updated Policy.
            </p>
          </Section>

          <Section title='12. Contact'>
            <p>
              Questions or requests about this Policy or your data can be sent to{' '}
              <a
                href='mailto:info@4genics.com'
                className='font-medium text-primary hover:underline'
              >
                info@4genics.com
              </a>
              .
            </p>
          </Section>
        </div>

        <div className='mt-12 border-t border-border pt-6 text-sm text-muted'>
          <Link href='/' className='hover:text-foreground'>&larr; Back to home</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className='text-xl font-semibold text-foreground'>{title}</h2>
      <div className='mt-3 space-y-3'>{children}</div>
    </section>
  );
}
