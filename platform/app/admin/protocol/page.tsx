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

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Protocol</h1>
      <div className="mt-6 grid gap-4 rounded-md border border-ink/10 bg-white p-5">
        <p><strong>Version:</strong> {protocolVersion}</p>
        <p><strong>Moonbeam configured:</strong> {String(status.configured)}</p>
        <p className="break-all"><strong>Contract:</strong> {status.contractAddress ?? "Not configured"}</p>
        <p><strong>Recognition count:</strong> {status.recognitionCount ?? "Unavailable"}</p>
      </div>
    </AdminShell>
  );
}
