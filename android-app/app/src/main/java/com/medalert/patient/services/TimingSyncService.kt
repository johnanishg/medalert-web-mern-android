package com.medalert.patient.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.medalert.patient.data.repository.PatientRepository
import com.medalert.patient.services.MedicineSchedulingService
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@AndroidEntryPoint
class TimingSyncService : Service() {
    
    @Inject
    lateinit var patientRepository: PatientRepository
    
    @Inject
    lateinit var medicineSchedulingService: MedicineSchedulingService
    
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var syncJob: Job? = null
    
    companion object {
        private const val TAG = "TimingSyncService"
        private const val SYNC_INTERVAL_MINUTES = 5L // Sync every 5 minutes
        private val SYNC_INTERVAL_MS = TimeUnit.MINUTES.toMillis(SYNC_INTERVAL_MINUTES)
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "TimingSyncService created")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "TimingSyncService started")
        startPeriodicSync()
        return START_STICKY // Restart service if killed
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "TimingSyncService destroyed")
        stopPeriodicSync()
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null // This is not a bound service
    }
    
    private fun startPeriodicSync() {
        syncJob = serviceScope.launch {
            while (isActive) {
                try {
                    syncMedicineTimings()
                    delay(SYNC_INTERVAL_MS)
                } catch (e: Exception) {
                    Log.e(TAG, "Error during timing sync: ${e.message}", e)
                    delay(SYNC_INTERVAL_MS) // Wait before retrying
                }
            }
        }
    }
    
    private fun stopPeriodicSync() {
        syncJob?.cancel()
        serviceScope.cancel()
    }
    
    private suspend fun syncMedicineTimings() {
        try {
            Log.d(TAG, "Starting medicine timing sync...")
            
            // Check if user is logged in
            if (!patientRepository.isLoggedIn()) {
                Log.d(TAG, "User not logged in, skipping sync")
                return
            }
            
            // Fetch latest patient data from backend
            val result = patientRepository.fetchAllPatientData()
            result.onSuccess { dataBundle ->
                Log.d(TAG, "Fetched patient data: ${dataBundle.medicines.size} medicines")
                
                // Check each medicine for timing changes
                dataBundle.medicines.forEach { medicine ->
                    syncMedicineTiming(medicine)
                }
                
                Log.d(TAG, "Medicine timing sync completed")
            }.onFailure { error ->
                Log.e(TAG, "Failed to fetch patient data: ${error.message}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error in syncMedicineTimings: ${e.message}", e)
        }
    }
    
    private suspend fun syncMedicineTiming(medicine: com.medalert.patient.data.model.Medication) {
        try {
            // Check if medicine has timing or schedule changes
            val hasTimingChanges = medicine.timing.isNotEmpty() || medicine.customSchedule.isNotEmpty()
            
            if (hasTimingChanges) {
                Log.d(TAG, "Syncing timing for medicine: ${medicine.name}")
                
                // Reschedule notifications with updated timing
                medicineSchedulingService.rescheduleMedicineNotifications(medicine)
                
                Log.d(TAG, "Rescheduled notifications for ${medicine.name}")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error syncing timing for ${medicine.name}: ${e.message}", e)
        }
    }
    
    /**
     * Force immediate sync (can be called from UI)
     */
    fun forceSync() {
        serviceScope.launch {
            syncMedicineTimings()
        }
    }
    
    /**
     * Check for timing changes in a specific medicine
     */
    suspend fun checkMedicineTimingChanges(medicineIndex: Int) {
        try {
            val result = patientRepository.fetchAllPatientData()
            result.onSuccess { dataBundle ->
                if (medicineIndex < dataBundle.medicines.size) {
                    val medicine = dataBundle.medicines[medicineIndex]
                    syncMedicineTiming(medicine)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking timing changes for medicine $medicineIndex: ${e.message}", e)
        }
    }
}
