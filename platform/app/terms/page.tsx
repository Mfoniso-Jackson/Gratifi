import Link from "next/link";
import type { Metadata } from "next";
import { ForReview, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms · GratiFi" };

const sections: Array<[string, string]> = [
  ["about", "About these terms"],
  ["tipping", "Leaving a tip"],
  ["notes", "Notes"],
  ["dreams", "Dreams and sponsor matches"],
  ["venues", "For venues"],
  ["staff", "For staff"],
  ["record", "The permanent record"],
  ["liability", "Our responsibility to you"],
  ["general", "General"]
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="[date]"
      intro="These terms cover using GratiFi to leave a tip, to receive tips, or to run GratiFi at your venue. They're written to be read, so they're short."
      sections={sections}
    >
      <section id="about">
        <h2>1. About these terms</h2>
        <p>
          GratiFi is run by [company name] (&ldquo;we&rdquo;), company number [number], [registered address]. By leaving a tip, signing in,
          or signing up a venue, you agree to these terms. Our <Link href="/privacy" className="underline">privacy notice</Link> explains
          how we use personal data.
        </p>
      </section>

      <section id="tipping">
        <h2>2. Leaving a tip</h2>
        <ul>
          <li>A tip is a voluntary gift to recognise the person who served you. Tips are between £2 and £500.</li>
          <li>Payments are taken by Stripe. You pay the amount shown before you confirm.</li>
          <li>
            You can choose to add the card fee on top, so the person you thanked receives the full tip. It&apos;s shown separately and
            it&apos;s never added unless you tick the box.
          </li>
          <li>[How the tip reaches the staff member, once decided: through the venue&apos;s payroll, or paid to them directly.]</li>
          <li>
            Tips can&apos;t normally be cancelled once paid. If something went wrong, such as a duplicate payment or the wrong amount,
            contact us within [14 days] and we&apos;ll put it right. This doesn&apos;t affect your legal rights.
          </li>
        </ul>
        <ForReview>Who receives the tip in law (venue or staff member), how the Employment (Allocation of Tips) Act 2023 applies to each option, and who must bear the card fee. Also whether the optional fee add-on meets the price transparency rules in the Digital Markets, Competition and Consumers Act 2024.</ForReview>
      </section>

      <section id="notes">
        <h2>3. Notes</h2>
        <p>
          Notes are for thanking people. Please don&apos;t include anything offensive, threatening or discriminatory, or anyone&apos;s
          personal details such as phone numbers. We or the venue may hide notes that break these rules. The tip itself still goes
          through.
        </p>
      </section>

      <section id="dreams">
        <h2>4. Dreams and sponsor matches</h2>
        <ul>
          <li>Staff can share a goal (a &ldquo;dream&rdquo;) once their manager approves it. You can choose to put your tip toward it.</li>
          <li>
            Some dreams are backed by a sponsor who matches tips from a fixed fund. A match is paid only while the sponsor&apos;s fund
            lasts, so the progress shown before you pay is an estimate.
          </li>
          <li>Venues can block any sponsor from appearing at their venue.</li>
        </ul>
        <ForReview>The Dream Fund and sponsor matching are switched off until reviewed, including how matched money is held and paid, and advertising rules for sponsor placements.</ForReview>
      </section>

      <section id="venues">
        <h2>5. For venues</h2>
        <ul>
          <li>Your first 30 days are a free pilot. To keep taking tips afterwards, choose a plan. If you don&apos;t, new tips pause after a 7-day grace period. Nothing is deleted, and choosing a plan restarts tips straight away.</li>
          <li>Plans are billed monthly or yearly by Stripe. You can cancel at any time and keep access until the end of the period you&apos;ve paid for.</li>
          <li>
            You&apos;re responsible for passing tips to your staff fairly and in full, as the Employment (Allocation of Tips) Act 2023
            requires, including having a written tipping policy and not taking deductions from tips.
          </li>
          <li>You confirm your staff are happy for their names, roles and any photos to appear on their tip pages.</li>
          <li>You&apos;ll keep your admin sign-in secure and tell us if it&apos;s misused.</li>
        </ul>
        <ForReview>Whether venues need a separate written agreement (including a data processing agreement) instead of these terms.</ForReview>
      </section>

      <section id="staff">
        <h2>6. For staff</h2>
        <p>
          If you&apos;re invited to sign in, you can see the tips and notes you&apos;ve received and propose a dream. Your manager can
          remove your access. You can ask us for a copy of your data or to delete it at any time through{" "}
          <Link href="/privacy/requests" className="underline">our data request form</Link>.
        </p>
      </section>

      <section id="record">
        <h2>7. The permanent record</h2>
        <p>
          Each tip&apos;s fingerprint is written to public blockchains (Base, with a backup on Bitcoin) so it can be checked later. These
          records can&apos;t be changed or removed. They contain no names, notes or card details. A refunded tip stays in the record
          but no longer counts toward totals.
        </p>
      </section>

      <section id="liability">
        <h2>8. Our responsibility to you</h2>
        <p>
          We work hard to keep GratiFi running, but we can&apos;t promise it will always be available. We&apos;re not responsible for
          losses we couldn&apos;t reasonably foresee, or for how a venue shares tips with its staff. Nothing in these terms limits
          our liability where the law doesn&apos;t allow it, such as for death or personal injury caused by negligence, or for fraud.
        </p>
        <ForReview>A cap on liability for venues (business customers), and whether one is appropriate here.</ForReview>
      </section>

      <section id="general">
        <h2>9. General</h2>
        <ul>
          <li>We may update these terms. We&apos;ll change the date above, and give venues at least 30 days&apos; notice of changes that affect them.</li>
          <li>These terms are governed by the law of [England and Wales]. If you live in Scotland or Northern Ireland, you can also bring a claim there.</li>
          <li>Questions? Contact us at [hello@example.com].</li>
        </ul>
      </section>
    </LegalPage>
  );
}
