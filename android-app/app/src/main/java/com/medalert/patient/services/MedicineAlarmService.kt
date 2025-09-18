package com.medalert.patient.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.medalert.patient.MainActivity
import com.medalert.patient.R
import com.medalert.patient.notifications.AdherenceActionReceiver
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MedicineAlarmService : Service() {
    
    companion object {
        const val ALARM_CHANNEL_ID = "medicine_alarms"
        const val ALARM_CHANNEL_NAME = "Medicine Alarms"
        const val ALARM_CHANNEL_DESCRIPTION = "Alarm notifications for medicine reminders"
        const val NOTIFICATION_ID = 1001
        
        // Intent extras
        const val EXTRA_MEDICINE_NAME = "medicine_name"
        const val EXTRA_DOSAGE = "dosage"
        const val EXTRA_INSTRUCTIONS = "instructions"
        const val EXTRA_FOOD_TIMING = "food_timing"
        const val EXTRA_MEDICINE_ID = "medicine_id"
        const val EXTRA_NOTIFICATION_TIME = "notification_time"
        const val EXTRA_NOTIFICATION_LABEL = "notification_label"
        const val EXTRA_TABLET_COUNT = "tablet_count"
        const val EXTRA_SCHEDULE_DATE = "schedule_date"
    }
    
    private lateinit var notificationManager: NotificationManager
    
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var isAlarmActive = false
    
    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createAlarmNotificationChannel()
        initializeVibrator()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "START_ALARM" -> startAlarm(intent)
            "STOP_ALARM" -> stopAlarm()
        }
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    private fun createAlarmNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                ALARM_CHANNEL_ID,
                ALARM_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = ALARM_CHANNEL_DESCRIPTION
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun initializeVibrator() {
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }
    
    private fun startAlarm(intent: Intent) {
        if (isAlarmActive) return
        
        val medicineName = intent.getStringExtra(EXTRA_MEDICINE_NAME) ?: "Your medication"
        val dosage = intent.getStringExtra(EXTRA_DOSAGE) ?: ""
        val instructions = intent.getStringExtra(EXTRA_INSTRUCTIONS) ?: ""
        val foodTiming = intent.getStringExtra(EXTRA_FOOD_TIMING) ?: ""
        val medicineId = intent.getStringExtra(EXTRA_MEDICINE_ID) ?: ""
        val notificationTime = intent.getStringExtra(EXTRA_NOTIFICATION_TIME) ?: ""
        val notificationLabel = intent.getStringExtra(EXTRA_NOTIFICATION_LABEL) ?: "Reminder"
        val tabletCount = intent.getStringExtra(EXTRA_TABLET_COUNT) ?: ""
        val scheduleDate = intent.getStringExtra(EXTRA_SCHEDULE_DATE) ?: ""
        
        // Enhanced multiple timing information
        val allTimings = intent.getStringExtra("all_timings") ?: ""
        val timingCount = intent.getStringExtra("timing_count") ?: "1"
        val currentTimingIndex = intent.getStringExtra("current_timing_index") ?: "0"
        
        // Validate if this is actually a medicine time
        if (!isValidMedicineTime(notificationTime)) {
            android.util.Log.d("MedicineAlarmService", "Not a valid medicine time: $notificationTime")
            stopSelf()
            return
        }
        
        isAlarmActive = true
        
        // Start foreground service with persistent notification
        startForeground(NOTIFICATION_ID, createAlarmNotification(
            medicineName, dosage, instructions, foodTiming, 
            medicineId, notificationTime, notificationLabel, tabletCount, scheduleDate,
            allTimings, timingCount, currentTimingIndex
        ))
        
        // Play alarm sound
        playAlarmSound()
        
        // Start vibration
        startVibration()
        
        // Auto-stop alarm after 1 minute (reduced from 2 minutes)
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            stopAlarm()
        }, 60000) // 1 minute
    }
    
    private fun isValidMedicineTime(notificationTime: String): Boolean {
        if (notificationTime.isEmpty()) return false
        
        try {
            // Parse the notification time (assuming format like "08:00" or "8:00 AM")
            val timePattern = java.util.regex.Pattern.compile("(\\d{1,2}):(\\d{2})\\s*(AM|PM)?", java.util.regex.Pattern.CASE_INSENSITIVE)
            val matcher = timePattern.matcher(notificationTime)
            
            if (matcher.find()) {
                val hour = matcher.group(1)?.toInt() ?: return false
                val minute = matcher.group(2)?.toInt() ?: return false
                val amPm = matcher.group(3)
                
                // Convert to 24-hour format if needed
                var hour24 = hour
                if (amPm != null) {
                    when (amPm.uppercase()) {
                        "AM" -> if (hour == 12) hour24 = 0
                        "PM" -> if (hour != 12) hour24 = hour + 12
                    }
                }
                
                // Get current time
                val calendar = java.util.Calendar.getInstance()
                val currentHour = calendar.get(java.util.Calendar.HOUR_OF_DAY)
                val currentMinute = calendar.get(java.util.Calendar.MINUTE)
                
                // Check if current time matches the medicine time (within 5 minutes tolerance)
                val timeDifference = kotlin.math.abs((currentHour * 60 + currentMinute) - (hour24 * 60 + minute))
                return timeDifference <= 5 // Allow 5 minutes tolerance
            }
        } catch (e: Exception) {
            android.util.Log.e("MedicineAlarmService", "Error parsing time: ${e.message}", e)
        }
        
        return false
    }
    
    private fun stopAlarm() {
        if (!isAlarmActive) return
        
        isAlarmActive = false
        
        // Stop alarm sound
        stopAlarmSound()
        
        // Stop vibration
        stopVibration()
        
        // Stop foreground service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }
    
    private fun playAlarmSound() {
        try {
            // Get default alarm sound
            val alarmUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                        .build()
                )
                setDataSource(this@MedicineAlarmService, alarmUri)
                isLooping = false // Don't loop continuously, play once
                prepare()
                start()
                
                // Set completion listener to replay after a short delay
                setOnCompletionListener {
                    // Replay the alarm sound after 3 seconds if alarm is still active
                    if (isAlarmActive) {
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            if (isAlarmActive) {
                                try {
                                    seekTo(0)
                                    start()
                                } catch (e: Exception) {
                                    android.util.Log.e("MedicineAlarmService", "Error replaying alarm: ${e.message}", e)
                                }
                            }
                        }, 3000) // 3 second delay between alarm sounds
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("MedicineAlarmService", "Error playing alarm sound: ${e.message}", e)
        }
    }
    
    private fun stopAlarmSound() {
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    player.stop()
                }
                player.release()
            }
            mediaPlayer = null
        } catch (e: Exception) {
            android.util.Log.e("MedicineAlarmService", "Error stopping alarm sound: ${e.message}", e)
        }
    }
    
    private fun startVibration() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // More gentle vibration pattern for medicine reminders
                val vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                val vibrationEffect = VibrationEffect.createWaveform(vibrationPattern, 0)
                vibrator?.vibrate(vibrationEffect)
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(longArrayOf(0, 500, 200, 500, 200, 500), 0)
            }
        } catch (e: Exception) {
            android.util.Log.e("MedicineAlarmService", "Error starting vibration: ${e.message}", e)
        }
    }
    
    private fun stopVibration() {
        try {
            vibrator?.cancel()
        } catch (e: Exception) {
            android.util.Log.e("MedicineAlarmService", "Error stopping vibration: ${e.message}", e)
        }
    }
    
    private fun createAlarmNotification(
        medicineName: String,
        dosage: String,
        instructions: String,
        foodTiming: String,
        medicineId: String,
        notificationTime: String,
        notificationLabel: String,
        tabletCount: String,
        scheduleDate: String,
        allTimings: String = "",
        timingCount: String = "1",
        currentTimingIndex: String = "0"
    ): android.app.Notification {
        
        // Create intent to open app when notification is tapped
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Build notification content with multiple timing information
        val timingInfo = if (timingCount.toIntOrNull() ?: 1 > 1) {
            " (${currentTimingIndex.toIntOrNull()?.plus(1) ?: 1} of $timingCount)"
        } else ""
        
        val title = "🔔 $notificationLabel - $medicineName$timingInfo"
        val contentText = "Time to take $medicineName ($dosage)"
        val bigText = buildString {
            append("Time to take $medicineName ($dosage)")
            if (timingCount.toIntOrNull() ?: 1 > 1) {
                append("\n\nTiming: ${currentTimingIndex.toIntOrNull()?.plus(1) ?: 1} of $timingCount")
                if (allTimings.isNotEmpty()) {
                    append("\nAll timings: $allTimings")
                }
            }
            if (tabletCount.isNotEmpty()) {
                append("\n\nTablet count: $tabletCount")
            }
            if (foodTiming.isNotEmpty()) {
                append("\n\nFood timing: $foodTiming")
            }
            if (instructions.isNotEmpty()) {
                append("\n\nInstructions: $instructions")
            }
            append("\n\nTime: $notificationTime")
            if (scheduleDate.isNotEmpty()) {
                append("\nDate: $scheduleDate")
            }
        }
        
        // Create stop alarm intent
        val stopAlarmIntent = Intent(this, MedicineAlarmService::class.java).apply {
            action = "STOP_ALARM"
        }
        val stopAlarmPendingIntent = PendingIntent.getService(
            this,
            1,
            stopAlarmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Build notification
        return NotificationCompat.Builder(this, ALARM_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_medication)
            .setContentTitle(title)
            .setContentText(contentText)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(bigText)
            )
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .addAction(
                R.drawable.ic_check,
                "Mark as Taken",
                createAdherenceIntent(medicineName, medicineId, true)
            )
            .addAction(
                R.drawable.ic_close,
                "Mark as Missed",
                createAdherenceIntent(medicineName, medicineId, false)
            )
            .addAction(
                R.drawable.ic_stop,
                "Stop Alarm",
                stopAlarmPendingIntent
            )
            .setFullScreenIntent(pendingIntent, true)
            .build()
    }
    
    private fun createAdherenceIntent(medicineName: String, medicineId: String, taken: Boolean): PendingIntent {
        val intent = Intent(this, AdherenceActionReceiver::class.java).apply {
            putExtra("medicine_name", medicineName)
            putExtra("medicine_id", medicineId)
            putExtra("taken", taken)
        }
        
        return PendingIntent.getBroadcast(
            this,
            (medicineName + medicineId + taken.toString()).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopAlarm()
    }
}
