import { Header } from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Logos Royal",
  description: "How Logos Royal collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "23 May 2025";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-6 sm:px-8 lg:px-12 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

          <div className="prose prose-sm prose-gray dark:prose-invert max-w-none space-y-8">

            <section>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logos Royal Enterprise (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates logosroyal.com. This policy explains what personal information we collect, how we use it, and your rights under the Ghana Data Protection Act 2012.
              </p>
            </section>

            <Section title="Information We Collect">
              <ul>
                <li><strong>Account:</strong> name, email address, and password when you create an account.</li>
                <li><strong>Orders:</strong> shipping address, items purchased, and order history.</li>
                <li><strong>Payments:</strong> transaction reference and amount. We do not store card details — payments are handled by Paystack.</li>
                <li><strong>Usage:</strong> pages visited, device type, and browser — collected automatically to improve the site.</li>
              </ul>
            </Section>

            <Section title="How We Use Your Information">
              <ul>
                <li>Process and fulfill your orders.</li>
                <li>Send order confirmation and status emails.</li>
                <li>Respond to support queries.</li>
                <li>Improve site performance and fix issues.</li>
              </ul>
              <p>We do not sell your personal data to third parties.</p>
            </Section>

            <Section title="Third Parties We Share Data With">
              <ul>
                <li><strong>Paystack</strong> — payment processing. Subject to Paystack&rsquo;s privacy policy.</li>
                <li><strong>Supabase</strong> — secure database hosting for account and order data.</li>
                <li><strong>Resend</strong> — transactional email delivery.</li>
              </ul>
              <p>Each service processes only the data necessary to perform its function.</p>
            </Section>

            <Section title="Data Retention">
              <p>We retain your account and order data for as long as your account is active or as required by Ghanaian law. You may request deletion at any time.</p>
            </Section>

            <Section title="Your Rights">
              <p>Under the Ghana Data Protection Act 2012 you have the right to:</p>
              <ul>
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate information.</li>
                <li>Request deletion of your data.</li>
                <li>Withdraw consent at any time.</li>
              </ul>
              <p>To exercise any of these rights, contact us at the address below.</p>
            </Section>

            <Section title="Cookies">
              <p>We use essential cookies to keep you signed in and remember your session. No advertising or tracking cookies are used.</p>
            </Section>

            <Section title="Security">
              <p>All data is transmitted over HTTPS. Passwords are never stored in plain text. We use industry-standard measures to protect your information, but no system is completely secure.</p>
            </Section>

            <Section title="Changes to This Policy">
              <p>We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top reflects the most recent version. Continued use of the site after changes constitutes acceptance.</p>
            </Section>

            <Section title="Contact">
              <p>
                Logos Royal Enterprise<br />
                Accra, Ghana<br />
                <a href="mailto:logosroyalenterprise@gmail.com" className="text-blue-600 dark:text-blue-400 underline underline-offset-2">logosroyalenterprise@gmail.com</a>
              </p>
            </Section>

          </div>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-gray-800 dark:[&_strong]:text-gray-200 [&_a]:text-blue-600 dark:[&_a]:text-blue-400">
        {children}
      </div>
    </section>
  );
}
