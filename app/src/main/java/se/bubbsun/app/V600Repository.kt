package se.bubbsun.app

import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import java.util.Locale
import java.util.concurrent.TimeUnit

class V600Repository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {
    private val users get() = db.collection("users")
    private val groups get() = db.collection("groups")
    private val config get() = db.collection("appConfig").document("public")

    fun ensureAccount(user: FirebaseUser, onDone: (Result<V600Account>) -> Unit) {
        val ref = users.document(user.uid)
        db.runTransaction { tx ->
            val snapshot = tx.get(ref)
            val legacyGroup = snapshot.getString("groupId").orEmpty()
            val activeGroup = snapshot.getString("activeGroupId").orEmpty().ifBlank { legacyGroup }
            val name = snapshot.getString("displayName")
                ?: snapshot.getString("name")
                ?: user.displayName
                ?: "Bubbsun"
            val values = mutableMapOf<String, Any>(
                "uid" to user.uid,
                "displayName" to name.take(35),
                "activeGroupId" to activeGroup,
                "schemaVersion" to 600,
                "lastActiveAt" to FieldValue.serverTimestamp()
            )
            if (!snapshot.exists()) values["createdAt"] = FieldValue.serverTimestamp()
            tx.set(ref, values, SetOptions.merge())
            if (legacyGroup.isNotBlank()) {
                val oldRole = snapshot.getString("role").orEmpty()
                val normalizedRole = when (oldRole) {
                    "owner" -> GroupRole.SUPER_BOSS.wire
                    "admin" -> GroupRole.BOSS.wire
                    else -> GroupRole.MEMBER.wire
                }
                val color = snapshot.getLong("color") ?: 0xFFFFC928L
                val membership = ref.collection("memberships").document(legacyGroup)
                tx.set(membership, mapOf(
                    "groupId" to legacyGroup,
                    "uid" to user.uid,
                    "displayName" to name.take(35),
                    "color" to color,
                    "role" to normalizedRole,
                    "order" to 0,
                    "joinedAt" to FieldValue.serverTimestamp()
                ), SetOptions.merge())
            }
            V600Account(
                uid = user.uid,
                displayName = name.take(35),
                activeGroupId = activeGroup,
                globalTitle = snapshot.getString("globalTitle") ?: "",
                titleColor = snapshot.getLong("titleColor") ?: 0L,
                supporter = snapshot.getBoolean("supporter") ?: false,
                supporterSince = snapshot.getTimestamp("supporterSince"),
                supporterNoticeType = snapshot.getString("supporterNoticeType") ?: "",
                supporterNoticeRevision = snapshot.getLong("supporterNoticeRevision") ?: 0L,
                supporterNoticeSeen = snapshot.getLong("supporterNoticeSeen") ?: 0L,
                megaSuperBoss = snapshot.getBoolean("megaSuperBoss") ?: false,
                founder = snapshot.getBoolean("founder") ?: false,
                suspended = snapshot.getBoolean("suspended") ?: false,
                privacyVersion = (snapshot.getLong("privacyVersion") ?: 0L).toInt(),
                privacyAcceptedAt = snapshot.getTimestamp("privacyAcceptedAt"),
                hiddenGlobalPinRevision = snapshot.getLong("hiddenGlobalPinRevision") ?: 0L,
                createdAt = snapshot.getTimestamp("createdAt"),
                lastActiveAt = snapshot.getTimestamp("lastActiveAt")
            )
        }.addOnSuccessListener { onDone(Result.success(it)) }
            .addOnFailureListener { onDone(Result.failure(it)) }
    }

    fun listenAccount(uid: String, onChange: (V600Account?) -> Unit): ListenerRegistration =
        users.document(uid).addSnapshotListener { d, _ ->
            onChange(if (d == null || !d.exists()) null else V600Account(
                uid = d.id,
                displayName = d.getString("displayName") ?: d.getString("name") ?: "Bubbsun",
                activeGroupId = d.getString("activeGroupId") ?: d.getString("groupId") ?: "",
                globalTitle = d.getString("globalTitle") ?: "",
                titleColor = d.getLong("titleColor") ?: 0L,
                supporter = d.getBoolean("supporter") ?: false,
                supporterSince = d.getTimestamp("supporterSince"),
                supporterNoticeType = d.getString("supporterNoticeType") ?: "",
                supporterNoticeRevision = d.getLong("supporterNoticeRevision") ?: 0L,
                supporterNoticeSeen = d.getLong("supporterNoticeSeen") ?: 0L,
                megaSuperBoss = d.getBoolean("megaSuperBoss") ?: false,
                founder = d.getBoolean("founder") ?: false,
                suspended = d.getBoolean("suspended") ?: false,
                privacyVersion = (d.getLong("privacyVersion") ?: 0L).toInt(),
                privacyAcceptedAt = d.getTimestamp("privacyAcceptedAt"),
                hiddenGlobalPinRevision = d.getLong("hiddenGlobalPinRevision") ?: 0L,
                createdAt = d.getTimestamp("createdAt"),
                lastActiveAt = d.getTimestamp("lastActiveAt")
            ))
        }

