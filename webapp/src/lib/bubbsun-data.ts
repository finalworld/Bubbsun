import {
  collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp,
  setDoc, updateDoc, where, limit, writeBatch, type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { Account, BubbsunList, GlobalPin, Group, ListItem, Membership, Report, ThemePalette } from "../types";

const numberValue = (value: unknown, fallback = 0) => typeof value === "number" ? value : fallback;
const textValue = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;

export async function ensureAccount(user: User) {
  const ref = doc(db, "users", user.uid);
  const current = await getDoc(ref);
  const data = current.data() ?? {};
  await setDoc(ref, {
    uid: user.uid,
    displayName: textValue(data.displayName, textValue(data.name, user.displayName || "Bubbsun")).slice(0, 35),
    activeGroupId: textValue(data.activeGroupId, textValue(data.groupId)),
    schemaVersion: 600,
    lastActiveAt: serverTimestamp(),
    ...(!current.exists() ? { createdAt: serverTimestamp() } : {}),
  }, { merge: true });
}

export function watchAccount(uid: string, callback: (account: Account | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), snap => {
    if (!snap.exists()) return callback(null);
    const d = snap.data();
    callback({
      uid, displayName: textValue(d.displayName, textValue(d.name, "Bubbsun")),
      activeGroupId: textValue(d.activeGroupId, textValue(d.groupId)),
      globalTitle: textValue(d.globalTitle), titleColor: numberValue(d.titleColor),
      supporter: d.supporter === true, supporterTitle: textValue(d.supporterTitle, "lifetime"), supporterGlow: d.supporterGlow !== false, personalColor: numberValue(d.personalColor, 0xff2b7a78), megaSuperBoss: d.megaSuperBoss === true,
      founder: d.founder === true, suspended: d.suspended === true, hiddenGlobalPinRevision: numberValue(d.hiddenGlobalPinRevision), privacyVersion: numberValue(d.privacyVersion),
    });
  });
}

export function watchMemberships(uid: string, callback: (items: Membership[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "users", uid, "memberships"), snap => callback(snap.docs.map(item => {
    const d = item.data();
    return { groupId: item.id, uid, displayName: textValue(d.displayName), color: numberValue(d.color), role: textValue(d.role, "member"), order: numberValue(d.order) };
  }).sort((a, b) => a.order - b.order)));
}

export function watchGroup(id: string, callback: (group: Group | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "groups", id), snap => {
    if (!snap.exists()) return callback(null);
    const d = snap.data();
    callback({ id, name: textValue(d.name, "Bubbsun"), iconId: textValue(d.iconId, textValue(d.icon, "⌂")), color: numberValue(d.color, numberValue(d.groupColor, 0xff7d936c)), ownerId: textValue(d.ownerId), joinCode: textValue(d.joinCode) });
  });
}

export function watchGroupMembers(groupId: string, callback: (members: Membership[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "groups", groupId, "members"), snap => callback(snap.docs.map(item => {
    const d = item.data();
    return { groupId, uid: item.id, displayName: textValue(d.displayName, textValue(d.name)), color: numberValue(d.color), role: textValue(d.role, "member"), order: numberValue(d.order) };
  }).sort((a, b) => a.order - b.order)));
}

const parseItem = (raw: unknown): ListItem => {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { id: textValue(d.id, crypto.randomUUID()), name: textValue(d.name), quantity: textValue(d.quantity), ownerId: textValue(d.ownerId), completed: d.completed === true, createdAt: numberValue(d.createdAt, Date.now()), completedAt: typeof d.completedAt === "number" ? d.completedAt : null, likedBy: Array.isArray(d.likedBy) ? d.likedBy.filter((x): x is string => typeof x === "string") : [] };
};

export function watchLists(groupId: string, callback: (lists: BubbsunList[]) => void): Unsubscribe {
  const listQuery = query(collection(db, "groups", groupId, "lists"), orderBy("order", "asc"));
  return onSnapshot(listQuery, snap => callback(snap.docs.map((item, index) => {
    const d = item.data();
    return { id: item.id, name: textValue(d.name, "Lista"), icon: textValue(d.icon, "list_cart"), iconColor: (d.iconColor as number | string | undefined) ?? 0xff2b7a78, creatorId: textValue(d.creatorId), sortMode: textValue(d.sortMode, "custom"), doneFirst: d.doneFirst === true, doneExpanded: d.doneExpanded === true, order: numberValue(d.order, index), items: Array.isArray(d.items) ? d.items.map(parseItem) : [] };
  })));
}

