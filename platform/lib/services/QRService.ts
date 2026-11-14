import QRCode from "qrcode";
import { appConfig } from "@/lib/config";
import { QR_SOURCE_PARAM, type VisitSource } from "@/lib/services/ScanService";

/**
 * Links printed on QR cards and written to NFC tags. Both open the same page; the `src` tag only
 * tells GratiFi which one the customer used.
 */
export class QRService {
  venueUrl(slug: string, source: VisitSource = "qr") {
    return `${appConfig.appUrl}/v/${slug}?${QR_SOURCE_PARAM}=${source}`;
  }

  workerUrl(workerId: string, source: VisitSource = "qr") {
    return `${appConfig.appUrl}/tip/${workerId}?${QR_SOURCE_PARAM}=${source}`;
  }

  toSvg(url: string) {
    return QRCode.toString(url, { type: "svg", margin: 2, width: 512 });
  }

  toPngDataUrl(url: string) {
    return QRCode.toDataURL(url, { margin: 2, width: 1024 });
  }
}
