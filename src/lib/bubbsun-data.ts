import {
  collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp,
  setDoc, updateDoc, where, limit, writeBatch, type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { Account, BubbsunList, BubbsunNote, GlobalPin, Group, JoinRequest, ListItem, Membership, PublicListShare, Report, ThemePalette } from "../types";

const numberValue = (value: unknown, fallback = 0) => typeof value === "number" ? value : fallback;
const textValue = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;

export async function ensureAccount(user: User) {
  const ref = doc(db, "users", user.uid);
  const current = await getDoc(ref);
  const data = current.data() ?? {};
  const invitedBy = new URLSearchParams(window.location.search).get("invite");
  await setDoc(ref, {
    uid: user.uid,
    displayName: textValue(data.displayName, textValue(data.name, user.displayName || "Bubbsun")).slice(0, 35),
    activeGroupId: textValue(data.activeGroupId, textValue(data.groupId)),
    schemaVersion: 600,
    lastActiveAt: serverTimestamp(),
    ...(!current.exists() ? { createdAt: serverTimestamp(), ...(invitedBy && invitedBy !== user.uid ? { invitedBy } : {}) } : {}),
  }, { merge: true });
}

let lastPresenceTouch = 0;
export async function touchPresence(uid: string) {
  const now = Date.now();
  if (now - lastPresenceTouch < 120000) return;
  lastPresenceTouch = now;
  await setDoc(doc(db, "presence", uid), { uid, lastSeenAt: serverTimestamp() }, { merge: true });
}

export function watchOnlineCount(callback: (count: number) => void): Unsubscribe {
  let seen: number[] = [];
  const emit = () => callback(seen.filter(value => value >= Date.now() - 5 * 60 * 1000).length);
  const unsubscribe = onSnapshot(collection(db, "presence"), snapshot => {
    seen = snapshot.docs.map(item => {
      const value = item.data().lastSeenAt as { toMillis?: () => number } | undefined;
      return value?.toMillis?.() ?? 0;
    });
    emit();
  });
  const timer = window.setInterval(emit, 30000);
  return () => { window.clearInterval(timer); unsubscribe(); };
}

/** Active during the last five minutes. Kept separate from the count so the
 * admin can see exactly who is currently around without exposing it to users. */
export function watchOnlineUserIds(callback: (ids: Set<string>) => void): Unsubscribe {
  let seen: Array<{ uid: string; lastSeenAt: number }> = [];
  const emit = () =>
    callback(
      new Set(
        seen
          .filter((entry) => entry.lastSeenAt >= Date.now() - 5 * 60 * 1000)
          .map((entry) => entry.uid),
      ),
    );
  const unsubscribe = onSnapshot(collection(db, "presence"), (snapshot) => {
    seen = snapshot.docs.map((item) => {
      const value = item.data().lastSeenAt as { toMillis?: () => number } | undefined;
      return { uid: item.id, lastSeenAt: value?.toMillis?.() ?? 0 };
    });
    emit();
  });
  const timer = window.setInterval(emit, 30000);
  return () => { window.clearInterval(timer); unsubscribe(); };
}

export function watchAccount(uid: string, callback: (account: Account | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), snap => {
    if (!snap.exists()) return callback(null);
    const d = snap.data();
    callback({
      uid, displayName: textValue(d.displayName, textValue(d.name, "Bubbsun")),
      activeGroupId: textValue(d.activeGroupId, textValue(d.groupId)),
      globalTitle: textValue(d.globalTitle), titleColor: numberValue(d.titleColor),
      supporter: d.supporter === true, supporterTitle: textValue(d.supporterTitle, "lifetime"), supporterGlow: d.supporterGlow !== false, supporterGlowColor: textValue(d.supporterGlowColor, "#ffb532"), personalColor: numberValue(d.personalColor, 0xff2b7a78), megaSuperBoss: d.megaSuperBoss === true,
      founder: d.founder === true, suspended: d.suspended === true, hiddenGlobalPinRevision: numberValue(d.hiddenGlobalPinRevision), hiddenGlobalPinId:textValue(d.hiddenGlobalPinId), privacyVersion: numberValue(d.privacyVersion),
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
  return { id: textValue(d.id, crypto.randomUUID()), name: textValue(d.name), quantity: textValue(d.quantity), note: textValue(d.note), assignedTo:textValue(d.assignedTo),assigneeId:textValue(d.assigneeId),assigneeName:textValue(d.assigneeName),status:textValue(d.status),priority:textValue(d.priority),room:textValue(d.room),recurrence:textValue(d.recurrence),dueDate:textValue(d.dueDate),taskType:textValue(d.taskType), ownerId: textValue(d.ownerId), completed: d.completed === true, createdAt: numberValue(d.createdAt, 0), completedAt: typeof d.completedAt === "number" ? d.completedAt : null, likedBy: Array.isArray(d.likedBy) ? d.likedBy.filter((x): x is string => typeof x === "string") : [] };
};

export function watchLists(groupId: string, callback: (lists: BubbsunList[]) => void): Unsubscribe {
  const listQuery = query(collection(db, "groups", groupId, "lists"), orderBy("order", "asc"));
  return onSnapshot(listQuery, snap => callback(snap.docs.map((item, index) => {
    const d = item.data();
    return { id: item.id, name: textValue(d.name, "Lista"), icon: textValue(d.icon, "list_cart"), iconColor: (d.iconColor as number | string | undefined) ?? 0xff2b7a78, listType:textValue(d.listType,"other"),packPeople:Array.isArray(d.packPeople)?d.packPeople.filter((x):x is string=>typeof x==="string"):[], creatorId: textValue(d.creatorId), sortMode: textValue(d.sortMode, "custom"), doneFirst: d.doneFirst === true, doneExpanded: d.doneExpanded === true, order: numberValue(d.order, index), updatedBy:textValue(d.updatedBy), updatedAt:numberValue((d.updatedAt as {toMillis?:()=>number})?.toMillis?.()), revision:numberValue(d.revision), items: Array.isArray(d.items) ? d.items.map(parseItem) : [] };
  })));
}

const parseListDocument = (item:{id:string;data:()=>Record<string,unknown>}, index:number):BubbsunList => {
  const d=item.data();
  return { id:item.id,name:textValue(d.name,"Lista"),icon:textValue(d.icon,"list_cart"),iconColor:(d.iconColor as number|string|undefined)??0xff2b7a78,listType:textValue(d.listType,"other"),packPeople:Array.isArray(d.packPeople)?d.packPeople.filter((x):x is string=>typeof x==="string"):[],creatorId:textValue(d.creatorId),sortMode:textValue(d.sortMode,"custom"),doneFirst:d.doneFirst===true,doneExpanded:d.doneExpanded===true,order:numberValue(d.order,index),pinned:d.pinned===true,items:Array.isArray(d.items)?d.items.map(parseItem):[] };
};

export function watchPrivateLists(uid:string,callback:(lists:BubbsunList[])=>void):Unsubscribe {
  return onSnapshot(query(collection(db,"users",uid,"privateLists"),orderBy("order","asc")),snap=>callback(snap.docs.map((item,index)=>parseListDocument(item,index))));
}

export function watchAllLists(callback:(lists:BubbsunList[])=>void, onError?:(error:Error)=>void):Unsubscribe {
  return onSnapshot(collectionGroup(db,"lists"),snap=>callback(snap.docs.map((item,index)=>parseListDocument(item,index))),error=>onError?.(error));
}

export function watchAllPrivateLists(callback:(lists:BubbsunList[])=>void, onError?:(error:Error)=>void):Unsubscribe {
  return onSnapshot(collectionGroup(db,"privateLists"),snap=>callback(snap.docs.map((item,index)=>parseListDocument(item,index))),error=>onError?.(error));
}

const listItemsForStorage = (items: BubbsunList["items"]) => items.map(item => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  ownerId: item.ownerId,
  completed: item.completed,
  createdAt: item.createdAt,
  completedAt: item.completedAt,
  likedBy: item.likedBy,
  ...(item.note ? { note: item.note } : {}),
  ...(item.assignedTo ? { assignedTo: item.assignedTo } : {}),
  ...(item.assigneeId ? { assigneeId: item.assigneeId } : {}),
  ...(item.assigneeName ? { assigneeName: item.assigneeName } : {}),
  ...(item.status ? { status: item.status } : {}),
  ...(item.priority ? { priority: item.priority } : {}),
  ...(item.room ? { room: item.room } : {}),
  ...(item.recurrence ? { recurrence: item.recurrence } : {}),
  ...(item.dueDate ? { dueDate: item.dueDate } : {}),
  ...(item.taskType ? { taskType: item.taskType } : {}),
}));

export async function savePrivateList(uid:string,list:BubbsunList) {
  await setDoc(doc(db,"users",uid,"privateLists",list.id),{name:list.name.slice(0,60),icon:list.icon,iconColor:list.iconColor,listType:list.listType||"other",packPeople:list.packPeople||[],creatorId:uid,sortMode:list.sortMode,doneFirst:list.doneFirst,doneExpanded:list.doneExpanded,order:list.order,pinned:list.pinned===true,items:listItemsForStorage(list.items),updatedAt:serverTimestamp()},{merge:true});
}

export async function removePrivateList(uid:string,listId:string) { await deleteDoc(doc(db,"users",uid,"privateLists",listId)); }

export async function migratePrivateLists(uid:string,lists:BubbsunList[]) {
  if(!lists.length)return;
  const existing=await getDocs(collection(db,"users",uid,"privateLists"));
  const existingIds=new Set(existing.docs.map(item=>item.id));
  await Promise.all(lists.filter(list=>!existingIds.has(list.id)).map(list=>savePrivateList(uid,list)));
}

export async function switchGroup(uid: string, groupId: string) {
  await setDoc(doc(db, "users", uid), { activeGroupId: groupId, lastActiveAt: serverTimestamp() }, { merge: true });
}

export async function saveList(groupId: string, list: BubbsunList, actorId: string) {
  const ref=doc(db,"groups",groupId,"lists",list.id);
  await setDoc(ref,{name:list.name.slice(0,60),icon:list.icon,iconColor:list.iconColor,listType:list.listType||"other",packPeople:list.packPeople||[],creatorId:list.creatorId||actorId,sortMode:list.sortMode,doneFirst:list.doneFirst,doneExpanded:list.doneExpanded,order:list.order,items:listItemsForStorage(list.items),revision:increment(1),updatedBy:actorId,updatedAt:serverTimestamp()},{merge:true});
  return (list.revision||0)+1;
}

export async function createList(groupId: string, name: string, actorId: string, order: number, listType = "other") {
  const ref = doc(collection(db, "groups", groupId, "lists"));
  const list: BubbsunList = { id: ref.id, name: name.trim().slice(0, 60), icon: "list_cart", iconColor: 0xff2b7a78, listType, creatorId: actorId, sortMode: "custom", doneFirst: false, doneExpanded: false, order, items: [] };
  await saveList(groupId, list, actorId);
  return list;
}

export async function removeList(groupId: string, listId: string) {
  await deleteDoc(doc(db, "groups", groupId, "lists", listId));
}

const parseNote=(item:{id:string;data:()=>Record<string,unknown>},index:number):BubbsunNote=>{const d=item.data(),history=Array.isArray(d.history)?d.history.map(raw=>{const x=(raw&&typeof raw==="object"?raw:{}) as Record<string,unknown>;return{uid:textValue(x.uid),name:textValue(x.name,"Bubbsun"),at:numberValue(x.at)}}).filter(value=>value.at):[];return{id:item.id,title:textValue(d.title,"Namnlös anteckning"),text:textValue(d.text),icon:textValue(d.icon,"idea"),color:numberValue(d.color,0xff2b7a78),order:numberValue(d.order,index),creatorId:textValue(d.creatorId),creatorName:textValue(d.creatorName),creatorColor:typeof d.creatorColor==="number"?d.creatorColor:undefined,history,createdAt:numberValue((d.createdAt as {toMillis?:()=>number})?.toMillis?.()),updatedAt:numberValue((d.updatedAt as {toMillis?:()=>number})?.toMillis?.())};};
export function watchNotes(groupId:string,callback:(notes:BubbsunNote[])=>void):Unsubscribe{return onSnapshot(query(collection(db,"groups",groupId,"notes"),orderBy("order","asc")),snap=>callback(snap.docs.map(parseNote)));}
export function watchPrivateNotes(uid:string,callback:(notes:BubbsunNote[])=>void):Unsubscribe{return onSnapshot(query(collection(db,"users",uid,"privateNotes"),orderBy("order","asc")),snap=>callback(snap.docs.map(parseNote)));}
function notePayload(note:BubbsunNote){
  const {createdAt:_createdAt,updatedAt:_updatedAt,...values}=note;
  return {...values,title:note.title.slice(0,80),text:note.text.slice(0,20000),updatedAt:serverTimestamp(),createdAt:note.createdAt||serverTimestamp()};
}
export async function saveNote(groupId:string,note:BubbsunNote){await setDoc(doc(db,"groups",groupId,"notes",note.id),notePayload(note),{merge:true});}
export async function savePrivateNote(uid:string,note:BubbsunNote){await setDoc(doc(db,"users",uid,"privateNotes",note.id),notePayload(note),{merge:true});}
export async function removeNote(groupId:string,id:string){await deleteDoc(doc(db,"groups",groupId,"notes",id));}
export async function removePrivateNote(uid:string,id:string){await deleteDoc(doc(db,"users",uid,"privateNotes",id));}

export async function createPublicListShare(list:BubbsunList, creatorId:string, showNotes=false) {
  const id=crypto.randomUUID().replace(/-/g,"").slice(0,10);
  await setDoc(doc(db,"publicListShares",id),{
    name:list.name.slice(0,60),creatorId,createdAt:serverTimestamp(),
    showNotes,items:list.items.map(item=>({name:item.name.slice(0,120),quantity:item.quantity.slice(0,60),completed:item.completed,...(showNotes&&item.note?{note:item.note.slice(0,500)}:{})})),
  });
  return id;
}

export async function getPublicListShare(id:string):Promise<PublicListShare|null> {
  const snap=await getDoc(doc(db,"publicListShares",id));
  if(!snap.exists())return null;
  const data=snap.data();
  return {id:snap.id,name:textValue(data.name,"Delad lista"),createdAt:data.createdAt,showNotes:data.showNotes===true,items:Array.isArray(data.items)?data.items.map(raw=>{
    const item=(raw&&typeof raw==="object"?raw:{}) as Record<string,unknown>;
    return {name:textValue(item.name),quantity:textValue(item.quantity),completed:item.completed===true,note:textValue(item.note)};
  }):[]};
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

export async function transferGroupOwnership(groupId:string, currentOwnerId:string, nextOwnerId:string) {
  const batch=writeBatch(db);
  batch.set(doc(db,"groups",groupId),{ownerId:nextOwnerId,updatedAt:serverTimestamp()},{merge:true});
  batch.set(doc(db,"groups",groupId,"members",currentOwnerId),{role:"boss"},{merge:true});
  batch.set(doc(db,"users",currentOwnerId,"memberships",groupId),{role:"boss"},{merge:true});
  batch.set(doc(db,"groups",groupId,"members",nextOwnerId),{role:"owner"},{merge:true});
  batch.set(doc(db,"users",nextOwnerId,"memberships",groupId),{role:"owner"},{merge:true});
  await batch.commit();
}

export function watchAllAccounts(callback:(items:Account[])=>void):Unsubscribe { return onSnapshot(collection(db,"users"),snap=>callback(snap.docs.map(item=>{const d=item.data();return {uid:item.id,displayName:textValue(d.displayName,textValue(d.name,"Bubbsun")),activeGroupId:textValue(d.activeGroupId),globalTitle:textValue(d.globalTitle),titleColor:numberValue(d.titleColor),supporter:d.supporter===true,supporterTitle:textValue(d.supporterTitle,"lifetime"),supporterGlow:d.supporterGlow!==false,supporterGlowColor:textValue(d.supporterGlowColor,"#ffb532"),personalColor:numberValue(d.personalColor,0xff2b7a78),megaSuperBoss:d.megaSuperBoss===true,founder:d.founder===true,suspended:d.suspended===true,hiddenGlobalPinRevision:numberValue(d.hiddenGlobalPinRevision),hiddenGlobalPinId:textValue(d.hiddenGlobalPinId),privacyVersion:numberValue(d.privacyVersion)};}))); }
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

export function watchJoinRequests(groupId:string,callback:(items:JoinRequest[])=>void):Unsubscribe {
  return onSnapshot(collection(db,"groups",groupId,"joinRequests"),snap=>callback(snap.docs.map(item=>{const d=item.data();return{groupId,uid:item.id,displayName:textValue(d.displayName,"Bubbsun-medlem"),status:textValue(d.status,"pending"),requestedColor:numberValue(d.requestedColor)}}).filter(item=>item.status==="pending")));
}

export async function decideJoinRequest(groupId:string,request:JoinRequest,approve:boolean,color:number) {
  const batch=writeBatch(db),groupRequest=doc(db,"groups",groupId,"joinRequests",request.uid),userRequest=doc(db,"users",request.uid,"joinRequests",groupId);
  if(approve){const member={groupId,uid:request.uid,displayName:request.displayName,color,role:"member",order:Date.now(),joinedAt:serverTimestamp()};batch.set(doc(db,"groups",groupId,"members",request.uid),member);batch.set(doc(db,"users",request.uid,"memberships",groupId),member);batch.set(doc(db,"users",request.uid),{activeGroupId:groupId,lastActiveAt:serverTimestamp()},{merge:true});batch.set(doc(db,"groups",groupId),{memberCount:increment(1),updatedAt:serverTimestamp()},{merge:true});}
  batch.delete(groupRequest);batch.delete(userRequest);await batch.commit();
}

export async function leaveGroup(uid:string,groupId:string,nextGroupId="") {
  const batch=writeBatch(db);batch.delete(doc(db,"groups",groupId,"members",uid));batch.delete(doc(db,"users",uid,"memberships",groupId));batch.set(doc(db,"users",uid),{activeGroupId:nextGroupId,lastActiveAt:serverTimestamp()},{merge:true});await batch.commit();
}

export async function removeGroupMember(groupId:string,uid:string) { await leaveGroup(uid,groupId,""); }

export function watchFollowedLists(uid:string,callback:(ids:Set<string>)=>void):Unsubscribe {
  return onSnapshot(collection(db,"users",uid,"notificationPreferences"),snap=>callback(new Set(snap.docs.filter(item=>item.data().following===true).map(item=>item.id))));
}

export function watchListReadStates(uid:string,callback:(states:Map<string,number>)=>void):Unsubscribe {
  return onSnapshot(collection(db,"users",uid,"listReadStates"),snap=>callback(new Map(snap.docs.map(item=>[item.id,numberValue(item.data().lastSeenAt)]))));
}

export async function markListSeen(uid:string,groupId:string,listId:string,seenAt=Date.now()) {
  await setDoc(doc(db,"users",uid,"listReadStates",`${groupId}_${listId}`),{groupId,listId,lastSeenAt:seenAt,updatedAt:serverTimestamp()},{merge:true});
}

export function watchAllFollowedLists(uids:string[],callback:(count:number)=>void, onError?:(error:Error)=>void):Unsubscribe {
  if(!uids.length){callback(0);return()=>{};}
  const counts=new Map<string,number>();
  const emit=()=>callback([...counts.values()].reduce((sum,count)=>sum+count,0));
  const unsubs=uids.map(uid=>onSnapshot(collection(db,"users",uid,"notificationPreferences"),snap=>{
    counts.set(uid,snap.docs.filter(item=>item.data().following===true).length);
    emit();
  },error=>onError?.(error)));
  return()=>unsubs.forEach(unsub=>unsub());
}

export async function setListFollowing(uid:string,groupId:string,listId:string,following:boolean) {
  const ref=doc(db,"users",uid,"notificationPreferences",`${groupId}_${listId}`);
  if(following)await setDoc(ref,{groupId,listId,following:true,updatedAt:serverTimestamp()},{merge:true});else await deleteDoc(ref);
}

export function watchFollowedNotes(uid:string,callback:(ids:Set<string>)=>void):Unsubscribe {
  return onSnapshot(collection(db,"users",uid,"notificationPreferences"),snap=>callback(new Set(snap.docs.filter(item=>item.data().following===true&&item.data().kind==="note").map(item=>textValue(item.data().noteId)))));
}

export async function setNoteFollowing(uid:string,groupId:string,noteId:string,following:boolean) {
  const ref=doc(db,"users",uid,"notificationPreferences",`note_${groupId}_${noteId}`);
  if(following)await setDoc(ref,{kind:"note",groupId,noteId,following:true,updatedAt:serverTimestamp()},{merge:true});else await deleteDoc(ref);
}

export function watchGlobalPin(callback: (pin: GlobalPin | null) => void): Unsubscribe {
  let itemUnsub: Unsubscribe | undefined;
  const pinUnsub = onSnapshot(query(collection(db, "globalPins"), where("status", "==", "published"), limit(1)), snap => {
    itemUnsub?.(); const pinDoc = snap.docs[0]; if (!pinDoc) { callback(null); return; } const d = pinDoc.data();
    itemUnsub = onSnapshot(query(collection(db, "globalPins", pinDoc.id, "items"), orderBy("order")), items => callback({ id: pinDoc.id, title: textValue(d.title), infoText: textValue(d.infoText), status: textValue(d.status), revision: numberValue(d.revision), createdAt: d.createdAt, updatedAt:d.updatedAt, publishedAt:d.publishedAt, unpublishedAt:d.unpublishedAt, items: items.docs.map((entry, index) => { const value = entry.data(); return { id: entry.id, name: textValue(value.name), quantity: textValue(value.quantity), order: numberValue(value.order, index), reactionCount: numberValue(value.reactionCount) }; }) }));
  });
  return () => { itemUnsub?.(); pinUnsub(); };
}

export function watchGlobalPins(callback:(pins:GlobalPin[])=>void):Unsubscribe {
  const values=new Map<string,GlobalPin>(),itemUnsubs=new Map<string,Unsubscribe>();
  const emit=()=>callback([...values.values()].sort((a,b)=>numberValue((b.updatedAt as {seconds?:number})?.seconds)-numberValue((a.updatedAt as {seconds?:number})?.seconds)));
  const parentUnsub=onSnapshot(collection(db,"globalPins"),snap=>{
    const ids=new Set(snap.docs.map(entry=>entry.id));
    for(const[id,unsub]of itemUnsubs)if(!ids.has(id)){unsub();itemUnsubs.delete(id);values.delete(id);}
    for(const pinDoc of snap.docs){
      const d=pinDoc.data(),base={id:pinDoc.id,title:textValue(d.title),infoText:textValue(d.infoText),status:textValue(d.status,"draft"),revision:numberValue(d.revision),createdAt:d.createdAt,updatedAt:d.updatedAt,publishedAt:d.publishedAt,unpublishedAt:d.unpublishedAt,items:[]} satisfies GlobalPin;
      values.set(pinDoc.id,{...base,items:values.get(pinDoc.id)?.items||[]});
      if(!itemUnsubs.has(pinDoc.id))itemUnsubs.set(pinDoc.id,onSnapshot(query(collection(pinDoc.ref,"items"),orderBy("order")),items=>{values.set(pinDoc.id,{...base,items:items.docs.map((entry,index)=>{const value=entry.data();return{id:entry.id,name:textValue(value.name),quantity:textValue(value.quantity),order:numberValue(value.order,index),reactionCount:numberValue(value.reactionCount)}})});emit();}));
    }
    emit();
  });
  return()=>{parentUnsub();itemUnsubs.forEach(unsub=>unsub());};
}

export async function hideGlobalPin(uid:string,pinId:string,revision:number) { await savePreferences(uid,{hiddenGlobalPinId:pinId,hiddenGlobalPinRevision:revision}); }

export async function getGlobalPinReactions(pinId:string, uid:string, itemIds:string[]) {
  const states=await Promise.all(itemIds.map(async itemId=>({itemId,active:(await getDoc(doc(db,"globalPins",pinId,"items",itemId,"reactions",uid))).exists()})));
  return new Set(states.filter(item=>item.active).map(item=>item.itemId));
}

export async function toggleGlobalPinReaction(pinId:string,itemId:string,uid:string) {
  const items=await getDocs(collection(db,"globalPins",pinId,"items"));
  const reactions=await Promise.all(items.docs.map(async item=>({item,reaction:await getDoc(doc(item.ref,"reactions",uid))})));
  const current=reactions.find(entry=>entry.reaction.exists()),active=current?.item.id===itemId,batch=writeBatch(db);
  for(const entry of reactions){if(!entry.reaction.exists())continue;batch.delete(entry.reaction.ref);batch.update(entry.item.ref,{reactionCount:increment(-1)});}
  if(!active){const itemRef=doc(db,"globalPins",pinId,"items",itemId);batch.set(doc(itemRef,"reactions",uid),{uid,createdAt:serverTimestamp()});batch.update(itemRef,{reactionCount:increment(1)});}
  await batch.commit();
  return !active;
}

export async function createReport(uid: string, kind: "problem" | "suggestion", category: string, title: string, description: string, language: string, theme: string) {
  const ref = doc(collection(db, "reports")); await setDoc(ref, { id: ref.id, authorUid: uid, kind, category: category.slice(0, 40), title: title.trim().slice(0, 80), description: description.trim().slice(0, 2000), status: "new", priority: "normal", language, theme, appVersion: "Webb", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return ref.id;
}
export async function saveGlobalPin(pin:{id?:string;title:string;infoText:string;items:Array<{id?:string;name:string;quantity:string}>;published:boolean}){
  const ref=pin.id?doc(db,"globalPins",pin.id):doc(collection(db,"globalPins")),[current,existing,publishedPins]=await Promise.all([getDoc(ref),getDocs(collection(ref,"items")),pin.published?getDocs(query(collection(db,"globalPins"),where("status","==","published"))):Promise.resolve(null)]),existingById=new Map(existing.docs.map(item=>[item.id,item])),used=new Set<string>(),batch=writeBatch(db),revision=numberValue(current.data()?.revision)+(pin.published?1:0);
  publishedPins?.docs.filter(item=>item.id!==ref.id).forEach(item=>batch.set(item.ref,{status:"archived",unpublishedAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true}));
  batch.set(ref,{title:pin.title.slice(0,80),infoText:pin.infoText.slice(0,240),status:pin.published?"published":"archived",revision,updatedAt:serverTimestamp(),...(pin.published?{publishedAt:serverTimestamp(),unpublishedAt:null}:{unpublishedAt:serverTimestamp()}),...(!current.exists()?{createdAt:serverTimestamp()}:{})},{merge:true});
  pin.items.forEach((item,index)=>{const old=(item.id&&existingById.get(item.id))||existing.docs[index],itemRef=old?.ref||doc(collection(ref,"items"));used.add(itemRef.id);batch.set(itemRef,{name:item.name.slice(0,80),quantity:item.quantity.slice(0,40),order:index,...(!old?{reactionCount:0}:{})},{merge:true});});
  existing.docs.filter(item=>!used.has(item.id)).forEach(item=>batch.delete(item.ref));
  await batch.commit();return ref.id;
}