    fun listenMemberships(uid: String, onChange: (List<GroupMembership>) -> Unit): ListenerRegistration =
        users.document(uid).collection("memberships").addSnapshotListener { snapshot, _ ->
            onChange(snapshot?.documents?.map { d ->
                GroupMembership(
                    groupId = d.id,
                    uid = uid,
                    displayName = d.getString("displayName") ?: "",
                    color = d.getLong("color") ?: 0L,
                    role = d.getString("role") ?: GroupRole.MEMBER.wire,
                    joinedAt = d.getTimestamp("joinedAt"),
                    order = (d.getLong("order") ?: 0L).toInt(),
                    notificationsPaused = d.getBoolean("notificationsPaused") ?: false
                )
            }?.sortedBy { it.order } ?: emptyList())
        }

    fun listenGroup(groupId: String, onChange: (GroupSummary?) -> Unit): ListenerRegistration =
        groups.document(groupId).addSnapshotListener { d, _ ->
            onChange(if (d == null || !d.exists()) null else GroupSummary(
                id = d.id,
                name = d.getString("name") ?: "",
                iconId = d.getString("iconId") ?: d.getString("icon") ?: "group_home",
                color = d.getLong("color") ?: d.getLong("groupColor") ?: 0xFF7D936CL,
                ownerId = d.getString("ownerId") ?: "",
                joinCode = d.getString("joinCode") ?: "",
                memberCount = (d.getLong("memberCount") ?: 0L).toInt(),
                listCount = (d.getLong("listCount") ?: 0L).toInt(),
                listLimit = (d.getLong("listLimit") ?: V600Limits.DEFAULT_LIST_LIMIT.toLong()).toInt(),
                frozen = d.getBoolean("frozen") ?: false,
                createdAt = d.getTimestamp("createdAt"),
                updatedAt = d.getTimestamp("updatedAt")
            ))
        }

    fun listenGroupMembers(groupId: String, onChange: (List<GroupMembership>) -> Unit): ListenerRegistration =
        groups.document(groupId).collection("members").addSnapshotListener { snapshot, _ ->
            onChange(snapshot?.documents?.map { d ->
                val normalizedRole = when (d.getString("role")) {
                    "owner" -> GroupRole.SUPER_BOSS.wire
                    "admin" -> GroupRole.BOSS.wire
                    else -> d.getString("role") ?: GroupRole.MEMBER.wire
                }
                GroupMembership(
                    groupId = groupId,
                    uid = d.id,
                    displayName = d.getString("displayName") ?: d.getString("name") ?: "",
                    color = d.getLong("color") ?: 0L,
                    role = normalizedRole,
                    joinedAt = d.getTimestamp("joinedAt"),
                    order = (d.getLong("order") ?: 0L).toInt(),
                    notificationsPaused = d.getBoolean("notificationsPaused") ?: false
                )
            }?.sortedWith(compareBy<GroupMembership> {
                when (it.parsedRole) { GroupRole.SUPER_BOSS -> 0; GroupRole.BOSS -> 1; GroupRole.MEMBER -> 2 }
            }.thenBy { it.order }.thenBy { it.displayName.lowercase(Locale.ROOT) }) ?: emptyList())
        }

    fun listenJoinRequests(groupId: String, onChange: (List<V600JoinRequest>) -> Unit): ListenerRegistration =
        groups.document(groupId).collection("joinRequests").whereEqualTo("status", "pending")
            .addSnapshotListener { snapshot, _ ->
                onChange(snapshot?.documents?.map { d -> V600JoinRequest(
                    id = d.id,
                    groupId = groupId,
                    uid = d.getString("uid") ?: d.id,
                    displayName = d.getString("displayName") ?: "",
                    requestedColor = d.getLong("requestedColor") ?: 0L,
                    status = d.getString("status") ?: "pending",
                    createdAt = d.getTimestamp("createdAt"),
                    expiresAt = d.getTimestamp("expiresAt")
                ) } ?: emptyList())
            }

    fun listenMyJoinRequests(uid: String, onChange: (List<V600JoinRequest>) -> Unit): ListenerRegistration =
        users.document(uid).collection("joinRequests").addSnapshotListener { snapshot, _ ->
            onChange(snapshot?.documents?.map { d -> V600JoinRequest(
                id = d.id,
                groupId = d.getString("groupId") ?: d.id,
                uid = d.getString("uid") ?: uid,
                displayName = d.getString("displayName") ?: "",
                requestedColor = d.getLong("requestedColor") ?: 0L,
                status = d.getString("status") ?: "pending",
                createdAt = d.getTimestamp("createdAt"),
                expiresAt = d.getTimestamp("expiresAt")
            ) } ?: emptyList())
        }

    fun switchActiveGroup(uid: String, groupId: String, onDone: (Boolean) -> Unit) {
        users.document(uid).collection("memberships").document(groupId).get()
            .addOnSuccessListener { membership ->
                if (!membership.exists()) onDone(false)
                else users.document(uid).set(mapOf(
                    "activeGroupId" to groupId,
                    "lastActiveAt" to FieldValue.serverTimestamp()
                ), SetOptions.merge()).addOnCompleteListener { onDone(it.isSuccessful) }
            }.addOnFailureListener { onDone(false) }
    }

