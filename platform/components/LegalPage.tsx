import Link from "next/link";
import { PublicShell } from "@/components/Shell";

/** Layout for the privacy notice and terms: a draft banner, contents list and readable column. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
  children
}: {
  title: string;
  intro: string;
  updated: string;
  sections: Array<[id: string, label: string]>;
  children: React.ReactNode;
}) {
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-5 pb-16 pt-6 md:pt-10">
        <div className="rounded-xl border border-[#e8c96a] bg-[#fff6e5] p-4 text-sm leading-6">
          <strong>Draft for legal review.</strong> This page is not yet in force. Text in [square brackets] needs filling in, and
          the boxes marked &ldquo;For review&rdquo; are questions for a lawyer.
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated {updated}</p>
        <p className="mt-4 text-lg leading-8 text-ink/80">{intro}</p>
        <nav aria-label="Contents" className="mt-6 rounded-xl border border-ink/10 bg-white p-4 text-sm">
          <p className="font-semibold">Contents</p>
          <ol className="mt-2 grid list-decimal gap-1 pl-5 sm:grid-cols-2">
            {sections.map(([id, label]) => (
              <li key={id}><Link href={`#${id}`} className="underline-offset-2 hover:underline">{label}</Link></li>
            ))}
          </ol>
        </nav>
        <div className="legal mt-8 grid gap-8 leading-7 text-ink/80 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-1 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </PublicShell>
  );
}

/** A question for the lawyer, shown only while the page is a draft. */
export function ForReview({ children }: { children: React.ReactNode }) {
  return (
    <aside className="mt-3 rounded-lg border-l-4 border-[#e8c96a] bg-[#fffaf0] px-4 py-2 text-sm leading-6 text-ink/70">
      <strong className="text-ink">For review:</strong> {children}
    </aside>
  );
}
