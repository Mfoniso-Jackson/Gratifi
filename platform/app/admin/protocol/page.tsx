import { requireGlobalAdmin } from "@/lib/auth/access";
import { AdminShell, Stat } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { ChainService } from "@/lib/services/ChainService";
import { appConfig, protocolVersion } from "@/lib/config";
import { chainInfo } from "@/lib/chains";
import { createServiceClient } from "@/lib/supabase/server";
import { addressUrl, networkName, txUrl } from "@/lib/explorer";

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
  const chain = new ChainService();
  const network = chainInfo(appConfig.chain.chainId);
  const gasToken = network?.gasToken ?? "ETH";
  const status = await chain.status().catch((error) => ({
    configured: false,
    contractAddress: null,
    recognitionCount: null,
    retired: Boolean(network?.retired),
    error: error instanceof Error ? error.message : "Unknown error"
  }));
  const wallet = await chain.operatorWalletStatus().catch(() => null);
  const events = ((await createServiceClient().from("recognition_events").select("anchor_status, anchor_chain_id")).data ?? []) as any[];
  const confirmed = events.filter((e) => e.anchor_status === "confirmed").length;
  // Older records written to Moonbeam before it shut down.
  const onRetired = events.filter((e) => e.anchor_status === "confirmed" && chainInfo(e.anchor_chain_id)?.retired).length;
  const waiting = events.length - confirmed;
  const batches = ((await createServiceClient().from("anchor_batches").select("*").order("created_at", { ascending: false }).limit(10)).data ?? []) as any[];
  const contractLink = addressUrl(status.contractAddress);
  const walletLink = addressUrl(wallet?.address);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Protocol</h1>
        {status.configured ? <StatusPill tone="good">Recording on {networkName()}</StatusPill> : <StatusPill tone="warn">Not connected</StatusPill>}
      </div>
      <p className="mt-2 max-w-2xl text-ink/70">
        Every paid tip gets a permanent record on Base, Coinbase&apos;s Ethereum network. Only a fingerprint (hash) of the tip is written,
        never names or notes. This page checks the contract and the wallet that pays for those records.
      </p>

      {network?.retired && (
        <div className="mt-6 rounded-xl bg-coral/15 p-4 text-sm text-[#8f2e1f]">
          <strong>{network.name} has shut down and no longer accepts records.</strong> Set <code>CHAIN_ID</code> to 8453 (Base) and deploy the
          contract there; see docs/base-deployment.md. Tips are kept and will be recorded once Base is set up.
        </div>
      )}

      {wallet?.low && (
        <div className="mt-6 rounded-xl bg-coral/15 p-4 text-sm text-[#8f2e1f]">
          <strong>The operator wallet is running low:</strong> {wallet.balance} {gasToken} left (warning below {wallet.threshold}). Top it up, or new
          tips will wait to be recorded.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Tips in the database" value={String(events.length)} />
        <Stat label="Recorded on-chain" value={String(confirmed)} />
        <Stat label="Waiting or retrying" value={String(waiting)} />
      </div>

      <section className="mt-6 rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-semibold">{appConfig.anchorMode === "batch" ? "Hourly batches" : "Recording mode"}</h2>
        <p className="mt-1 text-sm text-ink/60">
          {appConfig.anchorMode === "batch"
            ? "Once an hour, every waiting tip is written to Base as one Merkle root, and each tip keeps a proof that it's included. The root is also stamped on Bitcoin with OpenTimestamps as a free backup."
            : "Each tip is written in its own transaction straight away (ANCHOR_MODE=single). Set ANCHOR_MODE=batch to write one transaction an hour instead."}
        </p>
        {appConfig.anchorMode === "batch" && (
          batches.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No batches yet. The first one runs at the next hourly job once the contract is set up.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-ink/60">
                  <tr>{["When", "Tips", "Base", "Bitcoin backup", "Root"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {batches.map((b) => {
                    const link = txUrl(b.tx_hash, b.chain_id);
                    return (
                      <tr key={b.id} className="border-t border-ink/10 align-top">
                        <td className="whitespace-nowrap py-2 pr-3 text-ink/70">{new Date(b.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-2 pr-3 tabular-nums">{b.leaf_count}</td>
                        <td className="py-2 pr-3">
                          {b.status === "confirmed" ? <StatusPill tone="good">recorded</StatusPill> : b.status === "failed" ? <StatusPill tone="warn">failed, will retry</StatusPill> : <StatusPill tone="neutral">sending</StatusPill>}
                          {link && <a href={link} target="_blank" rel="noreferrer" className="ml-2 text-xs underline">View</a>}
                        </td>
                        <td className="py-2 pr-3">
                          {b.ots_status === "submitted" ? (
                            <span className="flex flex-wrap items-center gap-2">
                              <StatusPill tone="good">stamped</StatusPill>
                              <a href={`/api/v1/batches/${b.id}/ots`} className="text-xs underline">.ots</a>
                              <a href={`/api/v1/batches/${b.id}/root`} className="text-xs underline">root</a>
                            </span>
                          ) : b.ots_status === "failed" ? <StatusPill tone="warn">will retry</StatusPill> : <StatusPill tone="neutral">waiting</StatusPill>}
                        </td>
                        <td className="max-w-[180px] truncate py-2 pr-3 font-mono text-xs text-ink/60" title={b.merkle_root}>{b.merkle_root}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>

      <dl className="mt-6 rounded-xl border border-ink/10 bg-white px-5 py-2">
        <Row label="Protocol version">{protocolVersion}</Row>
        <Row label="Network">{networkName()}</Row>
        <Row label="Contract">
          {status.contractAddress ? (contractLink ? <a href={contractLink} target="_blank" rel="noreferrer" className="underline">{status.contractAddress}</a> : status.contractAddress) : "Not configured"}
        </Row>
        {onRetired > 0 && <Row label="Older records">{onRetired} written to Moonbeam before it shut down. Their fingerprints are still kept here.</Row>}
        <Row label="Records on the contract">{status.recognitionCount ?? "Unavailable"}</Row>
        <Row label="Operator wallet">
          {wallet === null ? (
            "Balance unavailable"
          ) : wallet.configured ? (
            <span className="flex flex-wrap items-center gap-2">
              {wallet.low ? <StatusPill tone="bad">Low</StatusPill> : <StatusPill tone="good">OK</StatusPill>}
              {wallet.balance} {gasToken} ·{" "}
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
