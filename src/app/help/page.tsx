import { Header } from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help" };

const FAQS = [
  { q: "How long does shipping take?", a: "Standard delivery takes 3 to 5 business days. Express options are available at checkout." },
  { q: "What is your return policy?", a: "You can return any item within 30 days of delivery for a full refund, no questions asked." },
  { q: "How do I track my order?", a: "Once your order ships you will receive a tracking link by email. You can also check your orders page." },
  { q: "Can I change or cancel my order?", a: "Orders can be cancelled within 1 hour of placing them. After that, contact support and we will do our best." },
  { q: "Is my payment information secure?", a: "Yes. We never store card details. All payments are processed through encrypted, PCI-compliant providers." },
];

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="pt-28 px-6 sm:px-8 lg:px-12 pb-16 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Help</h1>
        <p className="text-sm text-gray-500 mb-10">Answers to common questions</p>

        <div className="max-w-2xl flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {FAQS.map((faq, i) => (
            <div key={i} className="py-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{faq.q}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mt-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 p-6">
          <p className="text-sm font-semibold mb-1">Still need help?</p>
          <p className="text-sm text-gray-500 mb-4">Our support team is available Monday to Friday, 9am to 6pm.</p>
          <a href="mailto:support@logosroyal.com" className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border-2 border-blue-950 dark:border-blue-200 text-blue-950 dark:text-blue-200 hover:bg-blue-950 hover:text-white dark:hover:bg-blue-200 dark:hover:text-blue-950 transition-colors">
            Contact support
          </a>
        </div>
      </main>
    </>
  );
}
