package com.medalert.patient.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.medalert.patient.data.model.MedicineNotification
import com.medalert.patient.data.model.NotificationTime
import java.util.*

object NotificationScheduler {
    
    fun scheduleNotification(
        context: Context,
        notification: MedicineNotification,
        notificationTime: NotificationTime
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        val intent = Intent(context, MedicationReminderReceiver::class.java).apply {
            putExtra("medicine_name", notification.medicineName)
            putExtra("dosage", notification.dosage)
            putExtra("instructions", notification.instructions)
        }
        
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            (notification.medicineName + notificationTime.time).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Parse time
        val timeParts = notificationTime.time.split(":")
        val hours = timeParts[0].toInt()
        val minutes = timeParts[1].toInt()
        
        // Set up daily repeating alarm
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hours)
            set(Calendar.MINUTE, minutes)
            set(Calendar.SECOND, 0)
            
            // If the time has already passed today, schedule for tomorrow
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_MONTH, 1)
            }
        }
        
        try {
            alarmManager.setRepeating(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                AlarmManager.INTERVAL_DAY,
                pendingIntent
            )
        } catch (e: SecurityException) {
            // Handle permission error for exact alarms
            println("Failed to schedule exact alarm: ${e.message}")
        }
    }
    
    fun cancelNotification(context: Context, medicineName: String, time: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        
        val intent = Intent(context, MedicationReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            (medicineName + time).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        alarmManager.cancel(pendingIntent)
    }
    
    fun rescheduleAllNotifications(context: Context) {
        // TODO: Implement rescheduling all notifications after boot
        // This would typically involve:
        // 1. Loading all active notifications from local storage or API
        // 2. Scheduling each notification again
        println("Rescheduling all notifications after boot")
    }
}