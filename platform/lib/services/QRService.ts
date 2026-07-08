import QRCode from "qrcode";
import { appConfig } from "@/lib/config";

export class QRService {
  venueUrl(slug: string) {
    return `${appConfig.appUrl}/v/${slug}`;
  }

  workerUrl(workerId: string) {
    return `${appConfig.appUrl}/tip/${workerId}`;
  }

  toSvg(url: string) {
    return QRCode.toString(url, { type: "svg", margin: 2, width: 512 });
  }

  toPngDataUrl(url: string) {
    return QRCode.toDataURL(url, { margin: 2, width: 1024 });
  }
}
