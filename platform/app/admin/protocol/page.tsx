import { AdminShell } from "@/components/Shell";
import { MoonbeamService } from "@/lib/services/MoonbeamService";
import { protocolVersion } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function ProtocolPage() {
  const status = await new MoonbeamService().status().catch((error) => ({
    configured: false,
    contractAddress: null,
    recognitionCount: null,
    error: error instanceof Error ? error.message : "Unknown error"
  }));

  const wallet = await new MoonbeamService().operatorWalletStatus().catch(() => null);

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Protocol</h1>
      {wallet?.low && (
        <div className="mt-6 rounded-md border border-[#b33a26]/30 bg-coral/10 p-4 text-sm">
          <strong>Operator wallet is low:</strong> {wallet.balance} GLMR left (warning below {wallet.threshold}). Top it up
          or new recognitions will stay pending.
        </div>
      )}
      <div className="mt-6 grid gap-4 rounded-md border border-ink/10 bg-white p-5">
        <p><strong>Version:</strong> {protocolVersion}</p>
        <p><strong>Moonbeam configured:</strong> {String(status.configured)}</p>
        <p className="break-all"><strong>Contract:</strong> {status.contractAddress ?? "Not configured"}</p>
        <p><strong>Recognition count:</strong> {status.recognitionCount ?? "Unavailable"}</p>
        <p className="break-all">
          <strong>Operator wallet:</strong>{" "}
          {wallet === null ? "Balance unavailable" : wallet.configured ? `${wallet.balance} GLMR (${wallet.address})` : "Not configured"}
        </p>
      </div>
    </AdminShell>
  );
}