export async function switchGroup(uid: string, groupId: string) {
  await setDoc(doc(db, "users", uid), { activeGroupId: groupId, lastActiveAt: serverTimestamp() }, { merge: true });
}

export async function saveList(groupId: string, list: BubbsunList, actorId: string) {
  await setDoc(doc(db, "groups", groupId, "lists", list.id), {
    name: list.name.slice(0, 60), icon: list.icon, iconColor: list.iconColor,
    creatorId: list.creatorId || actorId, sortMode: list.sortMode, doneFirst: list.doneFirst,
    doneExpanded: list.doneExpanded, order: list.order, items: list.items,
    updatedBy: actorId, updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function createList(groupId: string, name: string, actorId: string, order: number) {
  const ref = doc(collection(db, "groups", groupId, "lists"));
  const list: BubbsunList = { id: ref.id, name: name.trim().slice(0, 60), icon: "list_cart", iconColor: 0xff2b7a78, creatorId: actorId, sortMode: "custom", doneFirst: false, doneExpanded: false, order, items: [] };
  await saveList(groupId, list, actorId);
  return list;
}

export async function removeList(groupId: string, listId: string) {
  await deleteDoc(doc(db, "groups", groupId, "lists", listId));
}

export async function updateProfile(uid: string, name: string) {
  await updateDoc(doc(db, "users", uid), { displayName: name.trim().slice(0, 35), lastActiveAt: serverTimestamp() });
}

export async function updateGroup(groupId: string, values: Partial<Pick<Group,"name"|"iconId"|"color">>) {
  await setDoc(doc(db,"groups",groupId),{...values,updatedAt:serverTimestamp()},{merge:true});
}

export async function updateMembership(groupId:string, uid:string, values:Partial<Pick<Membership,"displayName"|"color"|"role">>) {
  const batch=writeBatch(db); batch.set(doc(db,"groups",groupId,"members",uid),values,{merge:true}); batch.set(doc(db,"users",uid,"memberships",groupId),values,{merge:true}); await batch.commit();
}

export function watchAllAccounts(callback:(items:Account[])=>void):Unsubscribe { return onSnapshot(collection(db,"users"),snap=>callback(snap.docs.map(item=>{const d=item.data();return {uid:item.id,displayName:textValue(d.displayName,textValue(d.name,"Bubbsun")),activeGroupId:textValue(d.activeGroupId),globalTitle:textValue(d.globalTitle),titleColor:numberValue(d.titleColor),supporter:d.supporter===true,supporterTitle:textValue(d.supporterTitle,"lifetime"),supporterGlow:d.supporterGlow!==false,personalColor:numberValue(d.personalColor,0xff2b7a78),megaSuperBoss:d.megaSuperBoss===true,founder:d.founder===true,suspended:d.suspended===true,hiddenGlobalPinRevision:numberValue(d.hiddenGlobalPinRevision),privacyVersion:numberValue(d.privacyVersion)};}))); }
export function watchReports(callback:(items:Report[])=>void):Unsubscribe { return onSnapshot(query(collection(db,"reports"),orderBy("createdAt","desc"),limit(100)),snap=>callback(snap.docs.map(item=>{const d=item.data();return{id:item.id,authorUid:textValue(d.authorUid),kind:textValue(d.kind),category:textValue(d.category),title:textValue(d.title),description:textValue(d.description),status:textValue(d.status,"new"),createdAt:d.createdAt};}))); }
export async function updateAccountAdmin(uid:string, values:Record<string,unknown>){await setDoc(doc(db,"users",uid),{...values,lastActiveAt:serverTimestamp()},{merge:true});}
export async function removeReport(id:string){await deleteDoc(doc(db,"reports",id));}
export function watchThemePalettes(callback:(items:Record<string,ThemePalette>)=>void):Unsubscribe{return onSnapshot(collection(db,"themePalettes"),snap=>callback(Object.fromEntries(snap.docs.map(item=>[item.id,{id:item.id,...item.data()} as ThemePalette]))));}
export async function saveThemePalette(theme:ThemePalette){await setDoc(doc(db,"themePalettes",theme.id),theme,{merge:true});}

export async function acceptPrivacy(uid: string) {
  await setDoc(doc(db, "users", uid), { privacyVersion: 1, privacyAcceptedAt: serverTimestamp(), lastActiveAt: serverTimestamp() }, { merge: true });
}

export async function savePreferences(uid: string, values: Record<string, unknown>) {
  await setDoc(doc(db, "users", uid), { ...values, lastActiveAt: serverTimestamp() }, { merge: true });
}

export async function createGroup(account: Account, name: string, iconId: string, color: number, memberColor: number) {
  const groupRef = doc(collection(db, "groups"));
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const raw = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  const member = { groupId: groupRef.id, uid: account.uid, displayName: account.displayName, color: memberColor, role: "superboss", order: 0, joinedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(groupRef, { name: name.trim().slice(0, 40), iconId, color, ownerId: account.uid, joinCode: code, memberCount: 1, listCount: 0, listLimit: 100, frozen: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(doc(db, "groups", groupRef.id, "members", account.uid), member);
  batch.set(doc(db, "users", account.uid, "memberships", groupRef.id), member);
  batch.set(doc(db, "groupCodes", code), { groupId: groupRef.id, ownerId: account.uid });
  batch.set(doc(db, "users", account.uid), { activeGroupId: groupRef.id, lastActiveAt: serverTimestamp() }, { merge: true });
  await batch.commit(); return groupRef.id;
}

export async function requestToJoin(account: Account, code: string) {
  const normalized = code.trim().toUpperCase(); const lookup = await getDoc(doc(db, "groupCodes", normalized));
  if (!lookup.exists()) throw new Error("Gruppkoden finns inte."); const groupId = textValue(lookup.data().groupId);
  const request = { groupId, uid: account.uid, displayName: account.displayName, requestedColor: 0, status: "pending", createdAt: serverTimestamp() };
  const batch = writeBatch(db); batch.set(doc(db, "groups", groupId, "joinRequests", account.uid), request); batch.set(doc(db, "users", account.uid, "joinRequests", groupId), request); await batch.commit();
}

export function watchGlobalPin(callback: (pin: GlobalPin | null) => void): Unsubscribe {
  let itemUnsub: Unsubscribe | undefined;
  const pinUnsub = onSnapshot(query(collection(db, "globalPins"), where("status", "==", "published"), limit(1)), snap => {
    itemUnsub?.(); const pinDoc = snap.docs[0]; if (!pinDoc) { callback(null); return; } const d = pinDoc.data();
    itemUnsub = onSnapshot(query(collection(db, "globalPins", pinDoc.id, "items"), orderBy("order")), items => callback({ id: pinDoc.id, title: textValue(d.title), infoText: textValue(d.infoText), status: textValue(d.status), revision: numberValue(d.revision), createdAt: d.createdAt, items: items.docs.map((entry, index) => { const value = entry.data(); return { id: entry.id, name: textValue(value.name), quantity: textValue(value.quantity), order: numberValue(value.order, index), reactionCount: numberValue(value.reactionCount) }; }) }));
  });
  return () => { itemUnsub?.(); pinUnsub(); };
}

export async function hideGlobalPin(uid: string, revision: number) { await savePreferences(uid, { hiddenGlobalPinRevision: revision }); }

export async function createReport(uid: string, kind: "problem" | "suggestion", category: string, title: string, description: string, language: string, theme: string) {
  const ref = doc(collection(db, "reports")); await setDoc(ref, { id: ref.id, authorUid: uid, kind, category: category.slice(0, 40), title: title.trim().slice(0, 80), description: description.trim().slice(0, 2000), status: "new", priority: "normal", language, theme, appVersion: "Webb", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return ref.id;
}
export async function saveGlobalPin(pin:{title:string;infoText:string;items:Array<{name:string;quantity:string}>;published:boolean;revision:number}){const ref=doc(db,"globalPins","current"),existing=await getDocs(collection(ref,"items")),batch=writeBatch(db);existing.docs.forEach(item=>batch.delete(item.ref));batch.set(ref,{title:pin.title.slice(0,80),infoText:pin.infoText.slice(0,240),status:pin.published?"published":"draft",revision:pin.revision,updatedAt:serverTimestamp(),createdAt:serverTimestamp()},{merge:true});pin.items.forEach((item,index)=>{const itemRef=doc(collection(ref,"items"));batch.set(itemRef,{name:item.name.slice(0,80),quantity:item.quantity.slice(0,40),order:index,reactionCount:0})});await batch.commit();}
