import type { SelectHTMLAttributes } from "react";
import { PHONE_COUNTRIES, phoneCountryLabel } from "@/lib/phone";

/*
  The WhatsApp number's country picker, shared by every lead form (lib/phone validates the number against it).
  The form styles and places it; controlled (value/onChange) or uncontrolled (name + defaultValue) both work.
*/
export function PhoneCountrySelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select aria-label="Country code" {...props}>
      {PHONE_COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {phoneCountryLabel(c)}
        </option>
      ))}
    </select>
  );
}
