export type Transaction = {
  id: string;
  user_id: string;
  occurred_on: string; // ISO date, e.g. "2026-09-14"
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
};

/** Shape used when creating a transaction (locally or offline-queued). */
export type NewTransaction = {
  occurred_on: string;
  amount: number;
  category: string;
  note?: string;
};
