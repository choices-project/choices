// Temporary minimal types. Swap for generated types when ready.
export type Database = {
  public: {
    Tables: {
      polls: { Row: { id: string; title?: string; total_votes?: number; created_at?: string } };
      votes: { Row: { id: string; poll_id: string; user_id?: string; option_id?: string; created_at?: string } };
      users: { Row: { id: string; handle?: string } };
      // add more tables as you refactor tests
    };
  };
};






