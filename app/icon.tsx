import { envelopeIcon } from "./lib/envelopeIcon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return envelopeIcon(32);
}
