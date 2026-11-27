/*
  Where consent is asked first (opt-in): EU27, the EEA/EFTA states, the UK (UK GDPR) and Switzerland (FADP).
  Visitors here start with every Consent Mode signal denied until they choose; everyone else starts granted and can
  reject. One list for the gtag region default (ConsentInit) and the /api/geo answer the banner uses.
*/
export const OPT_IN_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", // EU27
  "IS", "LI", "NO", // EEA / EFTA
  "GB", // UK GDPR
  "CH", // Swiss FADP
] as const;
