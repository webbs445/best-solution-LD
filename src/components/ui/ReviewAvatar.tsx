import Image from "next/image";
import type { SiteReview } from "@/content/site";

/* A reviewer's photo, or their first initial in a neutral circle when there is no photo (same size and place). */
export function ReviewAvatar({ r, className }: { r: SiteReview; className: string }) {
  if (r.photo) return <Image className={className} src={r.photo} alt="" width={44} height={44} />;
  return (
    <i className={`${className} review-initial`} aria-hidden="true">
      {r.name.trim().charAt(0).toUpperCase()}
    </i>
  );
}
