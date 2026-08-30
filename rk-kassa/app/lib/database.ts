type Ref = { collection: string; id: string };
type CollectionRef = { collection: string };
type ApiDoc = { id: string; data: Record<string, unknown> };

export const database = {};
export const doc = (_db: unknown, collectionName: string, id: string): Ref => ({ collection: collectionName, id });
export const collection = (_db: unknown, collectionName: string): CollectionRef => ({ collection: collectionName });
export const kassaStateRef = doc(database, "rk-kassa", "shared-state");
export const categoryStateRef = doc(database, "rk-kassa", "categories");
export const cashierStateRef = doc(database, "rk-kassa", "cashiers");
export const salesCollectionRef = collection(database, "kassa-sales");

const endpoint = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/`;
const request = async <T>(payload: Record<string, unknown>) => {
  const response = await fetch(endpoint, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({})) as T & { ok?: boolean; error?: string };
  if (!response.ok || data.ok === false) throw new Error(data.error || "Databasen svarar inte.");
  return data;
};
export async function login(username: string, passwordHash: string) { return request<{ user: { id: string; username: string; role: "admin" | "cashier" } }>({ action: "login", username, passwordHash }); }
export async function logout() { await request({ action: "logout" }); }
export async function getDoc(reference: Ref) { const data = await request<{ data: Record<string, unknown> | null }>({ action: "doc", collection: reference.collection, id: reference.id }); return { id: reference.id, exists: () => Boolean(data.data), data: () => data.data || undefined }; }
export async function getDocs(reference: CollectionRef) { const data = await request<{ docs: ApiDoc[] }>({ action: "docs", collection: reference.collection }); return { docs: (data.docs || []).map((item) => ({ id: item.id, data: () => item.data })) }; }
export async function setDoc(reference: Ref, value: Record<string, unknown>, options?: { merge?: boolean }) { await request({ action: "set", collection: reference.collection, id: reference.id, value, merge: Boolean(options?.merge) }); }
export async function deleteDoc(reference: Ref) { await request({ action: "delete", collection: reference.collection, id: reference.id }); }

// En enda surfplatta använder kassan: läs vid start, aldrig genom kontinuerlig polling.
export function onSnapshot(reference: Ref | CollectionRef, success: (value: { data: () => Record<string, unknown> | undefined; docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void, failure?: () => void) {
  void (async () => { try { if ("id" in reference) { const value = await getDoc(reference); success({ data: value.data, docs: [] }); } else { const value = await getDocs(reference); success({ data: () => undefined, docs: value.docs }); } } catch { failure?.(); } })();
  return () => undefined;
}
