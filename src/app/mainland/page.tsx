import { AdviceLanding, adviceMetadata } from "@/components/freezone/AdviceLanding";
import { MAINLAND } from "@/content/advice";

export const metadata = adviceMetadata(MAINLAND);

export default function MainlandPage() {
  return <AdviceLanding p={MAINLAND} />;
}
