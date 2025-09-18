package com.medalert.patient.notifications

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.medalert.patient.MainActivity
import com.medalert.patient.services.MedicineSchedulingService
import com.medalert.patient.services.MedicineAlarmService
import com.medalert.patient.R

class MedicationReminderReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        val medicineName = intent.getStringExtra("medicine_name") ?: "Your medication"
        val dosage = intent.getStringExtra("dosage") ?: ""
        val instructions = intent.getStringExtra("instructions") ?: ""
        val foodTiming = intent.getStringExtra("food_timing") ?: ""
        val medicineId = intent.getStringExtra("medicine_id") ?: ""
        val notificationTime = intent.getStringExtra("notification_time") ?: ""
        val notificationLabel = intent.getStringExtra("notification_label") ?: "Reminder"
        val tabletCount = try {
            intent.getStringExtra("tablet_count") ?: ""
        } catch (e: ClassCastException) {
            // Handle case where tablet_count is passed as Integer
            intent.getIntExtra("tablet_count", 0).toString()
        }
        val scheduleDate = intent.getStringExtra("schedule_date") ?: ""
        
        // Enhanced multiple timing information
        val allTimings = intent.getStringExtra("all_timings") ?: ""
        val timingCount = intent.getStringExtra("timing_count") ?: "1"
        val currentTimingIndex = intent.getStringExtra("current_timing_index") ?: "0"
        
        // Validate if this medicine is still active (additional safety check)
        if (!isMedicineStillActive(context, medicineId, medicineName)) {
            android.util.Log.w("MedicationReminderReceiver", "Medicine $medicineName is no longer active, skipping notification")
            return
        }
        
        // Check if this is actually a medicine time (not just a reminder)
        if (isMedicineTime(notificationTime, notificationLabel)) {
            // Start the alarm service only for actual medicine times
            startAlarmService(context, medicineName, dosage, instructions, foodTiming, 
                medicineId, notificationTime, notificationLabel, tabletCount, scheduleDate,
                allTimings, timingCount, currentTimingIndex)
        }
        
        // Always show regular notification with enhanced multiple timing info
        showNotification(context, medicineName, dosage, instructions, foodTiming, 
            medicineId, notificationTime, notificationLabel, tabletCount, scheduleDate,
            allTimings, timingCount, currentTimingIndex)
    }
    
    private fun isMedicineTime(notificationTime: String, notificationLabel: String): Boolean {
        // Only trigger alarm for actual medicine times, not for reminders or other notifications
        return notificationLabel.contains("Medicine", ignoreCase = true) || 
               notificationLabel.contains("Dose", ignoreCase = true) ||
               notificationLabel.contains("Take", ignoreCase = true) ||
               notificationTime.isNotEmpty()
    }
    
    private fun isMedicineStillActive(context: Context, medicineId: String, medicineName: String): Boolean {
        return try {
            // For now, we'll do a simple check - in a real app, you might want to
            // query the database or check with the backend to verify the medicine is still active
            // This is a safety check to prevent notifications for medicines that might have been
            // deactivated since the alarm was scheduled
            
            // Basic validation - if we have a medicine ID and name, assume it's still active
            // In a production app, you would want to implement a more robust check
            medicineId.isNotEmpty() && medicineName.isNotEmpty()
            
        } catch (e: Exception) {
            android.util.Log.e("MedicationReminderReceiver", "Error checking if medicine is still active: ${e.message}", e)
            false
        }
    }
    
    private fun startAlarmService(
        context: Context,
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
    ) {
        val alarmIntent = Intent(context, MedicineAlarmService::class.java).apply {
            action = "START_ALARM"
            putExtra(MedicineAlarmService.EXTRA_MEDICINE_NAME, medicineName)
            putExtra(MedicineAlarmService.EXTRA_DOSAGE, dosage)
            putExtra(MedicineAlarmService.EXTRA_INSTRUCTIONS, instructions)
            putExtra(MedicineAlarmService.EXTRA_FOOD_TIMING, foodTiming)
            putExtra(MedicineAlarmService.EXTRA_MEDICINE_ID, medicineId)
            putExtra(MedicineAlarmService.EXTRA_NOTIFICATION_TIME, notificationTime)
            putExtra(MedicineAlarmService.EXTRA_NOTIFICATION_LABEL, notificationLabel)
            putExtra(MedicineAlarmService.EXTRA_TABLET_COUNT, tabletCount)
            putExtra(MedicineAlarmService.EXTRA_SCHEDULE_DATE, scheduleDate)
            // Add multiple timing information
            putExtra("all_timings", allTimings)
            putExtra("timing_count", timingCount)
            putExtra("current_timing_index", currentTimingIndex)
        }
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(alarmIntent)
        } else {
            context.startService(alarmIntent)
        }
    }
    
    private fun showNotification(
        context: Context, 
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
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Create intent to open app when notification is tapped
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Build notification content with multiple timing information
        val timingInfo = if (timingCount.toIntOrNull() ?: 1 > 1) {
            " (${currentTimingIndex.toIntOrNull()?.plus(1) ?: 1} of $timingCount)"
        } else ""
        
        val title = "$notificationLabel - $medicineName$timingInfo"
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
        
        // Build notification
        val notification = NotificationCompat.Builder(context, MedicineSchedulingService.MEDICINE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_medication)
            .setContentTitle(title)
            .setContentText(contentText)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(bigText)
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .addAction(
                R.drawable.ic_check,
                "Mark as Taken",
                createAdherenceIntent(context, medicineName, medicineId, true)
            )
            .addAction(
                R.drawable.ic_close,
                "Mark as Missed",
                createAdherenceIntent(context, medicineName, medicineId, false)
            )
            .build()
        
        notificationManager.notify(medicineName.hashCode(), notification)
    }
    
    private fun createAdherenceIntent(context: Context, medicineName: String, medicineId: String, taken: Boolean): PendingIntent {
        val intent = Intent(context, AdherenceActionReceiver::class.java).apply {
            putExtra("medicine_name", medicineName)
            putExtra("medicine_id", medicineId)
            putExtra("taken", taken)
        }
        
        return PendingIntent.getBroadcast(
            context,
            (medicineName + medicineId + taken.toString()).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}