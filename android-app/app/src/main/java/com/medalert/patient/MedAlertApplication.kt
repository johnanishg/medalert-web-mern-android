package com.medalert.patient

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class MedAlertApplication : Application() {
    
    companion object {
        const val MEDICATION_CHANNEL_ID = "medication_reminders"
        const val APPOINTMENT_CHANNEL_ID = "appointment_reminders"
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            
            // Medication reminders channel
            val medicationChannel = NotificationChannel(
                MEDICATION_CHANNEL_ID,
                "Medication Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for medication reminders"
                enableVibration(true)
                setShowBadge(true)
            }
            
            // Appointment reminders channel
            val appointmentChannel = NotificationChannel(
                APPOINTMENT_CHANNEL_ID,
                "Appointment Reminders",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications for appointment reminders"
                enableVibration(true)
                setShowBadge(true)
            }
            
            notificationManager.createNotificationChannel(medicationChannel)
            notificationManager.createNotificationChannel(appointmentChannel)
        }
    }
}