    fun createGroup(
        account: V600Account,
        name: String,
        iconId: String,
        groupColor: Long,
        memberColor: Long,
        onDone: (Result<String>) -> Unit
    ) {
        users.document(account.uid).collection("memberships").get().addOnSuccessListener { memberships ->
            val owned = memberships.documents.count { it.getString("role") == GroupRole.SUPER_BOSS.wire }
            if (owned >= V600Limits.MAX_CREATED_GROUPS || memberships.size() >= V600Limits.MAX_MEMBERSHIPS) {
                onDone(Result.failure(IllegalStateException("group_limit")))
                return@addOnSuccessListener
            }
            createGroupWithCode(account, name, iconId, groupColor, memberColor, 0, onDone)
        }.addOnFailureListener { onDone(Result.failure(it)) }
    }

    private fun createGroupWithCode(
        account: V600Account,
        name: String,
        iconId: String,
        groupColor: Long,
        memberColor: Long,
        attempt: Int,
        onDone: (Result<String>) -> Unit
    ) {
        if (attempt >= 5) {
            onDone(Result.failure(IllegalStateException("code_generation")))
            return
        }
        val groupRef = groups.document()
        val code = generateCode()
        val codeRef = db.collection("groupCodes").document(code)
        val userRef = users.document(account.uid)
        val userMembership = userRef.collection("memberships").document(groupRef.id)
        val memberRef = groupRef.collection("members").document(account.uid)
        val colorClaim = groupRef.collection("colorClaims").document(memberColor.toString())
        db.runTransaction { tx ->
            if (tx.get(codeRef).exists()) throw IllegalStateException("code_collision")
            val groupData = mapOf(
                "name" to name.trim().take(40),
                "iconId" to iconId,
                "color" to groupColor,
                "ownerId" to account.uid,
                "joinCode" to code,
                "memberCount" to 1,
                "listCount" to 0,
                "listLimit" to V600Limits.DEFAULT_LIST_LIMIT,
                "frozen" to false,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            val memberData = mapOf(
                "groupId" to groupRef.id,
                "uid" to account.uid,
                "displayName" to account.displayName,
                "color" to memberColor,
                "role" to GroupRole.SUPER_BOSS.wire,
                "order" to 0,
                "joinedAt" to FieldValue.serverTimestamp()
            )
            tx.set(groupRef, groupData)
            tx.set(memberRef, memberData)
            tx.set(userMembership, memberData)
            tx.set(colorClaim, mapOf("uid" to account.uid, "claimedAt" to FieldValue.serverTimestamp()))
            tx.set(codeRef, mapOf("groupId" to groupRef.id, "ownerId" to account.uid))
            tx.set(userRef, mapOf("activeGroupId" to groupRef.id), SetOptions.merge())
            groupRef.id
        }.addOnSuccessListener { onDone(Result.success(it)) }
            .addOnFailureListener {
                if (it.message?.contains("code_collision") == true) createGroupWithCode(account, name, iconId, groupColor, memberColor, attempt + 1, onDone)
                else onDone(Result.failure(it))
            }
    }

    fun requestJoin(
        account: V600Account,
        code: String,
        onDone: (Result<String>) -> Unit
    ) {
        val normalized = code.trim().uppercase(Locale.ROOT)
        val userRef = users.document(account.uid)
        userRef.collection("memberships").get().addOnSuccessListener { memberships ->
            if (memberships.size() >= V600Limits.MAX_MEMBERSHIPS) {
                onDone(Result.failure(IllegalStateException("membership_limit")))
                return@addOnSuccessListener
            }
            userRef.collection("joinRequests").whereEqualTo("status", "pending").get().addOnSuccessListener { pending ->
                if (pending.size() >= V600Limits.MAX_PENDING_REQUESTS) {
                    onDone(Result.failure(IllegalStateException("request_limit")))
                    return@addOnSuccessListener
                }
                db.collection("groupCodes").document(normalized).get().addOnSuccessListener { codeDoc ->
                    val groupId = codeDoc.getString("groupId").orEmpty()
                    if (groupId.isBlank()) {
                        onDone(Result.failure(IllegalArgumentException("invalid_code")))
                        return@addOnSuccessListener
                    }
                    createJoinRequest(account, groupId, onDone)
                }.addOnFailureListener { onDone(Result.failure(it)) }
            }.addOnFailureListener { onDone(Result.failure(it)) }
        }.addOnFailureListener { onDone(Result.failure(it)) }
    }

    private fun createJoinRequest(account: V600Account, groupId: String, onDone: (Result<String>) -> Unit) {
        val groupRef = groups.document(groupId)
        val requestRef = groupRef.collection("joinRequests").document(account.uid)
        val userRequestRef = users.document(account.uid).collection("joinRequests").document(groupId)
        val expires = Timestamp(java.util.Date(System.currentTimeMillis() + TimeUnit.HOURS.toMillis(V600Limits.COLOR_RESERVATION_HOURS.toLong())))
        db.runTransaction { tx ->
            val group = tx.get(groupRef)
            if (!group.exists() || group.getBoolean("frozen") == true) throw IllegalStateException("group_unavailable")
            if ((group.getLong("memberCount") ?: 0L) >= V600Limits.MAX_GROUP_MEMBERS) throw IllegalStateException("group_full")
            if (tx.get(groupRef.collection("members").document(account.uid)).exists()) throw IllegalStateException("already_member")
            val data = mapOf(
                "id" to account.uid,
                "groupId" to groupId,
                "uid" to account.uid,
                "displayName" to account.displayName,
                "requestedColor" to 0L,
                "status" to "pending",
                "createdAt" to FieldValue.serverTimestamp(),
                "expiresAt" to expires
            )
            tx.set(requestRef, data)
            tx.set(userRequestRef, data)
            groupId
        }.addOnSuccessListener { onDone(Result.success(it)) }
            .addOnFailureListener { onDone(Result.failure(it)) }
    }

    fun approveJoin(groupId: String, request: V600JoinRequest, actor: GroupMembership, onDone: (Boolean) -> Unit) {
        if (actor.parsedRole !in setOf(GroupRole.SUPER_BOSS, GroupRole.BOSS)) {
            onDone(false)
            return
        }
        val groupRef = groups.document(groupId)
        val requestRef = groupRef.collection("joinRequests").document(request.uid)
        db.runTransaction { tx ->
            val group = tx.get(groupRef)
            if ((group.getLong("memberCount") ?: 0L) >= V600Limits.MAX_GROUP_MEMBERS) throw IllegalStateException("group_full")
            val freshRequest = tx.get(requestRef)
            if (!freshRequest.exists() || freshRequest.getString("status") != "pending") throw IllegalStateException("request_missing")
            val approval = mapOf("status" to "color_pending", "approvedAt" to FieldValue.serverTimestamp(), "approvedBy" to actor.uid)
            tx.set(requestRef, approval, SetOptions.merge())
            tx.set(users.document(request.uid).collection("joinRequests").document(groupId), approval, SetOptions.merge())
        }.addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun chooseApprovedJoinColor(account: V600Account, request: V600JoinRequest, color: Long, onDone: (Boolean) -> Unit) {
        val groupRef=groups.document(request.groupId)
        val groupRequest=groupRef.collection("joinRequests").document(account.uid)
        val userRequest=users.document(account.uid).collection("joinRequests").document(request.groupId)
        val memberRef=groupRef.collection("members").document(account.uid)
        val membershipRef=users.document(account.uid).collection("memberships").document(request.groupId)
        val claim=groupRef.collection("colorClaims").document(color.toString())
        db.runTransaction{tx->
            val group=tx.get(groupRef)
            if(!group.exists()||(group.getLong("memberCount")?:0L)>=V600Limits.MAX_GROUP_MEMBERS)throw IllegalStateException("group_full")
            val fresh=tx.get(userRequest)
            if(!fresh.exists()||fresh.getString("status")!="color_pending")throw IllegalStateException("not_approved")
            if(tx.get(claim).exists())throw IllegalStateException("color_taken")
            val data=mapOf("groupId" to request.groupId,"uid" to account.uid,"displayName" to account.displayName,"color" to color,"role" to GroupRole.MEMBER.wire,"order" to (group.getLong("memberCount")?:0L).toInt(),"joinedAt" to FieldValue.serverTimestamp())
            tx.set(memberRef,data);tx.set(membershipRef,data);tx.set(claim,mapOf("uid" to account.uid,"claimedAt" to FieldValue.serverTimestamp()))
            tx.update(groupRef,mapOf("memberCount" to FieldValue.increment(1),"updatedAt" to FieldValue.serverTimestamp()))
            if(account.activeGroupId.isBlank())tx.set(users.document(account.uid),mapOf("activeGroupId" to request.groupId),SetOptions.merge())
            tx.delete(groupRequest);tx.delete(userRequest)
        }.addOnCompleteListener{onDone(it.isSuccessful)}
    }

    fun setMembershipColor(groupId: String, membership: GroupMembership, newColor: Long, onDone: (Boolean) -> Unit) {
        val groupRef = groups.document(groupId)
        val memberRef = groupRef.collection("members").document(membership.uid)
        val userMembership = users.document(membership.uid).collection("memberships").document(groupId)
        val oldClaim = groupRef.collection("colorClaims").document(membership.color.toString())
        val newClaim = groupRef.collection("colorClaims").document(newColor.toString())
        db.runTransaction { tx ->
            val claimed = tx.get(newClaim)
            if (claimed.exists() && claimed.getString("uid") != membership.uid) throw IllegalStateException("color_taken")
            tx.update(memberRef, "color", newColor)
            tx.update(userMembership, "color", newColor)
            tx.set(newClaim, mapOf("uid" to membership.uid, "claimedAt" to FieldValue.serverTimestamp()))
            if (oldClaim.path != newClaim.path) tx.delete(oldClaim)
        }.addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun updateDisplayName(uid: String, name: String, memberships: List<GroupMembership>, onDone: (Boolean) -> Unit) {
        val clean = name.trim().take(35)
        if (clean.isBlank()) { onDone(false); return }
        val batch = db.batch()
        batch.set(users.document(uid), mapOf("displayName" to clean, "name" to clean), SetOptions.merge())
        memberships.forEach { membership ->
            batch.set(groups.document(membership.groupId).collection("members").document(uid), mapOf("displayName" to clean), SetOptions.merge())
            batch.set(users.document(uid).collection("memberships").document(membership.groupId), mapOf("displayName" to clean), SetOptions.merge())
        }
        batch.commit().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun updateGroupIdentity(groupId: String, name: String, iconId: String, color: Long, onDone: (Boolean) -> Unit) {
        groups.document(groupId).set(mapOf(
            "name" to name.trim().take(40),
            "iconId" to iconId,
            "icon" to iconId,
            "color" to color,
            "groupColor" to color,
            "updatedAt" to FieldValue.serverTimestamp()
        ),SetOptions.merge()).addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun setGroupRole(groupId: String, target: GroupMembership, role: GroupRole, onDone: (Boolean) -> Unit) {
        if (target.parsedRole == GroupRole.SUPER_BOSS || role == GroupRole.SUPER_BOSS) { onDone(false); return }
        val batch = db.batch()
        batch.update(groups.document(groupId).collection("members").document(target.uid), "role", role.wire)
        batch.update(users.document(target.uid).collection("memberships").document(groupId), "role", role.wire)
        batch.commit().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun removeMember(groupId: String, target: GroupMembership, onDone: (Boolean) -> Unit) {
        if (target.parsedRole == GroupRole.SUPER_BOSS) { onDone(false); return }
        val group = groups.document(groupId)
        val batch = db.batch()
        batch.delete(group.collection("members").document(target.uid))
        batch.delete(users.document(target.uid).collection("memberships").document(groupId))
        batch.delete(group.collection("colorClaims").document(target.color.toString()))
        batch.update(group, mapOf("memberCount" to FieldValue.increment(-1), "updatedAt" to FieldValue.serverTimestamp()))
        batch.commit().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun leaveGroup(account: V600Account, membership: GroupMembership, onDone: (Boolean) -> Unit) {
        if (membership.parsedRole == GroupRole.SUPER_BOSS) { onDone(false); return }
        val group = groups.document(membership.groupId)
        val batch = db.batch()
        batch.delete(group.collection("members").document(account.uid))
        batch.delete(users.document(account.uid).collection("memberships").document(membership.groupId))
        batch.delete(group.collection("colorClaims").document(membership.color.toString()))
        batch.update(group, mapOf("memberCount" to FieldValue.increment(-1), "updatedAt" to FieldValue.serverTimestamp()))
        if (account.activeGroupId == membership.groupId) batch.set(users.document(account.uid), mapOf("activeGroupId" to ""), SetOptions.merge())
        batch.commit().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun acceptPrivacy(uid: String, version: Int, onDone: (Boolean) -> Unit) {
        users.document(uid).set(mapOf(
            "privacyVersion" to version,
            "privacyAcceptedAt" to FieldValue.serverTimestamp()
        ), SetOptions.merge()).addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun activateFreeSupporter(uid: String, onDone: (Boolean) -> Unit) {
        db.runTransaction { tx ->
            val settings = tx.get(config)
            if (settings.getBoolean("freeSupporterPeriod") != true) throw IllegalStateException("period_closed")
            tx.set(users.document(uid), mapOf(
                "supporter" to true,
                "supporterSince" to FieldValue.serverTimestamp()
            ), SetOptions.merge())
        }.addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun listenAdminSettings(onChange: (AdminSettings) -> Unit): ListenerRegistration =
        config.addSnapshotListener { d, _ ->
            onChange(AdminSettings(
                maxCreatedGroups = (d?.getLong("maxCreatedGroups") ?: V600Limits.MAX_CREATED_GROUPS.toLong()).toInt(),
                maxMemberships = (d?.getLong("maxMemberships") ?: V600Limits.MAX_MEMBERSHIPS.toLong()).toInt(),
                maxPendingRequests = (d?.getLong("maxPendingRequests") ?: V600Limits.MAX_PENDING_REQUESTS.toLong()).toInt(),
                defaultListLimit = (d?.getLong("defaultListLimit") ?: V600Limits.DEFAULT_LIST_LIMIT.toLong()).toInt(),
                freeSupporterPeriod = d?.getBoolean("freeSupporterPeriod") ?: true,
                founderUid = d?.getString("founderUid") ?: "",
                privacyVersion = (d?.getLong("privacyVersion") ?: 1L).toInt()
            ))
        }

    fun listenPublishedGlobalPin(onChange: (GlobalPinDocument?) -> Unit): ListenerRegistration =
        db.collection("globalPins").whereEqualTo("status", "published").limit(1)
            .addSnapshotListener { snapshot, _ ->
                val d = snapshot?.documents?.firstOrNull()
                onChange(if (d == null) null else GlobalPinDocument(
                    id = d.id,
                    title = d.getString("title") ?: "",
                    infoText = d.getString("infoText") ?: "",
                    status = d.getString("status") ?: "draft",
                    createdAt = d.getTimestamp("createdAt"),
                    updatedAt = d.getTimestamp("updatedAt"),
                    publishedAt = d.getTimestamp("publishedAt"),
                    revision = d.getLong("revision") ?: 0L
                ))
            }

    fun listenGlobalPinItems(pinId: String, onChange: (List<GlobalPinItem>) -> Unit): ListenerRegistration =
        db.collection("globalPins").document(pinId).collection("items").orderBy("order")
            .addSnapshotListener { snapshot, _ ->
                onChange(snapshot?.documents?.map { d -> GlobalPinItem(
                    id = d.id,
                    name = d.getString("name") ?: "",
                    quantity = d.getString("quantity") ?: "",
                    order = (d.getLong("order") ?: 0L).toInt(),
                    reactionCount = (d.getLong("reactionCount") ?: 0L).toInt(),
                    createdAt = d.getTimestamp("createdAt")
                ) } ?: emptyList())
            }

    fun hideGlobalPin(uid: String, revision: Long, onDone: (Boolean) -> Unit) {
        users.document(uid).set(mapOf("hiddenGlobalPinRevision" to revision), SetOptions.merge())
            .addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun restoreGlobalPin(uid: String, onDone: (Boolean) -> Unit) {
        users.document(uid).set(mapOf("hiddenGlobalPinRevision" to 0L), SetOptions.merge())
            .addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun toggleGlobalPinReaction(pinId: String, itemId: String, uid: String, active: Boolean, onDone: (Boolean) -> Unit) {
        val item = db.collection("globalPins").document(pinId).collection("items").document(itemId)
        val reaction = item.collection("reactions").document(uid)
        db.runTransaction { tx ->
            val exists = tx.get(reaction).exists()
            if (active && !exists) {
                tx.set(reaction, mapOf("uid" to uid, "createdAt" to FieldValue.serverTimestamp()))
                tx.update(item, "reactionCount", FieldValue.increment(1))
            } else if (!active && exists) {
                tx.delete(reaction)
                tx.update(item, "reactionCount", FieldValue.increment(-1))
            }
        }.addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun createReport(
        uid: String,
        problem: Boolean,
        category: String,
        title: String,
        description: String,
        language: String,
        theme: String,
        includeTechnicalInfo: Boolean,
        onDone: (Result<String>) -> Unit
    ) {
        val ref = db.collection("reports").document()
        val data = mutableMapOf<String, Any>(
            "id" to ref.id,
            "authorUid" to uid,
            "kind" to if (problem) "problem" else "suggestion",
            "category" to category.take(40),
            "title" to title.trim().take(80),
            "description" to description.trim().take(2000),
            "status" to "new",
            "priority" to "normal",
            "language" to language,
            "theme" to theme,
            "appVersion" to BuildConfig.VERSION_NAME,
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        if (includeTechnicalInfo) {
            data["androidVersion"] = android.os.Build.VERSION.RELEASE
            data["deviceModel"] = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}".trim()
        }
        ref.set(data).addOnSuccessListener { onDone(Result.success(ref.id)) }
            .addOnFailureListener { onDone(Result.failure(it)) }
    }

    fun listenAdminReports(onChange: (List<BubbsunReport>) -> Unit): ListenerRegistration =
        db.collection("reports").orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING).limit(40)
            .addSnapshotListener { snapshot, _ ->
                onChange(snapshot?.documents?.map { d -> BubbsunReport(
                    id = d.id,
                    authorUid = d.getString("authorUid") ?: "",
                    category = d.getString("category") ?: "other",
                    title = d.getString("title") ?: "",
                    description = d.getString("description") ?: "",
                    status = d.getString("status") ?: "new",
                    priority = d.getString("priority") ?: "normal",
                    screenshotUrl = d.getString("screenshotUrl") ?: "",
                    appVersion = d.getString("appVersion") ?: "",
                    androidVersion = d.getString("androidVersion") ?: "",
                    deviceModel = d.getString("deviceModel") ?: "",
                    language = d.getString("language") ?: "",
                    theme = d.getString("theme") ?: "",
                    createdAt = d.getTimestamp("createdAt"),
                    updatedAt = d.getTimestamp("updatedAt")
                ) } ?: emptyList())
            }

    fun updateReportStatus(reportId: String, status: String, onDone: (Boolean) -> Unit) {
        db.collection("reports").document(reportId).update(mapOf(
            "status" to status,
            "updatedAt" to FieldValue.serverTimestamp()
        )).addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun listenAdminMembers(onChange: (List<AdminMemberRecord>) -> Unit): ListenerRegistration =
        users.addSnapshotListener { snapshot, _ ->
            onChange(snapshot?.documents?.map { d -> AdminMemberRecord(
                uid = d.id,
                displayName = d.getString("displayName") ?: d.getString("name") ?: "Bubbsun",
                globalTitle = d.getString("globalTitle") ?: "",
                titleColor = d.getLong("titleColor") ?: 0L,
                supporter = d.getBoolean("supporter") ?: false,
                megaSuperBoss = d.getBoolean("megaSuperBoss") ?: false,
                founder = d.getBoolean("founder") ?: false,
                suspended = d.getBoolean("suspended") ?: false,
                createdAt = d.getTimestamp("createdAt"),
                lastActiveAt = d.getTimestamp("lastActiveAt")
            ) } ?: emptyList())
        }

    fun setAdminMemberTitle(uid: String, title: String, color: Long, onDone: (Boolean) -> Unit) {
        users.document(uid).set(mapOf(
            "globalTitle" to title.trim().take(40),
            "titleColor" to color,
            "updatedAt" to FieldValue.serverTimestamp()
        ), SetOptions.merge()).addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun syncSupporter(uid: String, enabled: Boolean, onDone: (Boolean) -> Unit = {}) {
        val values = mutableMapOf<String, Any>("supporter" to enabled, "updatedAt" to FieldValue.serverTimestamp())
        if (enabled) values["supporterSince"] = FieldValue.serverTimestamp()
        users.document(uid).set(values, SetOptions.merge()).addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun deleteReport(reportId: String, onDone: (Boolean) -> Unit) {
        db.collection("reports").document(reportId).delete().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun setMemberSuspended(uid: String, suspended: Boolean, onDone: (Boolean) -> Unit) {
        users.document(uid).update(mapOf("suspended" to suspended, "updatedAt" to FieldValue.serverTimestamp()))
            .addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun setMemberMegaSuperBoss(uid: String, enabled: Boolean, onDone: (Boolean) -> Unit) {
        users.document(uid).update(mapOf("megaSuperBoss" to enabled, "updatedAt" to FieldValue.serverTimestamp()))
            .addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun loadAdminMemberships(uid: String, onDone: (List<AdminMembershipRecord>) -> Unit) {
        val userRef=users.document(uid)
        userRef.get().addOnCompleteListener { userTask ->
            val userDoc=if(userTask.isSuccessful)userTask.result else null
            val legacyGroup=userDoc?.getString("groupId").orEmpty()
            userRef.collection("memberships").get().addOnCompleteListener { membershipTask ->
                val userMemberships=if(membershipTask.isSuccessful)membershipTask.result.documents.associateBy{it.id} else emptyMap()
                groups.get().addOnCompleteListener { groupsTask ->
                    val groupDocs=if(groupsTask.isSuccessful)groupsTask.result.documents else emptyList()
                    if(groupDocs.isEmpty()){
                        onDone(userMemberships.values.map{d->AdminMembershipRecord(d.id,d.id,d.getString("role")?:GroupRole.MEMBER.wire,d.getLong("color")?:0L)})
                        return@addOnCompleteListener
                    }
                    val results=mutableMapOf<String,AdminMembershipRecord>()
                    var remaining=groupDocs.size
                    groupDocs.forEach{groupDoc->
                        val groupId=groupDoc.id
                        groups.document(groupId).collection("members").document(uid).get().addOnCompleteListener{memberTask->
                            val groupMember=if(memberTask.isSuccessful)memberTask.result.takeIf{it.exists()} else null
                            val userMembership=userMemberships[groupId]
                            if(groupMember!=null||userMembership!=null||groupId==legacyGroup){
                                val role=userMembership?.getString("role")?:groupMember?.getString("role")?:userDoc?.getString("role")?:GroupRole.MEMBER.wire
                                val color=userMembership?.getLong("color")?:groupMember?.getLong("color")?:userDoc?.getLong("color")?:0L
                                results[groupId]=AdminMembershipRecord(groupId,groupDoc.getString("name")?:groupId,role,color)
                                if(userMembership==null){
                                    userRef.collection("memberships").document(groupId).set(mapOf("groupId" to groupId,"uid" to uid,"displayName" to (userDoc?.getString("displayName")?:userDoc?.getString("name")?:"Bubbsun"),"role" to role,"color" to color,"migratedAt" to FieldValue.serverTimestamp()),SetOptions.merge())
                                }
                            }
                            remaining--
                            if(remaining==0)onDone(results.values.sortedBy{it.groupName.lowercase()})
                        }
                    }
                }
            }
        }
    }

    fun setAdminSupporter(uid:String,enabled:Boolean,onDone:(Boolean)->Unit){
        val values=mutableMapOf<String,Any>(
            "supporter" to enabled,
            "supporterNoticeType" to if(enabled)"granted" else "removed",
            "supporterNoticeRevision" to FieldValue.increment(1),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        values["supporterSince"]=if(enabled)FieldValue.serverTimestamp() else FieldValue.delete()
        users.document(uid).set(values,SetOptions.merge()).addOnCompleteListener{onDone(it.isSuccessful)}
    }

    fun acknowledgeSupporterNotice(uid:String,revision:Long,onDone:(Boolean)->Unit={}){
        users.document(uid).set(mapOf("supporterNoticeSeen" to revision,"updatedAt" to FieldValue.serverTimestamp()),SetOptions.merge()).addOnCompleteListener{onDone(it.isSuccessful)}
    }

    fun setAdminGroupRole(uid: String, membership: AdminMembershipRecord, role: String, onDone: (Boolean) -> Unit) {
        val batch = db.batch()
        batch.set(users.document(uid).collection("memberships").document(membership.groupId), mapOf("role" to role), SetOptions.merge())
        batch.set(groups.document(membership.groupId).collection("members").document(uid), mapOf("role" to role), SetOptions.merge())
        batch.commit().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun adminRemoveFromGroup(uid: String, membership: AdminMembershipRecord, onDone: (Boolean) -> Unit) {
        val batch = db.batch()
        batch.delete(users.document(uid).collection("memberships").document(membership.groupId))
        batch.delete(groups.document(membership.groupId).collection("members").document(uid))
        batch.commit().addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun loadAdminDashboard(onDone: (AdminDashboard) -> Unit) {
        users.get().addOnSuccessListener { userSnapshot ->
            val now = System.currentTimeMillis()
            val usersData = userSnapshot.documents
            val baseMembers = usersData.size
            val supporters = usersData.count { it.getBoolean("supporter") == true }
            fun activeWithin(days: Int) = usersData.count {
                val time = it.getTimestamp("lastActiveAt")?.toDate()?.time ?: 0L
                time >= now - TimeUnit.DAYS.toMillis(days.toLong())
            }
            db.collection("reports").get().addOnSuccessListener { reportSnapshot ->
                groups.get().addOnSuccessListener { groupSnapshot ->
                    val docs = groupSnapshot.documents
                    if (docs.isEmpty()) {
                        onDone(AdminDashboard(members=baseMembers,active24h=activeWithin(1),active7d=activeWithin(7),active30d=activeWithin(30),supporters=supporters,newReports=reportSnapshot.count{it.getString("status")=="new"}))
                        return@addOnSuccessListener
                    }
                    var remaining = docs.size
                    var membershipCount = 0; var listCount = 0; var entryCount = 0
                    var completedCount = 0; var thumbCount = 0
                    var largestGroup = ""; var largestGroupSize = -1
                    var busiestList = ""; var busiestListSize = -1
                    docs.forEach { groupDoc ->
                        val groupRef = groupDoc.reference
                        groupRef.collection("members").get().addOnSuccessListener { memberDocs ->
                            membershipCount += memberDocs.size()
                            if (memberDocs.size() > largestGroupSize) { largestGroupSize = memberDocs.size(); largestGroup = groupDoc.getString("name") ?: "" }
                            groupRef.collection("lists").get().addOnCompleteListener { listTask ->
                                val listDocs = if(listTask.isSuccessful) listTask.result?.documents.orEmpty() else emptyList()
                                listCount += listDocs.size
                                listDocs.forEach { listDoc ->
                                    val items = listDoc.get("items") as? List<*> ?: emptyList<Any>()
                                    entryCount += items.size
                                    if (items.size > busiestListSize) { busiestListSize = items.size; busiestList = listDoc.getString("name") ?: "" }
                                    items.forEach { raw ->
                                        val item = raw as? Map<*, *> ?: return@forEach
                                        if (item["completed"] == true) completedCount++
                                        thumbCount += (item["likedBy"] as? List<*>)?.size ?: 0
                                    }
                                }
                                remaining--
                                if (remaining == 0) onDone(AdminDashboard(
                                    members=baseMembers,active24h=activeWithin(1),active7d=activeWithin(7),active30d=activeWithin(30),
                                    groups=docs.size,memberships=membershipCount,lists=listCount,entries=entryCount,completed=completedCount,
                                    thumbs=thumbCount,supporters=supporters,newReports=reportSnapshot.count{it.getString("status")=="new"},
                                    largestGroup=largestGroup,busiestList=busiestList
                                ))
                            }
                        }.addOnFailureListener {
                            remaining--
                            if (remaining == 0) onDone(AdminDashboard(members=baseMembers,groups=docs.size,supporters=supporters,newReports=reportSnapshot.count{it.getString("status")=="new"}))
                        }
                    }
                }.addOnFailureListener { onDone(AdminDashboard(members=baseMembers,supporters=supporters,newReports=reportSnapshot.count{it.getString("status")=="new"})) }
            }.addOnFailureListener { onDone(AdminDashboard(members=baseMembers,supporters=supporters)) }
        }.addOnFailureListener { onDone(AdminDashboard()) }
    }

    fun publishGlobalPin(title: String, infoText: String, itemNames: List<String>, onDone: (Result<String>) -> Unit) {
        val pins = db.collection("globalPins")
        pins.whereEqualTo("status", "published").get().addOnSuccessListener { current ->
            val ref = pins.document()
            val batch = db.batch()
            current.documents.forEach { batch.update(it.reference, mapOf("status" to "archived", "updatedAt" to FieldValue.serverTimestamp())) }
            val revision = System.currentTimeMillis()
            batch.set(ref, mapOf(
                "id" to ref.id,
                "title" to title.trim().take(80),
                "infoText" to infoText.trim().take(240),
                "status" to "published",
                "revision" to revision,
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp(),
                "publishedAt" to FieldValue.serverTimestamp()
            ))
            itemNames.map { it.trim() }.filter { it.isNotBlank() }.take(50).forEachIndexed { index, name ->
                val item = ref.collection("items").document()
                batch.set(item, mapOf("id" to item.id, "name" to name.take(80), "quantity" to "", "order" to index, "reactionCount" to 0, "createdAt" to FieldValue.serverTimestamp()))
            }
            batch.commit().addOnSuccessListener { onDone(Result.success(ref.id)) }.addOnFailureListener { onDone(Result.failure(it)) }
        }.addOnFailureListener { onDone(Result.failure(it)) }
    }

    fun unpublishGlobalPin(pinId: String, onDone: (Boolean) -> Unit) {
        db.collection("globalPins").document(pinId).update(mapOf("status" to "archived", "updatedAt" to FieldValue.serverTimestamp()))
            .addOnCompleteListener { onDone(it.isSuccessful) }
    }

    fun setFreeSupporterPeriod(enabled: Boolean, onDone: (Boolean) -> Unit) {
        config.set(mapOf("freeSupporterPeriod" to enabled), SetOptions.merge()).addOnCompleteListener { onDone(it.isSuccessful) }
    }

    private fun generateCode(): String {
        val alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        val raw = (1..8).map { alphabet.random() }.joinToString("")
        return raw.take(4) + "-" + raw.drop(4)
    }
}
