export class WorkerService {
  constructor(private readonly db: any) {}

  listByVenue(venueId: string) {
    return this.db
      .from("workers")
      .select("*")
      .eq("venue_id", venueId)
      .eq("status", "active")
      .order("display_name");
  }

  get(workerId: string) {
    return this.db.from("workers").select("*, venues(*)").eq("id", workerId).eq("status", "active").single();
  }

  upsert(input: {
    id?: string;
    venue_id: string;
    display_name: string;
    role: string;
    photo_url?: string | null;
    status?: string;
  }) {
    return this.db.from("workers").upsert({ status: "active", ...input }).select("*").single();
  }
}
