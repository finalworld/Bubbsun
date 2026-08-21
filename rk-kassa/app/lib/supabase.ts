import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://hqqkvkrkozrcjxeljwqg.supabase.co",
    "sb_publishable_glRT-nHMVHqmZsuYpm41PQ_k5OW5PXg",
);

type Ref = { collection: string; id: string };
type CollectionRef = { collection: string };
export const firestore = {};
export const doc = (_db: unknown, collectionName: string, id: string): Ref => ({ collection: collectionName, id });
export const collection = (_db: unknown, collectionName: string): CollectionRef => ({ collection: collectionName });
export const kassaStateRef = doc(firestore, "rk-kassa", "shared-state");
export const categoryStateRef = doc(firestore, "rk-kassa", "categories");
export const cashierStateRef = doc(firestore, "rk-kassa", "cashiers");
export const salesCollectionRef = collection(firestore, "kassa-sales");

const mapTable = (name: string) => name === "medlemmar" ? "rk_members" : name === "kassa-sales" ? "rk_sales" : name === "rk-kassa" ? "rk_state" : name;
const tableForRef = (reference: Ref) => reference.collection === "rk-kassa" && reference.id === "categories" ? "rk_categories" : reference.collection === "rk-kassa" && reference.id === "cashiers" ? "rk_cashiers" : mapTable(reference.collection);
const idForRef = (reference: Ref) => reference.collection === "rk-kassa" && (reference.id === "categories" || reference.id === "cashiers") ? "main" : reference.id;
const keyForRef = (reference: Ref) => reference.collection === "medlemmar" ? "username" : "id";
const fromRow = (collectionName: string, row: Record<string, unknown> | null) => {
  if (!row) return undefined;
  if (collectionName === "medlemmar") return { name: row.name || row.username, passwordHash: row.password_hash, admin: row.is_admin, createdAt: row.created_at };
  if (collectionName === "kassa-sales") return { id: Number(row.id), time: row.sale_time, payment: row.payment, lines: row.lines, kind: row.kind, reason: row.reason, cashier: row.cashier };
  if (collectionName === "rk-kassa") return row.items ? { items: row.items } : row.cashiers ? { cashiers: row.cashiers, currentCashierId: row.current_cashier_id } : (row.data || {}) as Record<string, unknown>;
  return row;
};
const toRow = (reference: Ref, value: Record<string, unknown>) => {
  if (reference.collection === "medlemmar") return { username: reference.id, name: value.name || reference.id, password_hash: value.passwordHash, is_admin: value.admin, created_at: new Date().toISOString() };
  if (reference.collection === "kassa-sales") return { id: Number(reference.id), sale_time: value.time, payment: value.payment, lines: value.lines, kind: value.kind || "sale", reason: value.reason || null, cashier: value.cashier || null, created_at: new Date(Number(reference.id)).toISOString() };
  if (reference.collection === "rk-kassa") return reference.id === "categories" ? { id: "main", items: value.items || [], updated_at: new Date().toISOString() } : reference.id === "cashiers" ? { id: "main", cashiers: value.cashiers || [], current_cashier_id: value.currentCashierId || null, updated_at: new Date().toISOString() } : { id: reference.id, data: value, updated_at: new Date().toISOString() };
  return { id: reference.id, ...value, updated_at: new Date().toISOString() };
};

export async function getDoc(reference: Ref) {
  const { data, error } = await supabase.from(tableForRef(reference)).select("*").eq(keyForRef(reference), idForRef(reference)).maybeSingle();
  if (error) throw error;
  const mapped = fromRow(reference.collection, data);
  return { exists: () => Boolean(mapped), data: () => mapped };
}
export async function getDocs(reference: CollectionRef) {
  const { data, error } = await supabase.from(mapTable(reference.collection)).select("*");
  if (error) throw error;
  return { docs: (data || []).map((row) => ({ id: String(row.username || row.id), data: () => fromRow(reference.collection, row) })) };
}
export async function setDoc(reference: Ref, value: Record<string, unknown>, options?: { merge?: boolean }) {
  let payload = value;
  if (options?.merge) {
    const existing = await getDoc(reference);
    payload = { ...(existing.exists() ? existing.data() : {}), ...value };
  }
  const { error } = await supabase.from(tableForRef(reference)).upsert(toRow(reference, payload));
  if (error) throw error;
}
export async function deleteDoc(reference: Ref) {
  const { error } = await supabase.from(tableForRef(reference)).delete().eq(keyForRef(reference), idForRef(reference));
  if (error) throw error;
}
export function onSnapshot(reference: Ref | CollectionRef, success: (value: { data: () => Record<string, unknown> | undefined; docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void, failure?: () => void) {
  const load = async () => { try {
    if ("id" in reference) { const value = await getDoc(reference); success({ data: value.data, docs: [] }); }
    else { const value = await getDocs(reference); success({ data: () => undefined, docs: value.docs }); }
  } catch { failure?.(); } };
  void load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer);
}
