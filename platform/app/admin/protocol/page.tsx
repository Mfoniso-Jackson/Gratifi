import { requireGlobalAdmin } from "@/lib/auth/access";
import { AdminShell, Stat } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { MoonbeamService } from "@/lib/services/MoonbeamService";
import { protocolVersion } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/server";
import { addressUrl, networkName } from "@/lib/explorer";

export const dynamic = "force-dynamic";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-ink/10 py-3 first:border-t-0 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm text-ink/60">{label}</dt>
      <dd className="min-w-0 break-all text-sm">{children}</dd>
    </div>
  );
}

export default async function ProtocolPage() {
  await requireGlobalAdmin();
  const moonbeam = new MoonbeamService();
  const status = await moonbeam.status().catch((error) => ({
    configured: false,
    contractAddress: null,
    recognitionCount: null,
    error: error instanceof Error ? error.message : "Unknown error"
  }));
  const wallet = await moonbeam.operatorWalletStatus().catch(() => null);
  const events = ((await createServiceClient().from("recognition_events").select("moonbeam_status")).data ?? []) as any[];
  const confirmed = events.filter((e) => e.moonbeam_status === "confirmed").length;
  const waiting = events.length - confirmed;
  const contractLink = addressUrl(status.contractAddress);
  const walletLink = addressUrl(wallet?.address);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Protocol</h1>
        {status.configured ? <StatusPill tone="good">Recording on {networkName()}</StatusPill> : <StatusPill tone="warn">Not connected to Moonbeam</StatusPill>}
      </div>
      <p className="mt-2 max-w-2xl text-ink/70">
        Every paid tip gets a permanent record on Moonbeam. This page checks the contract and the wallet that pays for those records.
      </p>

      {wallet?.low && (
        <div className="mt-6 rounded-xl bg-coral/15 p-4 text-sm text-[#8f2e1f]">
          <strong>The operator wallet is running low:</strong> {wallet.balance} GLMR left (warning below {wallet.threshold}). Top it up, or new
          tips will wait to be recorded.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Tips in the database" value={String(events.length)} />
        <Stat label="Recorded on Moonbeam" value={String(confirmed)} />
        <Stat label="Waiting or retrying" value={String(waiting)} />
      </div>

      <dl className="mt-6 rounded-xl border border-ink/10 bg-white px-5 py-2">
        <Row label="Protocol version">{protocolVersion}</Row>
        <Row label="Network">{networkName()}</Row>
        <Row label="Contract">
          {status.contractAddress ? (contractLink ? <a href={contractLink} target="_blank" rel="noreferrer" className="underline">{status.contractAddress}</a> : status.contractAddress) : "Not configured"}
        </Row>
        <Row label="Records on the contract">{status.recognitionCount ?? "Unavailable"}</Row>
        <Row label="Operator wallet">
          {wallet === null ? (
            "Balance unavailable"
          ) : wallet.configured ? (
            <span className="flex flex-wrap items-center gap-2">
              {wallet.low ? <StatusPill tone="bad">Low</StatusPill> : <StatusPill tone="good">OK</StatusPill>}
              {wallet.balance} GLMR ·{" "}
              {walletLink ? <a href={walletLink} target="_blank" rel="noreferrer" className="underline">{wallet.address}</a> : wallet.address}
            </span>
          ) : (
            "Not configured"
          )}
        </Row>
        <Row label="Uptime check"><code className="text-xs">/api/health/operator-wallet</code> returns an error when the wallet is low</Row>
        {"error" in status && status.error ? <Row label="Last error">{String(status.error)}</Row> : null}
      </dl>
    </AdminShell>
  );
}
