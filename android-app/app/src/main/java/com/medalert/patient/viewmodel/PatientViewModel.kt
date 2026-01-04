package com.medalert.patient.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medalert.patient.data.model.*
import com.medalert.patient.data.repository.PatientRepository
import com.medalert.patient.services.MedicineSchedulingService
import com.medalert.patient.services.MedicineScheduleCalculator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PatientViewModel @Inject constructor(
    private val repository: PatientRepository,
    private val medicineSchedulingService: MedicineSchedulingService,
    private val scheduleCalculator: MedicineScheduleCalculator
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(PatientUiState())
    val uiState: StateFlow<PatientUiState> = _uiState.asStateFlow()
    
    private val _patient = MutableStateFlow<Patient?>(null)
    val patient: StateFlow<Patient?> = _patient.asStateFlow()
    
    private val _medications = MutableStateFlow<List<Medication>>(emptyList())
    val medications: StateFlow<List<Medication>> = _medications.asStateFlow()
    
    private val _notifications = MutableStateFlow<List<MedicineNotification>>(emptyList())
    val notifications: StateFlow<List<MedicineNotification>> = _notifications.asStateFlow()
    
    private val _caretakers = MutableStateFlow<List<Caretaker>>(emptyList())
    val caretakers: StateFlow<List<Caretaker>> = _caretakers.asStateFlow()
    
    private val _caretakerRequests = MutableStateFlow<List<CaretakerApproval>>(emptyList())
    val caretakerRequests: StateFlow<List<CaretakerApproval>> = _caretakerRequests.asStateFlow()
    
    init {
        loadPatientData()
    }
    
    fun loadPatientData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            repository.fetchAllPatientData()
                .onSuccess { dataBundle ->
                    _patient.value = dataBundle.patient
                    _medications.value = dataBundle.medicines
                    _notifications.value = dataBundle.notifications
                    _caretakerRequests.value = dataBundle.caretakerRequests
                    _uiState.value = _uiState.value.copy(isLoading = false, error = null)
                    
                    // Automatically schedule notifications for active medicines only
                    if (dataBundle.medicines.isNotEmpty()) {
                        // First cancel notifications for inactive medicines
                        medicineSchedulingService.cancelInactiveMedicineNotifications(dataBundle.medicines)
                        
                        // Then schedule notifications for active medicines
                        medicineSchedulingService.scheduleMultipleMedicines(dataBundle.medicines)
                        android.util.Log.d("PatientViewModel", "Processed notifications for ${dataBundle.medicines.size} medicines (active and inactive)")
                    }
                    
                    android.util.Log.d("PatientViewModel", "All patient data loaded successfully")
                    android.util.Log.d("PatientViewModel", "Medicines: ${dataBundle.medicines.size}, Notifications: ${dataBundle.notifications.size}")
                }
                .onFailure { error ->
                    android.util.Log.e("PatientViewModel", "Failed to load patient data: ${error.message}", error)
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun loadMedicineNotifications() {
        viewModelScope.launch {
            repository.getMedicineNotifications()
                .onSuccess { notifications ->
                    _notifications.value = notifications
                }
                .onFailure { error ->
                    // Don't update UI state for notification errors
                    println("Failed to load notifications: ${error.message}")
                }
        }
    }
    
    fun updateMedicine(medicineIndex: Int, medication: Medication) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            val updateData = mapOf(
                "name" to medication.name,
                "dosage" to medication.dosage,
                "frequency" to medication.frequency,
                "duration" to medication.duration,
                "instructions" to medication.instructions,
                "foodTiming" to medication.foodTiming,
                "prescribedBy" to medication.prescribedBy
            )
            
            repository.updateMedicine(medicineIndex, updateData)
                .onSuccess { updatedMedication ->
                    // Reschedule notifications for the updated medicine
                    medicineSchedulingService.rescheduleMedicineNotifications(updatedMedication)
                    android.util.Log.d("PatientViewModel", "Rescheduled notifications for updated medicine: ${updatedMedication.name}")
                    
                    refreshAllData() // Refresh all data
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun addMedicine(medication: Medication) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            repository.addMedicine(medication)
                .onSuccess { addedMedication ->
                    // Automatically schedule notifications for the new medicine
                    medicineSchedulingService.scheduleMedicineNotifications(addedMedication)
                    android.util.Log.d("PatientViewModel", "Scheduled notifications for new medicine: ${addedMedication.name}")
                    
                    refreshAllData() // Refresh all data
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun deleteMedicine(medicineIndex: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            // Get the medicine to be deleted for notification cancellation
            val medicineToDelete = _medications.value.getOrNull(medicineIndex)
            
            repository.deleteMedicine(medicineIndex)
                .onSuccess {
                    // Cancel notifications for the deleted medicine
                    medicineToDelete?.let { medicine ->
                        medicineSchedulingService.cancelMedicineNotifications(medicine)
                        android.util.Log.d("PatientViewModel", "Cancelled notifications for deleted medicine: ${medicine.name}")
                    }
                    
                    refreshAllData() // Refresh all data
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    fun setMedicineTimings(
        medicineName: String,
        dosage: String,
        notificationTimes: List<NotificationTime>,
        instructions: String = "",
        foodTiming: String = "",
        frequency: String = "",
        duration: String = ""
    ) {
        viewModelScope.launch {
            val request = SetTimingsRequest(
                medicineName = medicineName,
                dosage = dosage,
                notificationTimes = notificationTimes,
                instructions = instructions,
                foodTiming = foodTiming,
                frequency = frequency,
                duration = duration
            )
            
            repository.setMedicineTimings(request)
                .onSuccess {
                    loadMedicineNotifications()
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message)
                }
        }
    }
    
    fun recordAdherence(medicineIndex: Int, taken: Boolean, notes: String = "", doseId: String? = null, scheduledTime: String? = null) {
        viewModelScope.launch {
            repository.recordAdherence(medicineIndex, taken, notes, doseId, scheduledTime)
                .onSuccess {
                    refreshAllData() // Refresh to get updated adherence data
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message)
                }
        }
    }
    
    fun loadAvailableCaretakers(search: String? = null) {
        viewModelScope.launch {
            repository.getAvailableCaretakers(search)
                .onSuccess { caretakers ->
                    _caretakers.value = caretakers
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message)
                }
        }
    }
    
    fun assignCaretaker(caretakerUserId: String) {
        viewModelScope.launch {
            repository.assignCaretaker(caretakerUserId)
                .onSuccess {
                    refreshAllData() // Refresh to get updated caretaker info
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(error = error.message)
                }
        }
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
    
    fun refreshAllData() {
        android.util.Log.d("PatientViewModel", "Refreshing all patient data")
        loadPatientData()
    }
    
    /**
     * Update medicine schedule with custom schedule entries
     */
    fun updateMedicineSchedule(medicineIndex: Int, customSchedule: List<ScheduleEntry>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val currentMedications = _medications.value
                if (medicineIndex < currentMedications.size) {
                    val medication = currentMedications[medicineIndex]
                    val updatedMedication = medication.copy(customSchedule = customSchedule)
                    
                    // Update the medicine with custom schedule
                    val updateData = mapOf(
                        "customSchedule" to customSchedule
                    )
                    
                    repository.updateMedicine(medicineIndex, updateData)
                        .onSuccess { updatedMed ->
                            // Reschedule notifications with the new custom schedule
                            medicineSchedulingService.rescheduleMedicineNotifications(updatedMed)
                            android.util.Log.d("PatientViewModel", "Updated schedule for ${updatedMed.name}")
                            
                            refreshAllData() // Refresh all data
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = error.message
                            )
                        }
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
    
    /**
     * Get schedule summary for a medicine
     */
    fun getMedicineScheduleSummary(medication: Medication): String {
        return scheduleCalculator.getScheduleSummary(medication)
    }
    
    /**
     * Check if medicine is currently active
     */
    fun isMedicineActive(medication: Medication): Boolean {
        return scheduleCalculator.isMedicineActive(medication)
    }
    
    /**
     * Get remaining days for medicine
     */
    fun getRemainingDays(medication: Medication): Int {
        return scheduleCalculator.getRemainingDays(medication)
    }
    
    /**
     * Update medicine timing and sync with backend
     */
    fun updateMedicineTiming(
        medicineIndex: Int,
        timing: List<String>? = null,
        customSchedule: List<ScheduleEntry>? = null,
        startDate: String? = null,
        endDate: String? = null,
        totalTablets: Int? = null,
        remainingTablets: Int? = null
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            repository.updateMedicineTiming(
                medicineIndex = medicineIndex,
                timing = timing,
                customSchedule = customSchedule,
                startDate = startDate,
                endDate = endDate,
                totalTablets = totalTablets,
                remainingTablets = remainingTablets
            )
                .onSuccess { updatedMedication ->
                    // Reschedule notifications with updated timing
                    medicineSchedulingService.rescheduleMedicineNotifications(updatedMedication)
                    android.util.Log.d("PatientViewModel", "Updated timing for ${updatedMedication.name}")
                    
                    refreshAllData() // Refresh all data to sync with backend
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message
                    )
                }
        }
    }
    
    /**
     * Sync medicine timing from web changes
     */
    fun syncMedicineTimingFromWeb(medicineIndex: Int) {
        viewModelScope.launch {
            try {
                // Refresh data to get latest timing from backend
                refreshAllData()
                android.util.Log.d("PatientViewModel", "Synced timing for medicine index $medicineIndex")
            } catch (e: Exception) {
                android.util.Log.e("PatientViewModel", "Error syncing timing: ${e.message}", e)
            }
        }
    }
    
    /**
     * Quick edit medicine timing (simple timing list)
     */
    fun editMedicineTiming(medicineIndex: Int, newTiming: List<String>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                android.util.Log.d("PatientViewModel", "Starting timing update for medicine index $medicineIndex with timings: $newTiming")
                
                repository.updateMedicineTiming(
                    medicineIndex = medicineIndex,
                    timing = newTiming
                )
                    .onSuccess { updatedMedication ->
                        // Reschedule notifications with updated timing
                        medicineSchedulingService.rescheduleMedicineNotifications(updatedMedication)
                        android.util.Log.d("PatientViewModel", "Successfully updated timing for ${updatedMedication.name}: $newTiming")
                        android.util.Log.d("PatientViewModel", "Updated medication timing array: ${updatedMedication.timing}")
                        
                        refreshAllData() // Refresh all data to sync with backend
                    }
                    .onFailure { error ->
                        android.util.Log.e("PatientViewModel", "Failed to update timing: ${error.message}", error)
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = error.message
                        )
                    }
            } catch (e: Exception) {
                android.util.Log.e("PatientViewModel", "Exception during timing update: ${e.message}", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
    
    /**
     * Update medication schedule with detailed scheduled doses
     */
    fun updateMedicationSchedule(medication: Medication, scheduledDoses: List<ScheduledDose>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val medicineIndex = _medications.value.indexOfFirst { it._id == medication._id }
                if (medicineIndex != -1) {
                    val updatedMedication = medication.copy(scheduledDoses = scheduledDoses)
                    
                    // Update the medicine with new schedule
                    val updateData = mapOf(
                        "scheduledDoses" to scheduledDoses
                    )
                    
                    repository.updateMedicine(medicineIndex, updateData)
                        .onSuccess { updatedMed ->
                            // Reschedule notifications with the new schedule
                            medicineSchedulingService.rescheduleMedicineNotifications(updatedMed)
                            android.util.Log.d("PatientViewModel", "Updated schedule for ${updatedMed.name}")
                            
                            refreshAllData() // Refresh all data
                        }
                        .onFailure { error ->
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = error.message
                            )
                        }
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
    
    /**
     * Record a dose as taken
     */
    fun recordDoseTaken(doseRecord: DoseRecord) {
        viewModelScope.launch {
            try {
                val currentTime = getCurrentTime()
                val currentDate = getCurrentDate()
                
                val updatedRecord = doseRecord.copy(
                    status = DoseStatus.TAKEN,
                    actualTime = currentTime,
                    actualDate = currentDate,
                    recordedAt = getCurrentDateTime()
                )
                
                // Find the medication and update its dose records
                val medicineIndex = _medications.value.indexOfFirst { medication ->
                    medication.scheduledDoses.any { it.id == doseRecord.scheduledDoseId }
                }
                
                if (medicineIndex != -1) {
                    val medication = _medications.value[medicineIndex]
                    val updatedDoseRecords = medication.doseRecords.toMutableList()
                    
                    // Remove existing record for this scheduled dose and date
                    updatedDoseRecords.removeAll { record ->
                        record.scheduledDoseId == doseRecord.scheduledDoseId && 
                        record.scheduledDate == doseRecord.scheduledDate
                    }
                    
                    // Add the new record
                    updatedDoseRecords.add(updatedRecord)
                    
                    val updatedMedication = medication.copy(doseRecords = updatedDoseRecords)
                    
                    // Update locally first for immediate UI feedback
                    val currentMedications = _medications.value.toMutableList()
                    currentMedications[medicineIndex] = updatedMedication
                    _medications.value = currentMedications
                    
                    // Then sync with backend
                    repository.updateMedicine(medicineIndex, mapOf("doseRecords" to updatedDoseRecords))
                        .onSuccess {
                            android.util.Log.d("PatientViewModel", "Recorded dose as taken: ${updatedRecord.id}")
                        }
                        .onFailure { error ->
                            android.util.Log.e("PatientViewModel", "Failed to sync dose record: ${error.message}")
                        }
                }
            } catch (e: Exception) {
                android.util.Log.e("PatientViewModel", "Error recording dose: ${e.message}", e)
            }
        }
    }
    
    /**
     * Record a dose as missed
     */
    fun recordDoseMissed(doseRecord: DoseRecord) {
        viewModelScope.launch {
            try {
                val updatedRecord = doseRecord.copy(
                    status = DoseStatus.MISSED,
                    recordedAt = getCurrentDateTime()
                )
                
                updateDoseRecord(updatedRecord)
                android.util.Log.d("PatientViewModel", "Recorded dose as missed: ${updatedRecord.id}")
            } catch (e: Exception) {
                android.util.Log.e("PatientViewModel", "Error recording missed dose: ${e.message}", e)
            }
        }
    }
    
    /**
     * Record a dose as skipped
     */
    fun recordDoseSkipped(doseRecord: DoseRecord) {
        viewModelScope.launch {
            try {
                val updatedRecord = doseRecord.copy(
                    status = DoseStatus.SKIPPED,
                    recordedAt = getCurrentDateTime()
                )
                
                updateDoseRecord(updatedRecord)
                android.util.Log.d("PatientViewModel", "Recorded dose as skipped: ${updatedRecord.id}")
            } catch (e: Exception) {
                android.util.Log.e("PatientViewModel", "Error recording skipped dose: ${e.message}", e)
            }
        }
    }
    
    /**
     * Update a dose record
     */
    private fun updateDoseRecord(doseRecord: DoseRecord) {
        viewModelScope.launch {
            try {
                // Find the medication and update its dose records
                val medicineIndex = _medications.value.indexOfFirst { medication ->
                    medication.scheduledDoses.any { it.id == doseRecord.scheduledDoseId }
                }
                
                if (medicineIndex != -1) {
                    val medication = _medications.value[medicineIndex]
                    val updatedDoseRecords = medication.doseRecords.toMutableList()
                    
                    // Remove existing record for this scheduled dose and date
                    updatedDoseRecords.removeAll { record ->
                        record.scheduledDoseId == doseRecord.scheduledDoseId && 
                        record.scheduledDate == doseRecord.scheduledDate
                    }
                    
                    // Add the new record
                    updatedDoseRecords.add(doseRecord)
                    
                    val updatedMedication = medication.copy(doseRecords = updatedDoseRecords)
                    
                    // Update locally first for immediate UI feedback
                    val currentMedications = _medications.value.toMutableList()
                    currentMedications[medicineIndex] = updatedMedication
                    _medications.value = currentMedications
                    
                    // Then sync with backend
                    repository.updateMedicine(medicineIndex, mapOf("doseRecords" to updatedDoseRecords))
                        .onSuccess {
                            android.util.Log.d("PatientViewModel", "Updated dose record: ${doseRecord.id}")
                        }
                        .onFailure { error ->
                            android.util.Log.e("PatientViewModel", "Failed to sync dose record: ${error.message}")
                        }
                }
            } catch (e: Exception) {
                android.util.Log.e("PatientViewModel", "Error updating dose record: ${e.message}", e)
            }
        }
    }
    
    /**
     * Get adherence statistics for a medication
     */
    fun getAdherenceStats(medication: Medication): AdherenceStats {
        val totalDoses = medication.doseRecords.size
        val takenDoses = medication.doseRecords.count { it.status == DoseStatus.TAKEN }
        val missedDoses = medication.doseRecords.count { it.status == DoseStatus.MISSED }
        val skippedDoses = medication.doseRecords.count { it.status == DoseStatus.SKIPPED }
        val lateDoses = medication.doseRecords.count { it.status == DoseStatus.LATE }
        
        val adherenceRate = if (totalDoses > 0) (takenDoses.toFloat() / totalDoses * 100).toInt() else 0
        
        return AdherenceStats(
            totalDoses = totalDoses,
            takenDoses = takenDoses,
            missedDoses = missedDoses,
            skippedDoses = skippedDoses,
            lateDoses = lateDoses,
            adherenceRate = adherenceRate
        )
    }
    
    // Helper functions for date/time formatting
    private fun getCurrentDate(): String {
        val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
        return dateFormat.format(java.util.Date())
    }
    
    private fun getCurrentTime(): String {
        val timeFormat = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
        return timeFormat.format(java.util.Date())
    }
    
    private fun getCurrentDateTime(): String {
        val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault())
        return dateFormat.format(java.util.Date())
    }
}

data class PatientUiState(
    val isLoading: Boolean = false,
    val error: String? = null
)

data class AdherenceStats(
    val totalDoses: Int = 0,
    val takenDoses: Int = 0,
    val missedDoses: Int = 0,
    val skippedDoses: Int = 0,
    val lateDoses: Int = 0,
    val adherenceRate: Int = 0
)