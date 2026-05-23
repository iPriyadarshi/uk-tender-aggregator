/** Top-level CPV division → sector label for dashboard filters */
// https://cpvcodes.eu/en/
// CPV (Common Procurement Vocabulary)

export const CPV_SECTORS: Record<string, string> = {
  "03": "Agriculture & food",
  "09": "Petroleum & fuel",
  "14": "Mining & minerals",
  "15": "Food & beverages",
  "16": "Agricultural machinery",
  "18": "Clothing & textiles",
  "22": "Printed matter",
  "24": "Chemical products",
  "30": "Office & computing equipment",
  "31": "Electrical machinery",
  "32": "Telecom & broadcasting",
  "33": "Medical equipment",
  "34": "Transport equipment",
  "35": "Security & defence",
  "37": "Musical & sport goods",
  "38": "Laboratory equipment",
  "39": "Furniture",
  "41": "Collected water",
  "42": "Industrial machinery",
  "43": "Mining machinery",
  "44": "Construction structures",
  "45": "Construction works",
  "48": "Software packages",
  "50": "Repair & maintenance",
  "51": "Installation services",
  "55": "Hotel & restaurant",
  "60": "Transport services",
  "63": "Supporting transport",
  "64": "Postal & telecom",
  "65": "Utilities",
  "66": "Financial & insurance",
  "70": "Real estate",
  "71": "Architecture & engineering",
  "72": "IT services",
  "73": "Research & development",
  "75": "Public administration",
  "76": "Oil & gas services",
  "77": "Agriculture services",
  "79": "Business services",
  "80": "Education services",
  "85": "Health & social",
  "90": "Sewage & refuse",
  "92": "Recreation & culture",
  "98": "Other services",
};

export function cpvToSector(cpvCode: string): string {
  const prefix = cpvCode.replace(/\D/g, "").slice(0, 2);
  return CPV_SECTORS[prefix] ?? "Other";
}

export function extractCpvCodes(release: import("./types").OCDSRelease): {
  codes: string[];
  labels: string[];
} {
  const codes: string[] = [];
  const labels: string[] = [];

  const add = (c?: import("./types").OCDSClassification) => {
    if (!c?.id) return;
    const id = c.id.replace(/\D/g, "").padStart(8, "0").slice(0, 8);
    if (!codes.includes(id)) {
      codes.push(id);
      if (c.description) labels.push(c.description);
    }
  };

  const tender = release.tender;
  if (tender?.classification) {
    const c = tender.classification;
    if (Array.isArray(c)) c.forEach(add);
    else add(c);
  }
  for (const item of tender?.items ?? []) {
    const cl = item.classification;
    if (Array.isArray(cl)) cl.forEach(add);
    else if (cl) add(cl);
  }

  return { codes, labels };
}
