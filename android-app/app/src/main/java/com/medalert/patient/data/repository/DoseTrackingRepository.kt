package com.medalert.patient.data.repository

import com.medalert.patient.data.local.DoseRecordEntity
import com.medalert.patient.data.local.DoseTrackingDao
import com.medalert.patient.data.local.ScheduledDoseEntity
import com.medalert.patient.data.model.DoseRecord
import com.medalert.patient.data.model.DoseStatus
import com.medalert.patient.data.model.ScheduledDose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DoseTrackingRepository @Inject constructor(
    private val doseTrackingDao: DoseTrackingDao
) {
    
    // Dose Records
    suspend fun getDoseRecord(scheduledDoseId: String, scheduledDate: String): DoseRecord? {
        return doseTrackingDao.getDoseRecord(scheduledDoseId, scheduledDate)?.toDoseRecord()
    }
    
    fun getDoseRecordsForScheduledDose(scheduledDoseId: String): Flow<List<DoseRecord>> {
        return doseTrackingDao.getDoseRecordsForScheduledDose(scheduledDoseId)
            .map { entities -> entities.map { it.toDoseRecord() } }
    }
    
    fun getDoseRecordsForDate(date: String): Flow<List<DoseRecord>> {
        return doseTrackingDao.getDoseRecordsForDate(date)
            .map { entities -> entities.map { it.toDoseRecord() } }
    }
    
    fun getDoseRecordsForDateRange(startDate: String, endDate: String): Flow<List<DoseRecord>> {
        return doseTrackingDao.getDoseRecordsForDateRange(startDate, endDate)
            .map { entities -> entities.map { it.toDoseRecord() } }
    }
    
    suspend fun insertDoseRecord(doseRecord: DoseRecord) {
        doseTrackingDao.insertDoseRecord(DoseRecordEntity.fromDoseRecord(doseRecord))
    }
    
    suspend fun updateDoseRecord(doseRecord: DoseRecord) {
        doseTrackingDao.updateDoseRecord(DoseRecordEntity.fromDoseRecord(doseRecord))
    }
    
    suspend fun deleteDoseRecord(doseRecord: DoseRecord) {
        doseTrackingDao.deleteDoseRecord(DoseRecordEntity.fromDoseRecord(doseRecord))
    }
    
    suspend fun deleteDoseRecordsForScheduledDose(scheduledDoseId: String) {
        doseTrackingDao.deleteDoseRecordsForScheduledDose(scheduledDoseId)
    }
    
    // Scheduled Doses
    fun getScheduledDosesForMedication(medicationId: String): Flow<List<ScheduledDose>> {
        return doseTrackingDao.getScheduledDosesForMedication(medicationId)
            .map { entities -> entities.map { it.toScheduledDose() } }
    }
    
    fun getActiveScheduledDosesForMedication(medicationId: String): Flow<List<ScheduledDose>> {
        return doseTrackingDao.getActiveScheduledDosesForMedication(medicationId)
            .map { entities -> entities.map { it.toScheduledDose() } }
    }
    
    suspend fun insertScheduledDose(scheduledDose: ScheduledDose, medicationId: String) {
        doseTrackingDao.insertScheduledDose(
            ScheduledDoseEntity.fromScheduledDose(scheduledDose, medicationId)
        )
    }
    
    suspend fun insertScheduledDoses(scheduledDoses: List<ScheduledDose>, medicationId: String) {
        val entities = scheduledDoses.map { 
            ScheduledDoseEntity.fromScheduledDose(it, medicationId) 
        }
        doseTrackingDao.insertScheduledDoses(entities)
    }
    
    suspend fun updateScheduledDose(scheduledDose: ScheduledDose, medicationId: String) {
        doseTrackingDao.updateScheduledDose(
            ScheduledDoseEntity.fromScheduledDose(scheduledDose, medicationId)
        )
    }
    
    suspend fun deleteScheduledDose(scheduledDose: ScheduledDose, medicationId: String) {
        doseTrackingDao.deleteScheduledDose(
            ScheduledDoseEntity.fromScheduledDose(scheduledDose, medicationId)
        )
    }
    
    suspend fun deleteScheduledDosesForMedication(medicationId: String) {
        doseTrackingDao.deleteScheduledDosesForMedication(medicationId)
    }
    
    // Statistics
    suspend fun getTotalDoseCount(scheduledDoseId: String): Int {
        return doseTrackingDao.getTotalDoseCount(scheduledDoseId)
    }
    
    suspend fun getDoseCountByStatus(scheduledDoseId: String, status: DoseStatus): Int {
        return doseTrackingDao.getDoseCountByStatus(scheduledDoseId, status)
    }
    
    suspend fun getTakenDoseCount(scheduledDoseId: String): Int {
        return doseTrackingDao.getTakenDoseCount(scheduledDoseId)
    }
    
    suspend fun getAdherenceStats(scheduledDoseId: String): AdherenceStats {
        val totalDoses = getTotalDoseCount(scheduledDoseId)
        val takenDoses = getDoseCountByStatus(scheduledDoseId, DoseStatus.TAKEN)
        val missedDoses = getDoseCountByStatus(scheduledDoseId, DoseStatus.MISSED)
        val skippedDoses = getDoseCountByStatus(scheduledDoseId, DoseStatus.SKIPPED)
        val lateDoses = getDoseCountByStatus(scheduledDoseId, DoseStatus.LATE)
        
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
}

data class AdherenceStats(
    val totalDoses: Int = 0,
    val takenDoses: Int = 0,
    val missedDoses: Int = 0,
    val skippedDoses: Int = 0,
    val lateDoses: Int = 0,
    val adherenceRate: Int = 0
)
