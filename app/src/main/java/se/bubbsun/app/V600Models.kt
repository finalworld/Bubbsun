package se.bubbsun.app

import com.google.firebase.Timestamp

object V600Limits {
    const val MAX_CREATED_GROUPS = 5
    const val MAX_MEMBERSHIPS = 20
    const val MAX_PENDING_REQUESTS = 10
    const val MAX_GROUP_MEMBERS = 16
    const val DEFAULT_LIST_LIMIT = 100
    const val COLOR_RESERVATION_HOURS = 24
}

enum class GroupRole(val wire: String) {
    SUPER_BOSS("superboss"),
    BOSS("boss"),
    MEMBER("member");

    companion object {
        fun fromWire(value: String?) = entries.firstOrNull { it.wire == value } ?: MEMBER
    }
}

data class V600Account(
    val uid: String = "",
    val displayName: String = "Bubbsun",
    val activeGroupId: String = "",
    val globalTitle: String = "",
    val titleColor: Long = 0L,
    val supporter: Boolean = false,
    val supporterSince: Timestamp? = null,
    val supporterNoticeType: String = "",
    val supporterNoticeRevision: Long = 0L,
    val supporterNoticeSeen: Long = 0L,
    val megaSuperBoss: Boolean = false,
    val founder: Boolean = false,
    val suspended: Boolean = false,
    val privacyVersion: Int = 0,
    val privacyAcceptedAt: Timestamp? = null,
    val hiddenGlobalPinRevision: Long = 0L,
    val createdAt: Timestamp? = null,
    val lastActiveAt: Timestamp? = null
)

data class GroupMembership(
    val groupId: String = "",
    val uid: String = "",
    val displayName: String = "",
    val color: Long = 0L,
    val role: String = GroupRole.MEMBER.wire,
    val joinedAt: Timestamp? = null,
    val order: Int = 0,
    val notificationsPaused: Boolean = false
) {
    val parsedRole: GroupRole get() = GroupRole.fromWire(role)
}

data class GroupSummary(
    val id: String = "",
    val name: String = "",
    val iconId: String = "group_home",
    val color: Long = 0xFF7D936CL,
    val ownerId: String = "",
    val joinCode: String = "",
    val memberCount: Int = 0,
    val listCount: Int = 0,
    val listLimit: Int = V600Limits.DEFAULT_LIST_LIMIT,
    val frozen: Boolean = false,
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)

data class V600JoinRequest(
    val id: String = "",
    val groupId: String = "",
    val uid: String = "",
    val displayName: String = "",
    val requestedColor: Long = 0L,
    val status: String = "pending",
    val createdAt: Timestamp? = null,
    val expiresAt: Timestamp? = null
)

data class NotificationPreferences(
    val enabled: Boolean = false,
    val hideContent: Boolean = true,
    val pausedGroups: Map<String, Boolean> = emptyMap(),
    val followedLists: Map<String, Boolean> = emptyMap(),
    val newLists: Boolean = false,
    val newMembers: Boolean = false,
    val memberLeaves: Boolean = false,
    val joinRequests: Boolean = false
)

data class GlobalPinDocument(
    val id: String = "",
    val title: String = "",
    val infoText: String = "",
    val status: String = "draft",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null,
    val publishedAt: Timestamp? = null,
    val revision: Long = 0L
)

data class GlobalPinItem(
    val id: String = "",
    val name: String = "",
    val quantity: String = "",
    val order: Int = 0,
    val reactionCount: Int = 0,
    val createdAt: Timestamp? = null
)

data class BubbsunReport(
    val id: String = "",
    val authorUid: String = "",
    val category: String = "other",
    val title: String = "",
    val description: String = "",
    val status: String = "new",
    val priority: String = "normal",
    val screenshotUrl: String = "",
    val appVersion: String = "",
    val androidVersion: String = "",
    val deviceModel: String = "",
    val language: String = "",
    val theme: String = "",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)

data class V600ActivityEvent(
    val id: String = "",
    val groupId: String = "",
    val type: String = "",
    val actorUid: String = "",
    val actorName: String = "",
    val actorColor: Long = 0L,
    val targetId: String = "",
    val targetName: String = "",
    val metadata: Map<String, String> = emptyMap(),
    val createdAt: Timestamp? = null
)

data class AdminSettings(
    val maxCreatedGroups: Int = V600Limits.MAX_CREATED_GROUPS,
    val maxMemberships: Int = V600Limits.MAX_MEMBERSHIPS,
    val maxPendingRequests: Int = V600Limits.MAX_PENDING_REQUESTS,
    val defaultListLimit: Int = V600Limits.DEFAULT_LIST_LIMIT,
    val freeSupporterPeriod: Boolean = true,
    val founderUid: String = "",
    val privacyVersion: Int = 1
)

data class AdminMemberRecord(
    val uid: String = "",
    val displayName: String = "Bubbsun",
    val globalTitle: String = "",
    val titleColor: Long = 0L,
    val supporter: Boolean = false,
    val megaSuperBoss: Boolean = false,
    val founder: Boolean = false,
    val suspended: Boolean = false,
    val createdAt: Timestamp? = null,
    val lastActiveAt: Timestamp? = null
)

data class AdminMembershipRecord(
    val groupId: String = "",
    val groupName: String = "",
    val role: String = GroupRole.MEMBER.wire,
    val color: Long = 0L
)

data class AdminDashboard(
    val members: Int = 0,
    val active24h: Int = 0,
    val active7d: Int = 0,
    val active30d: Int = 0,
    val groups: Int = 0,
    val memberships: Int = 0,
    val lists: Int = 0,
    val entries: Int = 0,
    val completed: Int = 0,
    val thumbs: Int = 0,
    val supporters: Int = 0,
    val newReports: Int = 0,
    val largestGroup: String = "",
    val busiestList: String = ""
)
