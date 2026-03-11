export interface ParsedLedgerEntry {
  account: string;
  tokenAddress: string;
  deltaAmount: string;
  direction: "credit" | "debit";
  entryType: string;
}

export interface ParsedResult {
  transfers: any[];
  ledgerEntries: ParsedLedgerEntry[];
}
