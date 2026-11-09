import { AdviceLanding, adviceMetadata } from "@/components/freezone/AdviceLanding";
import { OFFSHORE } from "@/content/advice";

export const metadata = adviceMetadata(OFFSHORE);

export default function OffshorePage() {
  return <AdviceLanding p={OFFSHORE} />;
}
