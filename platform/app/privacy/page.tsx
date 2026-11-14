import Link from "next/link";
import type { Metadata } from "next";
import { ForReview, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy notice · GratiFi" };

const sections: Array<[string, string]> = [
  ["who", "Who we are"],
  ["what", "What we collect"],
  ["why", "Why we use it"],
  ["blockchain", "The permanent record"],
  ["sharing", "Who we share it with"],
  ["transfers", "Where it's stored"],
  ["retention", "How long we keep it"],
  ["cookies", "Cookies"],
  ["rights", "Your rights"],
  ["changes", "Changes to this notice"]
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      updated="[date]"
      intro="GratiFi lets customers thank the people who served them with a tip and a note. This notice explains what personal data we hold when you use GratiFi, why, and what you can do about it."
      sections={sections}
    >
      <section id="who">
        <h2>1. Who we are</h2>
        <p>
          GratiFi is run by [company name], a company registered in [England and Wales] (company number [number]), at [registered
          address]. We are the controller of the personal data described here. Contact us at [privacy@example.com].
        </p>
        <p className="mt-2">Our registration number with the Information Commissioner&apos;s Office (ICO) is [number].</p>
        <ForReview>Confirm whether GratiFi or the venue is the controller for each type of data (or whether they are joint controllers), especially tip notes that venues can see. This depends on how money flows to staff, which isn&apos;t decided yet.</ForReview>
      </section>

      <section id="what">
        <h2>2. What we collect</h2>
        <h3>If you leave a tip</h3>
        <ul>
          <li>The amount, the time, the venue and the staff member you thanked.</li>
          <li>Any note you write, and whether you chose to cover the card fee or put your tip toward a staff member&apos;s dream.</li>
          <li>A payment reference from Stripe. <strong>We never see or store your card details</strong>; Stripe handles them under its own privacy policy, and may ask for your email to send a receipt.</li>
          <li>Your IP address, used for up to an hour to stop people flooding the payment page.</li>
        </ul>
        <p className="mt-2">You don&apos;t need an account, and we don&apos;t ask for your name.</p>
        <h3>If you receive tips</h3>
        <ul>
          <li>Your display name, role, venue and a photo if your manager adds one.</li>
          <li>Your email address, if you&apos;re invited to sign in and see your own tips.</li>
          <li>The tips and notes you receive, and any dream you share (its title, story and progress).</li>
          <li>How many times your QR code or NFC badge was scanned or tapped. This doesn&apos;t identify the customer.</li>
        </ul>
        <h3>If you run a venue, or sponsor dreams</h3>
        <ul>
          <li>Your name, business contact details and the venue&apos;s details.</li>
          <li>Plan and billing details. Payment cards are handled by Stripe.</li>
          <li>Feedback and testimonials you give us, which we only quote with your permission.</li>
        </ul>
        <h3>If you ask about your data</h3>
        <p>What you tell us in the request, so we can find your records and reply.</p>
      </section>

      <section id="why">
        <h2>3. Why we use it, and our legal basis</h2>
        <ul>
          <li><strong>To take and record tips</strong>: to provide the service you asked for (contract).</li>
          <li><strong>To show staff and their managers the tips and notes they received</strong>: our legitimate interest, and theirs, in recognising good service.</li>
          <li><strong>To prevent fraud and abuse</strong>, such as rate-limiting the payment page: legitimate interests.</li>
          <li><strong>To keep payment records for tax</strong>: legal obligation.</li>
          <li><strong>To show a dream on the public Dream Wall</strong>: only when the staff member chooses to (consent).</li>
          <li><strong>To bill venues and sponsors</strong>: contract.</li>
          <li><strong>To count scans, taps and tips</strong> so venues can see what works: legitimate interests. These are totals only.</li>
        </ul>
        <ForReview>Check each legal basis, and whether a legitimate interests assessment is needed for showing notes to managers and for scan counts.</ForReview>
      </section>

      <section id="blockchain">
        <h2>4. The permanent record</h2>
        <p>
          Each tip gets a permanent public record so anyone can check it happened and hasn&apos;t been changed. We write a{" "}
          <strong>fingerprint</strong> (a cryptographic hash) of the tip to the Base blockchain, once an hour for all tips in that hour,
          and stamp that hour&apos;s record on the Bitcoin blockchain as a backup.
        </p>
        <p className="mt-2">
          The fingerprint is made from the tip&apos;s details, but <strong>no name, note or card detail can be read from it</strong>.
          Blockchain records can&apos;t be changed or deleted by anyone, including us. If you ask us to delete your data, we delete
          everything that identifies you from our systems, so the fingerprint can no longer be linked back to you.
        </p>
        <ForReview>Whether these hashes count as personal data under UK GDPR (they are pseudonymous while we hold the linking data), and whether this explanation and the erasure approach are enough. The note&apos;s fingerprint is a plain hash, so a very short, guessable note could in theory be matched; consider whether to add a secret salt.</ForReview>
      </section>

      <section id="sharing">
        <h2>5. Who we share it with</h2>
        <ul>
          <li><strong>The venue</strong>: managers see tips and notes for their own staff.</li>
          <li><strong>Stripe</strong>: card payments, subscriptions and invoices.</li>
          <li><strong>Supabase</strong>: our database and sign-in.</li>
          <li><strong>Vercel</strong>: hosts the website.</li>
          <li><strong>Upstash</strong>: short-lived rate-limit counters.</li>
          <li><strong>Sponsors</strong>: totals only (views, tips and dreams funded). Never a customer&apos;s details or notes.</li>
          <li><strong>The public</strong>: a staff member&apos;s first name and dream on the Dream Wall, only if they choose; and tip fingerprints on public blockchains.</li>
        </ul>
        <p className="mt-2">We don&apos;t sell personal data, and we don&apos;t use it for advertising.</p>
      </section>

      <section id="transfers">
        <h2>6. Where it&apos;s stored</h2>
        <p>
          Our database is hosted in [region]. Some of our providers may process data outside the UK. Where they do, we use the
          safeguards UK law requires, such as the UK International Data Transfer Agreement or Addendum.
        </p>
        <ForReview>Confirm each provider&apos;s region and transfer mechanism, and list them.</ForReview>
      </section>

      <section id="retention">
        <h2>7. How long we keep it</h2>
        <ul>
          <li>Tip amounts and payment references: 6 years, for tax records.</li>
          <li>Notes: for as long as the tip is kept, unless you ask us to delete them sooner.</li>
          <li>Staff profiles: until the staff member is removed, then [period].</li>
          <li>IP addresses for rate limiting: up to one hour.</li>
          <li>Data requests and our replies: [2 years], to show we handled them.</li>
          <li>Blockchain fingerprints: permanently, as explained above.</li>
        </ul>
      </section>

      <section id="cookies">
        <h2>8. Cookies</h2>
        <p>
          We only use the cookies needed to keep venue owners and staff signed in. Customers leaving a tip don&apos;t get any cookies
          from us. There are no advertising or analytics cookies. Stripe&apos;s checkout page sets its own cookies to prevent fraud.
        </p>
      </section>

      <section id="rights">
        <h2>9. Your rights</h2>
        <p>
          You can ask for a copy of your data, ask us to correct or delete it, object to how we use it, or ask us to limit it. Use{" "}
          <Link href="/privacy/requests" className="underline">our data request form</Link>; we reply within one month.
        </p>
        <p className="mt-2">
          If you&apos;re unhappy with how we&apos;ve handled your data, you can complain to the ICO at ico.org.uk or on 0303 123 1113.
        </p>
      </section>

      <section id="changes">
        <h2>10. Changes to this notice</h2>
        <p>We&apos;ll update the date at the top when this notice changes, and tell venues by email about significant changes.</p>
      </section>
    </LegalPage>
  );
}
