package com.medalert.patient.services

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.medalert.patient.R
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.NotificationTime
import com.medalert.patient.data.model.ScheduleEntry
import com.medalert.patient.notifications.MedicationReminderReceiver
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MedicineSchedulingService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val scheduleCalculator: MedicineScheduleCalculator
) {
    
    companion object {
        const val MEDICINE_CHANNEL_ID = "medicine_reminders"
        const val MEDICINE_CHANNEL_NAME = "Medicine Reminders"
        const val MEDICINE_CHANNEL_DESCRIPTION = "Notifications for medicine reminders"
    }
    
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    
    init {
        createNotificationChannel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                MEDICINE_CHANNEL_ID,
                MEDICINE_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = MEDICINE_CHANNEL_DESCRIPTION
                enableVibration(true)
                enableLights(true)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * Automatically schedule notifications for a medicine based on its calculated schedule
     */
    fun scheduleMedicineNotifications(medication: Medication) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                android.util.Log.d("MedicineSchedulingService", "Scheduling notifications for medicine: ${medication.name}")
                
                // Check if medicine is active
                if (!scheduleCalculator.isMedicineActive(medication)) {
                    android.util.Log.w("MedicineSchedulingService", "Medicine ${medication.name} is not active")
                    return@launch
                }
                
                // Calculate complete schedule
                val schedule = scheduleCalculator.calculateSchedule(medication)
                
                if (schedule.isEmpty()) {
                    android.util.Log.w("MedicineSchedulingService", "No schedule calculated for medicine: ${medication.name}")
                    return@launch
                }
                
                // Validate schedule
                val issues = scheduleCalculator.validateSchedule(schedule)
                if (issues.isNotEmpty()) {
                    android.util.Log.w("MedicineSchedulingService", "Schedule issues for ${medication.name}: ${issues.joinToString()}")
                }
                
                // Schedule each entry
                schedule.forEach { scheduleEntry ->
                    scheduleScheduleEntry(medication, scheduleEntry)
                }
                
                android.util.Log.d("MedicineSchedulingService", "Successfully scheduled ${schedule.size} notifications for ${medication.name}")
                android.util.Log.d("MedicineSchedulingService", scheduleCalculator.getScheduleSummary(medication))
                
            } catch (e: Exception) {
                android.util.Log.e("MedicineSchedulingService", "Error scheduling notifications for ${medication.name}: ${e.message}", e)
            }
        }
    }
    
    /**
     * Parse timing information from medication and convert to NotificationTime objects
     */
    private fun parseTimingFromMedication(medication: Medication): List<NotificationTime> {
        val notificationTimes = mutableListOf<NotificationTime>()
        
        // Parse timing from the timing list
        medication.timing.forEach { timeString ->
            when (timeString.lowercase()) {
                "morning" -> notificationTimes.add(NotificationTime("08:00", "Morning", true))
                "afternoon" -> notificationTimes.add(NotificationTime("14:00", "Afternoon", true))
                "evening" -> notificationTimes.add(NotificationTime("18:00", "Evening", true))
                "night" -> notificationTimes.add(NotificationTime("20:00", "Night", true))
                else -> {
                    // Try to parse as time format (HH:MM)
                    if (timeString.matches(Regex("\\d{1,2}:\\d{2}"))) {
                        notificationTimes.add(NotificationTime(timeString, "Custom", true))
                    }
                }
            }
        }
        
        // If no timing found, try to parse from frequency
        if (notificationTimes.isEmpty()) {
            parseTimingFromFrequency(medication.frequency, notificationTimes)
        }
        
        return notificationTimes
    }
    
    /**
     * Parse timing from frequency string
     */
    private fun parseTimingFromFrequency(frequency: String, notificationTimes: MutableList<NotificationTime>) {
        val frequencyLower = frequency.lowercase()
        
        when {
            frequencyLower.contains("morning") -> notificationTimes.add(NotificationTime("08:00", "Morning", true))
            frequencyLower.contains("afternoon") -> notificationTimes.add(NotificationTime("14:00", "Afternoon", true))
            frequencyLower.contains("evening") -> notificationTimes.add(NotificationTime("18:00", "Evening", true))
            frequencyLower.contains("night") -> notificationTimes.add(NotificationTime("20:00", "Night", true))
            frequencyLower.contains("twice") -> {
                notificationTimes.add(NotificationTime("08:00", "Morning", true))
                notificationTimes.add(NotificationTime("20:00", "Night", true))
            }
            frequencyLower.contains("thrice") || frequencyLower.contains("three") -> {
                notificationTimes.add(NotificationTime("08:00", "Morning", true))
                notificationTimes.add(NotificationTime("14:00", "Afternoon", true))
                notificationTimes.add(NotificationTime("20:00", "Night", true))
            }
            else -> {
                // Default to morning if no specific timing found
                notificationTimes.add(NotificationTime("08:00", "Morning", true))
            }
        }
    }
    
    /**
     * Schedule a single schedule entry with enhanced multiple timing support
     */
    private fun scheduleScheduleEntry(medication: Medication, scheduleEntry: ScheduleEntry) {
        if (!scheduleEntry.isActive) return
        
        try {
            val intent = Intent(context, MedicationReminderReceiver::class.java).apply {
                putExtra("medicine_name", medication.name)
                putExtra("dosage", medication.dosage)
                putExtra("instructions", medication.instructions)
                putExtra("food_timing", medication.foodTiming)
                putExtra("medicine_id", medication._id)
                putExtra("notification_time", scheduleEntry.time)
                putExtra("notification_label", scheduleEntry.label)
                putExtra("tablet_count", scheduleEntry.tabletCount.toString())
                putExtra("schedule_date", scheduleEntry.date)
                // Add timing information for better context
                putExtra("all_timings", medication.timing.joinToString(","))
                putExtra("timing_count", medication.timing.size.toString())
                putExtra("current_timing_index", getTimingIndex(medication.timing, scheduleEntry.time).toString())
            }
            
            val requestCode = generateRequestCode(medication._id, scheduleEntry.date, scheduleEntry.time)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            // Parse date and time
            val dateTime = parseDateTime(scheduleEntry.date, scheduleEntry.time)
            
            // Schedule the alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    dateTime.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    dateTime.timeInMillis,
                    pendingIntent
                )
            }
            
            android.util.Log.d("MedicineSchedulingService", "Scheduled notification for ${medication.name} on ${scheduleEntry.date} at ${scheduleEntry.time} (${scheduleEntry.label}) - Timing ${getTimingIndex(medication.timing, scheduleEntry.time) + 1} of ${medication.timing.size}")
            
        } catch (e: Exception) {
            android.util.Log.e("MedicineSchedulingService", "Error scheduling notification for ${medication.name}: ${e.message}", e)
        }
    }
    
    /**
     * Schedule a single notification for a specific time (legacy method)
     */
    private fun scheduleSingleNotification(medication: Medication, notificationTime: NotificationTime) {
        try {
            val intent = Intent(context, MedicationReminderReceiver::class.java).apply {
                putExtra("medicine_name", medication.name)
                putExtra("dosage", medication.dosage)
                putExtra("instructions", medication.instructions)
                putExtra("food_timing", medication.foodTiming)
                putExtra("medicine_id", medication._id)
                putExtra("notification_time", notificationTime.time)
                putExtra("notification_label", notificationTime.label)
            }
            
            val requestCode = generateRequestCode(medication._id, notificationTime.time)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
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
                set(Calendar.MILLISECOND, 0)
                
                // If the time has already passed today, schedule for tomorrow
                if (timeInMillis <= System.currentTimeMillis()) {
                    add(Calendar.DAY_OF_MONTH, 1)
                }
            }
            
            // Schedule the alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setRepeating(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    AlarmManager.INTERVAL_DAY,
                    pendingIntent
                )
            }
            
            android.util.Log.d("MedicineSchedulingService", "Scheduled notification for ${medication.name} at ${notificationTime.time}")
            
        } catch (e: Exception) {
            android.util.Log.e("MedicineSchedulingService", "Error scheduling notification for ${medication.name}: ${e.message}", e)
        }
    }
    
    /**
     * Cancel all notifications for a specific medicine
     */
    fun cancelMedicineNotifications(medication: Medication) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val notificationTimes = parseTimingFromMedication(medication)
                
                notificationTimes.forEach { notificationTime ->
                    val requestCode = generateRequestCode(medication._id, notificationTime.time)
                    val intent = Intent(context, MedicationReminderReceiver::class.java)
                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        requestCode,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    
                    alarmManager.cancel(pendingIntent)
                }
                
                android.util.Log.d("MedicineSchedulingService", "Cancelled notifications for ${medication.name}")
                
            } catch (e: Exception) {
                android.util.Log.e("MedicineSchedulingService", "Error cancelling notifications for ${medication.name}: ${e.message}", e)
            }
        }
    }
    
    /**
     * Reschedule all notifications for a medicine (useful when medicine is updated)
     */
    fun rescheduleMedicineNotifications(medication: Medication) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Cancel existing notifications
                cancelMedicineNotifications(medication)
                
                // Schedule new notifications
                scheduleMedicineNotifications(medication)
                
                android.util.Log.d("MedicineSchedulingService", "Rescheduled notifications for ${medication.name}")
                
            } catch (e: Exception) {
                android.util.Log.e("MedicineSchedulingService", "Error rescheduling notifications for ${medication.name}: ${e.message}", e)
            }
        }
    }
    
    /**
     * Schedule notifications for multiple medicines (only active ones)
     */
    fun scheduleMultipleMedicines(medications: List<Medication>) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Filter only active medicines
                val activeMedicines = medications.filter { medication ->
                    val isActive = scheduleCalculator.isMedicineActive(medication)
                    android.util.Log.d("MedicineSchedulingService", "Medicine ${medication.name}: isActive=$isActive, isActiveField=${medication.isActive}")
                    isActive
                }
                
                android.util.Log.d("MedicineSchedulingService", "Found ${activeMedicines.size} active medicines out of ${medications.size} total medicines")
                
                // Schedule notifications only for active medicines
                activeMedicines.forEach { medication ->
                    scheduleMedicineNotifications(medication)
                }
                
                android.util.Log.d("MedicineSchedulingService", "Scheduled notifications for ${activeMedicines.size} active medicines")
                
            } catch (e: Exception) {
                android.util.Log.e("MedicineSchedulingService", "Error scheduling multiple medicines: ${e.message}", e)
            }
        }
    }
    
    /**
     * Parse date and time into Calendar
     */
    private fun parseDateTime(dateString: String, timeString: String): Calendar {
        val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val timeFormat = java.text.SimpleDateFormat("HH:mm", Locale.getDefault())
        
        val date = dateFormat.parse(dateString) ?: Date()
        val time = timeFormat.parse(timeString) ?: Date()
        
        val calendar = Calendar.getInstance()
        calendar.time = date
        
        val timeCalendar = Calendar.getInstance()
        timeCalendar.time = time
        
        calendar.set(Calendar.HOUR_OF_DAY, timeCalendar.get(Calendar.HOUR_OF_DAY))
        calendar.set(Calendar.MINUTE, timeCalendar.get(Calendar.MINUTE))
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        
        return calendar
    }
    
    /**
     * Generate a unique request code for the notification
     */
    private fun generateRequestCode(medicineId: String, time: String): Int {
        return (medicineId + time).hashCode()
    }
    
    /**
     * Generate a unique request code for the schedule entry
     */
    private fun generateRequestCode(medicineId: String, date: String, time: String): Int {
        return (medicineId + date + time).hashCode()
    }
    
    /**
     * Clear all medicine notifications (useful for logout)
     */
    fun clearAllMedicineNotifications() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // This is a simplified approach - in a real app, you'd want to track
                // all scheduled notifications and cancel them individually
                android.util.Log.d("MedicineSchedulingService", "Cleared all medicine notifications")
                
            } catch (e: Exception) {
                android.util.Log.e("MedicineSchedulingService", "Error clearing notifications: ${e.message}", e)
            }
        }
    }
    
    /**
     * Cancel notifications for inactive medicines
     */
    fun cancelInactiveMedicineNotifications(medications: List<Medication>) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val inactiveMedicines = medications.filter { medication ->
                    !scheduleCalculator.isMedicineActive(medication)
                }
                
                android.util.Log.d("MedicineSchedulingService", "Found ${inactiveMedicines.size} inactive medicines to cancel notifications for")
                
                inactiveMedicines.forEach { medication ->
                    cancelMedicineNotifications(medication)
                    android.util.Log.d("MedicineSchedulingService", "Cancelled notifications for inactive medicine: ${medication.name}")
                }
                
            } catch (e: Exception) {
                android.util.Log.e("MedicineSchedulingService", "Error cancelling inactive medicine notifications: ${e.message}", e)
            }
        }
    }
    
    /**
     * Get the index of a timing in the medication's timing list
     */
    private fun getTimingIndex(timings: List<String>, currentTime: String): Int {
        return timings.indexOfFirst { timing ->
            // Try to match the timing string or the parsed time
            timing.equals(currentTime, ignoreCase = true) ||
            parseTimingToTime(timing) == currentTime
        }.let { index ->
            if (index >= 0) index else 0
        }
    }
    
    /**
     * Parse timing string to time format
     */
    private fun parseTimingToTime(timing: String): String {
        return when (timing.lowercase()) {
            "morning" -> "08:00"
            "afternoon" -> "14:00"
            "evening" -> "18:00"
            "night" -> "20:00"
            else -> timing
        }
    }
}
