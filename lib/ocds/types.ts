export interface OCDSRelease {
  ocid?: string;
  id?: string;
  date?: string;
  tag?: string[];
  initiationType?: string;
  language?: string;
  description?: string;
  buyer?: { id?: string; name?: string };
  parties?: OCDSParty[];
  tender?: OCDSTender;
  awards?: OCDSAward[];
  contracts?: OCDSContract[];
  planning?: { rationale?: string };
  links?: { rel?: string; url?: string }[];
}

export interface OCDSParty {
  id?: string;
  name?: string;
  roles?: string[] | string;
  identifier?: { scheme?: string; id?: string; legalName?: string };
  address?: {
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    countryName?: string;
  };
  contactPoint?: { email?: string; telephone?: string };
  details?: { url?: string };
}

export interface OCDSClassification {
  scheme?: string;
  id?: string;
  description?: string;
}

export interface OCDSTender {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  value?: { amount?: number; currency?: string };
  minValue?: { amount?: number; currency?: string };
  maxValue?: { amount?: number; currency?: string };
  classification?: OCDSClassification | OCDSClassification[];
  items?: {
    id?: string;
    classification?: OCDSClassification | OCDSClassification[];
    deliveryAddresses?: { region?: string; countryName?: string }[];
  }[];
  procurementMethod?: string;
  procurementMethodDetails?: string;
  tenderPeriod?: { startDate?: string; endDate?: string };
  contractPeriod?: { startDate?: string; endDate?: string };
  datePublished?: string;
  documents?: {
    id?: string;
    title?: string;
    url?: string;
    format?: string;
    documentType?: string;
  }[];
  mainProcurementCategory?: string;
}

export interface OCDSAward {
  id?: string;
  status?: string;
  date?: string;
  value?: { amount?: number; currency?: string };
  suppliers?: { id?: string; name?: string }[];
}

export interface OCDSContract {
  id?: string;
  awardID?: string;
  status?: string;
  period?: { startDate?: string; endDate?: string };
}

export interface OCDSReleasePackage {
  uri?: string;
  version?: string;
  publishedDate?: string;
  releases?: OCDSRelease[];
  links?: { rel?: string; url?: string; href?: string } | { next?: string };
}
