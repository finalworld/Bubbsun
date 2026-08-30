type Ref = { collection: string; id: string };
type CollectionRef = { collection: string };
type ApiDoc = { id: string; data: Record<string, unknown> };

export const firestore = {};
export const doc = (_db: unknown, collectionName: string, id: string): Ref => ({ collection: collectionName, id });
export const collection = (_db: unknown, collectionName: string): CollectionRef => ({ collection: collectionName });
export const kassaStateRef = doc(firestore, "rk-kassa", "shared-state");
export const categoryStateRef = doc(firestore, "rk-kassa", "categories");
export const cashierStateRef = doc(firestore, "rk-kassa", "cashiers");
export const salesCollectionRef = collection(firestore, "kassa-sales");

const endpoint = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/`;
const request = async <T>(payload: Record<string, unknown>) => {
  const response = await fetch(endpoint, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({})) as T & { ok?: boolean; error?: string };
  if (!response.ok || data.ok === false) throw new Error(data.error || "Databasen svarar inte.");
  return data;
};
export async function login(username: string, passwordHash: string) { return request<{ user: { id: string; username: string; role: "admin" | "cashier" } }>({ action: "login", username, passwordHash }); }
export async function logout() { await request({ action: "logout" }); }
export async function importLegacyData() {
  // Körs bara vid första inloggningen mot den tomma Strato-databasen. Därefter
  // stoppar servern automatiskt fler importer.
  const legacy = createClient("https://hqqkvkrkozrcjxeljwqg.supabase.co", "sb_publishable_glRT-nHMVHqmZsuYpm41PQ_k5OW5PXg");
  const [members, state, categories, cashiers, sales] = await Promise.all([
    legacy.from("rk_members").select("*"), legacy.from("rk_state").select("*").eq("id", "shared-state").maybeSingle(), legacy.from("rk_categories").select("*").eq("id", "main").maybeSingle(), legacy.from("rk_cashiers").select("*").eq("id", "main").maybeSingle(), legacy.from("rk_sales").select("*"),
  ]);
  const mapMember = (row: Record<string, unknown>) => ({ id: String(row.username), data: { name: row.name || row.username, passwordHash: row.password_hash, admin: row.is_admin, createdAt: row.created_at } });
  const docs = [
    state.data ? { id: "shared-state", data: (state.data.data || {}) as Record<string, unknown> } : null,
    categories.data ? { id: "categories", data: { items: categories.data.items || [] } } : null,
    cashiers.data ? { id: "cashiers", data: { cashiers: cashiers.data.cashiers || [], currentCashierId: cashiers.data.current_cashier_id || null } } : null,
  ].filter(Boolean);
  const mappedSales = (sales.data || []).map((row) => ({ id: String(row.id), data: { id: Number(row.id), time: row.sale_time, payment: row.payment, lines: row.lines, kind: row.kind, reason: row.reason, cashier: row.cashier, sessionId: row.session_id } }));
  await request({ action: "import-legacy", members: (members.data || []).map(mapMember), documents: docs, sales: mappedSales });
}
export async function getDoc(reference: Ref) {
  const data = await request<{ data: Record<string, unknown> | null }>({ action: "doc", collection: reference.collection, id: reference.id });
  return { id: reference.id, exists: () => Boolean(data.data), data: () => data.data || undefined };
}
export async function getDocs(reference: CollectionRef) {
  const data = await request<{ docs: ApiDoc[] }>({ action: "docs", collection: reference.collection });
  return { docs: (data.docs || []).map((item) => ({ id: item.id, data: () => item.data })) };
}
export async function setDoc(reference: Ref, value: Record<string, unknown>, options?: { merge?: boolean }) { await request({ action: "set", collection: reference.collection, id: reference.id, value, merge: Boolean(options?.merge) }); }
export async function deleteDoc(reference: Ref) { await request({ action: "delete", collection: reference.collection, id: reference.id }); }

// En enda surfplatta använder kassan: inga upprepade 15-sekundersläsningar.
export function onSnapshot(reference: Ref | CollectionRef, success: (value: { data: () => Record<string, unknown> | undefined; docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void, failure?: () => void) {
  void (async () => { try { if ("id" in reference) { const value = await getDoc(reference); success({ data: value.data, docs: [] }); } else { const value = await getDocs(reference); success({ data: () => undefined, docs: value.docs }); } } catch { failure?.(); } })();
  return () => undefined;
}
import { createClient } from "@supabase/supabase-js";
