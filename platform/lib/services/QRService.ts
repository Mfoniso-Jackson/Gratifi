import QRCode from "qrcode";
import { appConfig } from "@/lib/config";
import { QR_SOURCE_PARAM, QR_SOURCE_VALUE } from "@/lib/services/ScanService";

export class QRService {
  venueUrl(slug: string) {
    return `${appConfig.appUrl}/v/${slug}?${QR_SOURCE_PARAM}=${QR_SOURCE_VALUE}`;
  }

  workerUrl(workerId: string) {
    return `${appConfig.appUrl}/tip/${workerId}?${QR_SOURCE_PARAM}=${QR_SOURCE_VALUE}`;
  }

  toSvg(url: string) {
    return QRCode.toString(url, { type: "svg", margin: 2, width: 512 });
  }

  toPngDataUrl(url: string) {
    return QRCode.toDataURL(url, { margin: 2, width: 1024 });
  }
}
