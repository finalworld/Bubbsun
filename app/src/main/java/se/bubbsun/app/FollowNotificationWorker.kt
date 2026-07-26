package se.bubbsun.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.util.concurrent.TimeUnit

object FollowNotificationScheduler {
    private const val PREFS = "bubbsun_followed_lists"
    private const val WORK = "bubbsun-follow-check"

    fun setFollowing(context: Context, groupId: String, listId: String, listName: String, uid: String, following: Boolean) {
        if (groupId.isBlank()) return
        val key = "follow|$groupId|$listId"
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putBoolean(key, following)
            .putString("name|$groupId|$listId", listName)
            .putString("uid", uid)
            .putLong("last|$groupId|$listId", System.currentTimeMillis())
            .apply()
        if (following) schedule(context)
    }

    fun schedule(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.all.none { it.key.startsWith("follow|") && it.value == true }) return
        val request = OneTimeWorkRequestBuilder<FollowNotificationWorker>()
            .setInitialDelay(5, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(WORK, ExistingWorkPolicy.REPLACE, request)
    }
}

class FollowNotificationWorker(context: Context, parameters: WorkerParameters) : Worker(context, parameters) {
    override fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("bubbsun_followed_lists", Context.MODE_PRIVATE)
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: prefs.getString("uid", "").orEmpty()
        if (uid.isBlank()) return Result.success()
        val followed = prefs.all.filter { it.key.startsWith("follow|") && it.value == true }.keys
        val db = FirebaseFirestore.getInstance()
        followed.forEach { key ->
            val parts = key.split('|'); if (parts.size != 3) return@forEach
            val groupId = parts[1]; val listId = parts[2]
            runCatching {
                val document = Tasks.await(db.collection("groups").document(groupId).collection("lists").document(listId).get(), 20, TimeUnit.SECONDS)
                if (!document.exists()) return@runCatching
                val changedAt = document.getTimestamp("updatedAt")?.toDate()?.time ?: 0L
                val previous = prefs.getLong("last|$groupId|$listId", changedAt)
                val changedBy = document.getString("updatedBy").orEmpty()
                if (changedAt > previous && changedBy != uid) {
                    val name = document.getString("name") ?: prefs.getString("name|$groupId|$listId", "Bubbsun") ?: "Bubbsun"
                    showNotification(name, listId)
                }
                prefs.edit().putLong("last|$groupId|$listId", maxOf(previous, changedAt)).apply()
            }
        }
        FollowNotificationScheduler.schedule(applicationContext)
        return Result.success()
    }

    private fun showNotification(listName: String, listId: String) {
        if (Build.VERSION.SDK_INT >= 33 && applicationContext.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel("followed_lists", "Följda listor", NotificationManager.IMPORTANCE_DEFAULT).apply { description = "Ändringar i listor du följer" })
        val intent = Intent(applicationContext, MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP }
        val pending = PendingIntent.getActivity(applicationContext, listId.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(applicationContext, "followed_lists")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Bubbsun • $listName")
            .setContentText("Någon har ändrat i en lista du följer.")
            .setAutoCancel(true).setContentIntent(pending).setPriority(NotificationCompat.PRIORITY_DEFAULT).build()
        NotificationManagerCompat.from(applicationContext).notify(listId.hashCode(), notification)
    }
}
