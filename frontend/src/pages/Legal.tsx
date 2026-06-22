import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const pages = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'June 1, 2026',
    sections: [
      {
        id: 'information-we-collect',
        h: '1. Information We Collect',
        p: 'We collect information that you voluntarily provide when setting up an Alterect account and using the platform. This includes your full name, email address, company name, job title, phone number, and billing information such as a credit card number and billing address. Additionally, we collect all drawings, documents, markups, notes, annotations, and project data that you upload, create, or share through the platform. Usage data is collected automatically — including IP address, browser type and version, operating system, pages visited, features used, session duration, clickstream data, and timestamps of actions taken. When you connect third-party services such as Dropbox, Box, Procore, BIM 360, Slack, or email, we receive the data that those services make available based on the permissions you grant, which may include folder listings, file contents, contact names, and channel memberships.',
      },
      {
        id: 'how-we-use',
        h: '2. How We Use Your Information',
        p: 'We use your information to provide, maintain, improve, and protect the Alterect service. This specifically includes: processing and diffing uploaded drawings to detect changes; routing alerts to the appropriate trades and team members; billing your account according to your subscription plan; communicating with you about account updates, security notifications, and support requests; analyzing usage patterns to improve the product\'s features and performance; enforcing our Terms of Service and preventing fraudulent or unauthorized use of the platform; and complying with legal obligations such as tax reporting and data breach notifications. We do not sell, rent, or license your personal information or your drawing data to any third party. We do not use your uploaded drawings for training machine learning models outside the scope of providing diff detection services to your account.',
      },
      {
        id: 'data-storage',
        h: '3. Data Storage, Retention, and Deletion',
        p: 'All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. Drawings and project data are stored in secure cloud infrastructure located within the United States (Google Cloud Platform, us-west1 region). We retain your account data for the duration of your active subscription. After account cancellation or termination, your data remains accessible for export for 30 days. Following this 30-day grace period, all data is permanently deleted from primary and backup systems within 90 days, except where legal or regulatory obligations require longer retention (such as tax records for billing transactions, which are retained for 7 years). Backups are encrypted and retained for a maximum of 30 days before being overwritten.',
      },
      {
        id: 'sharing-disclosure',
        h: '4. Sharing and Disclosure',
        p: 'We may share your information in the following limited circumstances: with third-party service providers who process data on our behalf (such as cloud hosting providers, payment processors, and email delivery services), subject to contractual data processing agreements that prohibit them from using your data for any purpose other than providing services to Alterect; with your team members and collaborators as determined by your account\'s project and permission settings; if required by law, regulation, or legal process (such as a subpoena or court order), in which case we will make reasonable efforts to notify you unless prohibited by law; in connection with a merger, acquisition, or sale of assets, where your data may be transferred as part of the business transaction, with notice provided to you. We do not share your personal information with advertising networks or data brokers.',
      },
      {
        id: 'your-rights',
        h: '5. Your Rights and Choices',
        p: 'As a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA): the right to know what personal information we collect, use, and disclose about you; the right to request access to a copy of your personal information in a portable format; the right to request correction of inaccurate personal information; the right to request deletion of your personal information, subject to certain exceptions (such as legal retention obligations); the right to opt out of the sale or sharing of your personal information — we do not sell personal information, so this right does not currently apply, but you may still submit an opt-out request; the right to non-discrimination for exercising any of your privacy rights. You may exercise these rights by emailing privacy@alterect.com or through your account settings. We will verify your identity before processing requests and respond within 45 days as required by law.',
      },
      {
        id: 'security',
        h: '6. Security Practices',
        p: 'We maintain physical, technical, and administrative safeguards designed to protect your information. These include: encryption of all data at rest and in transit; SOC 2 Type II compliance through annual third-party audits; multi-tenant data isolation at the database layer; access controls based on the principle of least privilege, with all employee access logged and audited; regular penetration testing and vulnerability scanning; incident response procedures that include notification to affected users within 72 hours of a confirmed breach. Despite these measures, no system is completely secure, and we cannot guarantee absolute protection of your data.',
      },
      {
        id: 'international-transfers',
        h: '7. International Data Transfers',
        p: 'Alterect processes and stores data in the United States. If you are located outside the United States, your information will be transferred to and processed in the United States. By using the service, you consent to this transfer. Where required, we rely on Standard Contractual Clauses approved by the European Commission as the legal mechanism for data transfers. We do not currently maintain a Privacy Shield certification.',
      },
      {
        id: 'changes-to-policy',
        h: '8. Changes to This Policy',
        p: 'We may update this Privacy Policy from time to time. Material changes will be announced via email to the account owner and through an in-app notification at least 14 days before they take effect. Continued use of Alterect after changes become effective constitutes acceptance of the updated policy. The effective date at the top of this page reflects the most recent revision.',
      },
      {
        id: 'contact',
        h: '9. Contact Information',
        p: 'For questions, concerns, or data subject requests, contact us at legal@alterect.com.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'June 1, 2026',
    sections: [
      {
        id: 'acceptance',
        h: '1. Acceptance of Terms',
        p: 'By creating an Alterect account, accessing the Alterect website, or using any Alterect service ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms. If you do not agree to these Terms, you may not use the Service. These Terms constitute a binding legal agreement between you (or your organization) and Alterect.',
      },
      {
        id: 'accounts',
        h: '2. Accounts and Registration',
        p: 'You must be at least 18 years old to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. You may not share your account credentials with anyone, create accounts through automated means, or create accounts for the purpose of reselling access to the Service. We reserve the right to suspend or terminate accounts that violate these Terms.',
      },
      {
        id: 'billing',
        h: '3. Subscriptions, Billing, and Payments',
        p: 'Paid plans require valid billing information. All fees are stated in United States Dollars and are exclusive of applicable taxes. The Starter plan includes a 7-day free trial — you must enter valid billing information to begin the trial. You will not be charged during the trial period. If you cancel before the trial ends, the trial ends immediately and you will not be charged. If you do not cancel before the trial ends, your first billing cycle will begin and you will be charged the applicable subscription fee. Subscriptions automatically renew on a monthly basis unless canceled. You may cancel at any time from your account settings; cancellation takes effect at the end of the current billing period. We do not provide prorated refunds for partial billing periods. All fees are non-refundable except where expressly stated or required by applicable law. Late payments may result in service suspension. If we are unable to process payment after multiple attempts, your account may be terminated.',
      },
      {
        id: 'acceptable-use',
        h: '4. Acceptable Use',
        p: 'You agree to use the Service only for lawful purposes and in compliance with all applicable laws and regulations. You may not: upload, store, or share any content that infringes on the intellectual property rights of others; upload malicious code, viruses, or other harmful materials; attempt to gain unauthorized access to any part of the Service or its underlying systems; use the Service to send unsolicited communications (spam); interfere with or disrupt the integrity or performance of the Service; reverse-engineer, decompile, or disassemble any aspect of the Service; use any data mining or data scraping tools in connection with the Service. You retain all rights and ownership of the drawings and documents you upload. Alterect claims no intellectual property rights over your project data. By uploading content, you grant Alterect a limited license to process, store, transmit, and display that content solely for the purpose of providing the Service to you.',
      },
      {
        id: 'disclaimers',
        h: '5. Service Level and Disclaimers',
        p: 'Alterect strives to maintain 99.9% service availability, excluding scheduled maintenance (announced at least 48 hours in advance) and events beyond our reasonable control (acts of God, natural disasters, war, terrorism, internet outages, etc.). The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, title, and non-infringement. Alterect does not guarantee that the diff detection results will be error-free, complete, or suitable for your specific construction projects. You acknowledge that automated diff detection is a tool to assist human decision-making and is not a substitute for professional engineering judgment. Construction decisions based on Alterect output are your sole responsibility.',
      },
      {
        id: 'liability',
        h: '6. Limitation of Liability',
        p: 'To the maximum extent permitted by applicable law, in no event shall Alterect, its officers, directors, employees, agents, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to: loss of profits, revenue, data, or goodwill; construction rework costs; delay damages; or claims arising from construction defects or failures — whether based on warranty, contract, tort (including negligence), or any other legal theory, even if advised of the possibility of such damages. Alterect\'s total cumulative liability for any claim arising from or related to these Terms or the Service shall not exceed the total amount paid by you to Alterect in the twelve-month period immediately preceding the event giving rise to the claim. This limitation of liability is a fundamental part of the bargain and reflects a fair allocation of risk between the parties.',
      },
      {
        id: 'indemnification',
        h: '7. Indemnification',
        p: 'You agree to indemnify, defend, and hold harmless Alterect from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys\' fees) arising out of or related to: your use of the Service in violation of these Terms; your violation of any applicable law or regulation; any content you upload to the Service that infringes the rights of any third party. Alterect reserves the right, at its own expense, to assume the exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate with Alterect in asserting any available defenses.',
      },
      {
        id: 'termination',
        h: '8. Termination',
        p: 'Either party may terminate these Terms at any time. You may terminate by deleting your account through the account settings or by contacting support. Alterect may terminate or suspend your access to the Service immediately, without prior notice, if you materially breach these Terms (including payment obligations). Upon termination: your access to the Service will cease; your data will be available for export for 30 days following termination; after 30 days, your data will be permanently deleted; any outstanding payment obligations will survive termination. Provisions of these Terms that by their nature should survive termination (including limitation of liability, indemnification, and governing law) shall survive.',
      },
      {
        id: 'governing-law',
        h: '9. Governing Law and Dispute Resolution',
        p: 'These Terms are governed by the laws of the State of California, without regard to its conflict of laws principles. Any dispute arising from these Terms or the Service shall be resolved exclusively in the state or federal courts located in San Francisco County, California. You consent to the personal jurisdiction of these courts. The United Nations Convention on Contracts for the International Sale of Goods does not apply. Before initiating legal proceedings, the parties agree to attempt to resolve the dispute through good-faith negotiations for at least 30 days. If negotiations fail, the dispute shall be resolved by binding arbitration administered by JAMS in San Francisco, California, in accordance with JAMS\' streamlined arbitration rules. The arbitrator\'s decision shall be final and binding and may be entered in any court of competent jurisdiction. You agree that claims must be brought individually and not as a class action or representative proceeding.',
      },
      {
        id: 'modifications',
        h: '10. Modifications to Terms',
        p: 'We may revise these Terms from time to time. Material changes will be communicated via email to the account owner at least 30 days before they take effect. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you may cancel your account before the changes take effect.',
      },
      {
        id: 'contact-terms',
        h: '11. Contact',
        p: 'For questions, concerns, or data subject requests, contact us at legal@alterect.com.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    updated: 'June 1, 2026',
    sections: [
      {
        id: 'what-are-cookies',
        h: '1. What Are Cookies',
        p: 'Cookies are small text files (typically less than 4KB in size) that are stored on your computer, tablet, or mobile device by your web browser when you visit a website. They contain a unique identifier that allows the website to recognize your browser across pages or on return visits. Cookies cannot execute code, access other files on your device, or transmit viruses. Similar technologies we use include local storage (which stores data in your browser\'s storage area), session storage (data that persists only for a single browsing session), and web beacons (tiny transparent images used to track engagement with emails and pages). We also use pixel tags and JavaScript tags to collect analytics data about how you interact with Alterect.',
      },
      {
        id: 'categories-of-cookies',
        h: '2. Categories of Cookies We Use',
        p: 'Essential Cookies: These cookies are necessary for the Service to function. They enable core functionality such as user authentication, session management, security features, and maintaining your preferences during a session. Without these cookies, the Service cannot operate properly. These cookies do not collect information for marketing purposes. Analytics Cookies: These cookies help us understand how visitors interact with Alterect by collecting anonymous information about pages visited, time spent on each page, features used, errors encountered, and navigation patterns. We use this data to improve the product\'s usability, performance, and feature set. Analytics cookies may be set by third-party providers such as PostHog (self-hosted) and Sentry (error tracking). Preference Cookies: These cookies remember your settings and preferences, such as theme selection (light/dark mode), language preference, notification preferences, and default view settings. They enhance your experience by allowing the Service to remember choices you have made. Marketing Cookies: Alterect does not currently use marketing, advertising, or tracking cookies from advertising networks or social media platforms. We do not serve personalized advertisements based on your browsing behavior.',
      },
      {
        id: 'third-party-cookies',
        h: '3. Third-Party Cookies',
        p: 'We use a limited number of third-party services that may set their own cookies: PostHog (self-hosted analytics) — collects anonymous usage data to help us improve the product. Data is stored on our own infrastructure and never shared with PostHog\'s cloud. Sentry (error tracking) — captures error reports to help us diagnose and fix issues. Sentry sets a cookie to prevent duplicate error reports from the same session. Payment Processor (Stripe) — sets essential cookies when you interact with payment forms to process transactions securely. Stripe\'s use of cookies is governed by Stripe\'s privacy policy. Third-party integrations you choose to connect (Dropbox, Box, Procore, Slack, BIM 360) may set their own cookies within their embedded interfaces. We do not control those cookies.',
      },
      {
        id: 'your-cookie-choices',
        h: '4. Your Cookie Choices',
        p: 'When you first visit Alterect, a cookie consent banner appears asking you to accept or decline non-essential cookies. Essential cookies are always set because they are required for the Service to function. You can change your cookie preferences at any time through the cookie settings link in your account settings panel. Most browsers also allow you to control cookies through their settings: Chrome: Settings > Privacy and Security > Cookies and other site data. Firefox: Options > Privacy & Security > Cookies and Site Data. Safari: Preferences > Privacy > Cookies and website data. Edge: Settings > Cookies and site permissions. If you disable essential cookies, Alterect may not function properly. Disabling analytics cookies will not affect the core functionality of the Service but will reduce our ability to identify and fix issues.',
      },
      {
        id: 'cookie-persistence',
        h: '5. How Long Cookies Persist',
        p: 'Session cookies are temporary and expire when you close your browser. Persistent cookies remain on your device for a set period or until manually deleted. Our essential authentication cookies persist for the duration of your logged-in session plus a small buffer to prevent unnecessary logouts. Analytics cookies typically persist for 13 months from your last visit, after which they are automatically renewed or deleted. Preference cookies persist until you change your preference or clear your cookies. You can manually delete all stored cookies at any time through your browser settings.',
      },
      {
        id: 'do-not-track',
        h: '6. Do Not Track',
        p: 'Alterect does not currently respond to "Do Not Track" (DNT) signals sent by web browsers. DNT is a browser-level preference that signals to websites that you do not want to be tracked across third-party sites. Since Alterect does not engage in cross-site tracking for advertising purposes, DNT signals are not applicable to our current data practices. We monitor the development of DNT standards and may update this policy accordingly.',
      },
      {
        id: 'updates-cookie',
        h: '7. Updates to This Policy',
        p: 'We may update this Cookie Policy to reflect changes in our practices, applicable laws, or the technologies we use. Changes will be posted on this page with an updated effective date. If we make material changes, we will notify you via email (if you have an account with us) or through an in-app notification. We encourage you to review this policy periodically. Continued use of Alterect after changes become effective constitutes acceptance of the updated policy.',
      },
      {
        id: 'contact-cookie',
        h: '8. Contact',
        p: 'For questions, concerns, or data subject requests, contact us at legal@alterect.com.',
      },
    ],
  },
}

export default function Legal() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = pathname.replace('/', '')
  const info = pages[page as keyof typeof pages] || pages.privacy

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="flex flex-col md:flex-row gap-6 md:gap-16">
          <aside className="w-full md:w-64 md:shrink-0">
            <div className="md:sticky md:top-24">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[14px] text-graphite hover:text-ink hover:bg-fog px-2 -mx-2 py-1 rounded-lg transition-all duration-200 mb-4 md:mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                <h2 className="text-[13px] font-[450] text-ink uppercase tracking-wider mb-2 md:mb-3">On this page</h2>
                <div className="flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-l border-dove/30 pb-2 md:pb-0 md:pl-4 overflow-x-auto">
                  {info.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="whitespace-nowrap md:whitespace-normal text-[13px] text-graphite hover:text-ink transition-colors leading-relaxed md:block shrink-0"
                    >
                      {section.h}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-heading-md md:text-heading text-ink">{info.title}</h1>
            <p className="text-caption text-graphite mt-2 mb-8 md:mb-14">Last updated: {info.updated}</p>
            <div className="space-y-8 md:space-y-12">
              {info.sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-subheading text-ink mb-3 leading-snug">{section.h}</h2>
                  <p className="text-[14px] md:text-body text-graphite leading-[1.7] md:leading-[1.75]">{section.p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
