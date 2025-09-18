package com.medalert.patient.notifications

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast
import com.medalert.patient.services.MedicineAlarmService

class AdherenceActionReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        val medicineName = intent.getStringExtra("medicine_name") ?: return
        val medicineId = intent.getStringExtra("medicine_id") ?: ""
        val taken = intent.getBooleanExtra("taken", false)
        
        // Record adherence (this would typically call your repository)
        recordAdherence(context, medicineName, medicineId, taken)
        
        // Stop the alarm service
        stopAlarmService(context)
        
        // Dismiss the notification
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(medicineName.hashCode())
        
        // Show confirmation toast
        val message = if (taken) "Marked $medicineName as taken" else "Marked $medicineName as missed"
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    
    private fun recordAdherence(_context: Context, medicineName: String, medicineId: String, taken: Boolean) {
        // TODO: Implement adherence recording
        // This would typically involve:
        // 1. Getting the current user from preferences
        // 2. Finding the medicine index using medicineId
        // 3. Calling the API to record adherence
        // 4. Updating local data
        
        // For now, just log the action
        android.util.Log.d("AdherenceActionReceiver", "Recording adherence: $medicineName (ID: $medicineId) - ${if (taken) "taken" else "missed"}")
    }
    
    private fun stopAlarmService(context: Context) {
        val stopAlarmIntent = Intent(context, MedicineAlarmService::class.java).apply {
            action = "STOP_ALARM"
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(stopAlarmIntent)
        } else {
            context.startService(stopAlarmIntent)
        }
    }
}