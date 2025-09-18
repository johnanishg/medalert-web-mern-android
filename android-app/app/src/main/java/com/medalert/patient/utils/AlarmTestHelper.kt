package com.medalert.patient.utils

import android.content.Context
import android.content.Intent
import com.medalert.patient.services.MedicineAlarmService

/**
 * Helper class to test alarm functionality
 * This can be used for debugging and testing purposes
 */
object AlarmTestHelper {
    
    /**
     * Test the alarm service with sample data
     * This method can be called from anywhere in the app for testing
     */
    fun testAlarm(context: Context) {
        val testIntent = Intent(context, MedicineAlarmService::class.java).apply {
            action = "START_ALARM"
            putExtra(MedicineAlarmService.EXTRA_MEDICINE_NAME, "Test Medicine")
            putExtra(MedicineAlarmService.EXTRA_DOSAGE, "500mg")
            putExtra(MedicineAlarmService.EXTRA_INSTRUCTIONS, "Take with food")
            putExtra(MedicineAlarmService.EXTRA_FOOD_TIMING, "After meals")
            putExtra(MedicineAlarmService.EXTRA_MEDICINE_ID, "test_medicine_001")
            putExtra(MedicineAlarmService.EXTRA_NOTIFICATION_TIME, "14:30")
            putExtra(MedicineAlarmService.EXTRA_NOTIFICATION_LABEL, "Test Reminder")
            putExtra(MedicineAlarmService.EXTRA_TABLET_COUNT, "1 tablet")
            putExtra(MedicineAlarmService.EXTRA_SCHEDULE_DATE, "2024-01-15")
        }
        
        context.startForegroundService(testIntent)
    }
    
    /**
     * Stop any active alarm
     */
    fun stopAlarm(context: Context) {
        val stopIntent = Intent(context, MedicineAlarmService::class.java).apply {
            action = "STOP_ALARM"
        }
        context.startService(stopIntent)
    }
}
