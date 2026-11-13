import { MoonbeamService } from "@/lib/services/MoonbeamService";

export const dynamic = "force-dynamic";

/**
 * Public health check for uptime monitors: 200 when the Moonbeam operator wallet has enough balance
 * (or Moonbeam is not configured yet), 503 when it is low or the balance cannot be read.
 * The wallet address and balance are public on-chain, so nothing private is exposed.
 */
export async function GET() {
  try {
    const wallet = await new MoonbeamService().operatorWalletStatus();
    if (!wallet.configured) return Response.json({ status: "not_configured" });
    return Response.json(
      { status: wallet.low ? "low" : "ok", balance: wallet.balance, threshold: wallet.threshold },
      { status: wallet.low ? 503 : 200 }
    );
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
