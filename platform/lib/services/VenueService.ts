export class VenueService {
  constructor(private readonly db: any) {}

  listActive() {
    return this.db.from("venues").select("*").eq("status", "active").order("created_at", { ascending: false });
  }

  getBySlug(slug: string) {
    return this.db.from("venues").select("*").eq("slug", slug).eq("status", "active").single();
  }

  upsert(input: { id?: string; slug: string; name: string; address?: string | null; status?: string }) {
    return this.db.from("venues").upsert({ status: "active", ...input }).select("*").single();
  }
}
