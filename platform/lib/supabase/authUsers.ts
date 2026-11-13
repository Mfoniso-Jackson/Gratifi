/** Finds a Supabase Auth user id by email with a service-role client (paged; fine for thousands of users). */
export async function findUserIdByEmail(db: any, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const result = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) throw result.error;
    const users = result.data?.users ?? [];
    const match = users.find((user: { email?: string }) => user.email?.toLowerCase() === target);
    if (match) return match.id;
    if (users.length < 200) return null;
  }
  return null;
}
