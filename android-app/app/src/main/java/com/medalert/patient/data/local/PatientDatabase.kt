package com.medalert.patient.data.local

import android.content.Context
import androidx.room.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.medalert.patient.data.model.*

@Database(
    entities = [
        PatientEntity::class,
        MedicationEntity::class,
        MedicineNotificationEntity::class,
        VisitEntity::class,
        CaretakerApprovalEntity::class,
        AdherenceRecordEntity::class,
        ScheduleEntryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class PatientDatabase : RoomDatabase() {
    abstract fun patientDao(): PatientDao
    abstract fun medicationDao(): MedicationDao
    abstract fun medicineNotificationDao(): MedicineNotificationDao
    abstract fun visitDao(): VisitDao
    abstract fun caretakerApprovalDao(): CaretakerApprovalDao
}

// ============ ENTITIES ============

@Entity(tableName = "patients")
data class PatientEntity(
    @PrimaryKey val id: String,
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val dateOfBirth: String = "",
    val age: Int = 0,
    val gender: String = "",
    val phoneNumber: String = "",
    val emergencyContactName: String = "",
    val emergencyContactPhone: String = "",
    val emergencyContactRelationship: String = "",
    val medicalHistoryJson: String = "[]",
    val allergiesJson: String = "[]",
    val selectedCaretakerId: String = "",
    val selectedCaretakerUserId: String = "",
    val selectedCaretakerName: String = "",
    val selectedCaretakerEmail: String = "",
    val selectedCaretakerAssignedAt: String = "",
    val isActive: Boolean = true,
    val createdAt: String = "",
    val updatedAt: String = ""
) {
    fun toPatient(): Patient {
        val gson = Gson()
        val medicalHistoryType = object : TypeToken<List<MedicalCondition>>() {}.type
        val allergiesType = object : TypeToken<List<String>>() {}.type
        
        return Patient(
            _id = id,
            id = id,
            userId = userId,
            name = name,
            email = email,
            dateOfBirth = dateOfBirth,
            age = age,
            gender = gender,
            phoneNumber = phoneNumber,
            emergencyContact = if (emergencyContactName.isNotEmpty()) {
                EmergencyContact(
                    name = emergencyContactName,
                    phone = emergencyContactPhone,
                    relationship = emergencyContactRelationship
                )
            } else null,
            medicalHistory = gson.fromJson(medicalHistoryJson, medicalHistoryType) ?: emptyList(),
            allergies = gson.fromJson(allergiesJson, allergiesType) ?: emptyList(),
            currentMedications = emptyList(), // Will be loaded separately
            visits = emptyList(), // Will be loaded separately
            selectedCaretaker = if (selectedCaretakerId.isNotEmpty()) {
                SelectedCaretaker(
                    caretakerId = selectedCaretakerId,
                    caretakerUserId = selectedCaretakerUserId,
                    caretakerName = selectedCaretakerName,
                    caretakerEmail = selectedCaretakerEmail,
                    assignedAt = selectedCaretakerAssignedAt
                )
            } else null,
            caretakerApprovals = emptyList(), // Will be loaded separately
            isActive = isActive,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    companion object {
        fun fromPatient(patient: Patient): PatientEntity {
            val gson = Gson()
            
            return PatientEntity(
                id = patient._id.ifEmpty { patient.id },
                userId = patient.userId,
                name = patient.name,
                email = patient.email,
                dateOfBirth = patient.dateOfBirth,
                age = patient.age,
                gender = patient.gender,
                phoneNumber = patient.phoneNumber,
                emergencyContactName = patient.emergencyContact?.name ?: "",
                emergencyContactPhone = patient.emergencyContact?.phone ?: "",
                emergencyContactRelationship = patient.emergencyContact?.relationship ?: "",
                medicalHistoryJson = gson.toJson(patient.medicalHistory),
                allergiesJson = gson.toJson(patient.allergies),
                selectedCaretakerId = patient.selectedCaretaker?.caretakerId ?: "",
                selectedCaretakerUserId = patient.selectedCaretaker?.caretakerUserId ?: "",
                selectedCaretakerName = patient.selectedCaretaker?.caretakerName ?: "",
                selectedCaretakerEmail = patient.selectedCaretaker?.caretakerEmail ?: "",
                selectedCaretakerAssignedAt = patient.selectedCaretaker?.assignedAt ?: "",
                isActive = patient.isActive,
                createdAt = patient.createdAt,
                updatedAt = patient.updatedAt
            )
        }
    }
}

@Entity(tableName = "medications")
data class MedicationEntity(
    @PrimaryKey val id: String,
    val patientId: String, // Foreign key to patient
    val name: String = "",
    val dosage: String = "",
    val frequency: String = "",
    val duration: String = "",
    val instructions: String = "",
    val timingJson: String = "[]",
    val foodTiming: String = "",
    val prescribedBy: String = "",
    val prescribedDate: String = "",
    val prescriptionId: String = "",
    val scheduleExplanation: String = "",
    val smartScheduled: Boolean = false,
    val lastTaken: String = "",
    val updatedAt: String = "",
    val updatedBy: String = "",
    val startDate: String = "",
    val endDate: String = "",
    val totalTablets: Int = 0,
    val remainingTablets: Int = 0,
    val isActive: Boolean = true,
    val customScheduleJson: String = "[]",
    val scheduledDosesJson: String = "[]",
    val doseRecordsJson: String = "[]"
) {
    fun toMedication(): Medication {
        val gson = Gson()
        val timingType = object : TypeToken<List<String>>() {}.type
        val customScheduleType = object : TypeToken<List<ScheduleEntry>>() {}.type
        val scheduledDosesType = object : TypeToken<List<ScheduledDose>>() {}.type
        val doseRecordsType = object : TypeToken<List<DoseRecord>>() {}.type
        val adherenceType = object : TypeToken<List<AdherenceRecord>>() {}.type
        
        return Medication(
            _id = id,
            name = name,
            dosage = dosage,
            frequency = frequency,
            duration = duration,
            instructions = instructions,
            timing = gson.fromJson(timingJson, timingType) ?: emptyList(),
            foodTiming = foodTiming,
            prescribedBy = prescribedBy,
            prescribedDate = prescribedDate,
            prescriptionId = prescriptionId,
            scheduleExplanation = scheduleExplanation,
            smartScheduled = smartScheduled,
            adherence = emptyList(), // Not stored in DB
            lastTaken = lastTaken,
            updatedAt = updatedAt,
            updatedBy = updatedBy,
            startDate = startDate,
            endDate = endDate,
            totalTablets = totalTablets,
            remainingTablets = remainingTablets,
            isActive = isActive,
            customSchedule = gson.fromJson(customScheduleJson, customScheduleType) ?: emptyList(),
            scheduledDoses = gson.fromJson(scheduledDosesJson, scheduledDosesType) ?: emptyList(),
            doseRecords = gson.fromJson(doseRecordsJson, doseRecordsType) ?: emptyList()
        )
    }
    
    companion object {
        fun fromMedication(medication: Medication, patientId: String): MedicationEntity {
            val gson = Gson()
            
            return MedicationEntity(
                id = medication._id.ifEmpty { medication.name + patientId },
                patientId = patientId,
                name = medication.name,
                dosage = medication.dosage,
                frequency = medication.frequency,
                duration = medication.duration,
                instructions = medication.instructions,
                timingJson = gson.toJson(medication.timing),
                foodTiming = medication.foodTiming,
                prescribedBy = medication.prescribedBy,
                prescribedDate = medication.prescribedDate,
                prescriptionId = medication.prescriptionId,
                scheduleExplanation = medication.scheduleExplanation,
                smartScheduled = medication.smartScheduled,
                lastTaken = medication.lastTaken,
                updatedAt = medication.updatedAt,
                updatedBy = medication.updatedBy,
                startDate = medication.startDate,
                endDate = medication.endDate,
                totalTablets = medication.totalTablets,
                remainingTablets = medication.remainingTablets,
                isActive = medication.isActive,
                customScheduleJson = gson.toJson(medication.customSchedule),
                scheduledDosesJson = gson.toJson(medication.scheduledDoses),
                doseRecordsJson = gson.toJson(medication.doseRecords)
            )
        }
    }
}

@Entity(tableName = "medicine_notifications")
data class MedicineNotificationEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val patientName: String = "",
    val patientPhone: String = "",
    val medicineName: String = "",
    val dosage: String = "",
    val instructions: String = "",
    val foodTiming: String = "",
    val notificationTimesJson: String = "[]",
    val frequency: String = "",
    val duration: String = "",
    val isActive: Boolean = true,
    val startDate: String = "",
    val endDate: String = "",
    val prescriptionId: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
) {
    fun toMedicineNotification(): MedicineNotification {
        val gson = Gson()
        val notificationTimesType = object : TypeToken<List<NotificationTime>>() {}.type
        
        return MedicineNotification(
            _id = id,
            patientId = patientId,
            patientName = patientName,
            patientPhone = patientPhone,
            medicineName = medicineName,
            dosage = dosage,
            instructions = instructions,
            foodTiming = foodTiming,
            notificationTimes = gson.fromJson(notificationTimesJson, notificationTimesType) ?: emptyList(),
            frequency = frequency,
            duration = duration,
            isActive = isActive,
            startDate = startDate,
            endDate = endDate,
            prescriptionId = prescriptionId,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    companion object {
        fun fromMedicineNotification(notification: MedicineNotification): MedicineNotificationEntity {
            val gson = Gson()
            
            return MedicineNotificationEntity(
                id = notification._id,
                patientId = notification.patientId,
                patientName = notification.patientName,
                patientPhone = notification.patientPhone,
                medicineName = notification.medicineName,
                dosage = notification.dosage,
                instructions = notification.instructions,
                foodTiming = notification.foodTiming,
                notificationTimesJson = gson.toJson(notification.notificationTimes),
                frequency = notification.frequency,
                duration = notification.duration,
                isActive = notification.isActive,
                startDate = notification.startDate,
                endDate = notification.endDate,
                prescriptionId = notification.prescriptionId,
                createdAt = notification.createdAt,
                updatedAt = notification.updatedAt
            )
        }
    }
}

@Entity(tableName = "visits")
data class VisitEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val visitDate: String = "",
    val visitType: String = "",
    val doctorId: String = "",
    val doctorName: String = "",
    val diagnosis: String = "",
    val notes: String = "",
    val medicinesJson: String = "[]",
    val followUpDate: String = "",
    val followUpRequired: Boolean = false,
    val createdAt: String = ""
) {
    fun toVisit(): Visit {
        val gson = Gson()
        val medicinesType = object : TypeToken<List<PrescribedMedicine>>() {}.type
        
        return Visit(
            visitDate = visitDate,
            visitType = visitType,
            doctorId = doctorId,
            doctorName = doctorName,
            diagnosis = diagnosis,
            notes = notes,
            medicines = gson.fromJson(medicinesJson, medicinesType) ?: emptyList(),
            followUpDate = followUpDate,
            followUpRequired = followUpRequired,
            createdAt = createdAt
        )
    }
    
    companion object {
        fun fromVisit(visit: Visit, patientId: String): VisitEntity {
            val gson = Gson()
            
            return VisitEntity(
                id = "${patientId}_${visit.createdAt}_${visit.doctorId}",
                patientId = patientId,
                visitDate = visit.visitDate,
                visitType = visit.visitType,
                doctorId = visit.doctorId,
                doctorName = visit.doctorName,
                diagnosis = visit.diagnosis,
                notes = visit.notes,
                medicinesJson = gson.toJson(visit.medicines),
                followUpDate = visit.followUpDate,
                followUpRequired = visit.followUpRequired,
                createdAt = visit.createdAt
            )
        }
    }
}

@Entity(tableName = "caretaker_approvals")
data class CaretakerApprovalEntity(
    @PrimaryKey val id: String,
    val patientId: String,
    val caretakerId: String = "",
    val status: String = "",
    val requestedAt: String = "",
    val approvedAt: String = "",
    val rejectedAt: String = ""
) {
    fun toCaretakerApproval(): CaretakerApproval {
        return CaretakerApproval(
            caretakerId = caretakerId,
            status = status,
            requestedAt = requestedAt,
            approvedAt = approvedAt,
            rejectedAt = rejectedAt
        )
    }
    
    companion object {
        fun fromCaretakerApproval(approval: CaretakerApproval, patientId: String): CaretakerApprovalEntity {
            return CaretakerApprovalEntity(
                id = "${patientId}_${approval.caretakerId}_${approval.requestedAt}",
                patientId = patientId,
                caretakerId = approval.caretakerId,
                status = approval.status,
                requestedAt = approval.requestedAt,
                approvedAt = approval.approvedAt,
                rejectedAt = approval.rejectedAt
            )
        }
    }
}

@Entity(tableName = "adherence_records")
data class AdherenceRecordEntity(
    @PrimaryKey val id: String,
    val medicationId: String,
    val timestamp: String = "",
    val taken: Boolean = false,
    val notes: String = "",
    val recordedBy: String = ""
) {
    fun toAdherenceRecord(): AdherenceRecord {
        return AdherenceRecord(
            timestamp = timestamp,
            taken = taken,
            notes = notes,
            recordedBy = recordedBy
        )
    }
    
    companion object {
        fun fromAdherenceRecord(record: AdherenceRecord, medicationId: String): AdherenceRecordEntity {
            return AdherenceRecordEntity(
                id = "${medicationId}_${record.timestamp}",
                medicationId = medicationId,
                timestamp = record.timestamp,
                taken = record.taken,
                notes = record.notes,
                recordedBy = record.recordedBy
            )
        }
    }
}

@Entity(tableName = "schedule_entries")
data class ScheduleEntryEntity(
    @PrimaryKey val id: String,
    val medicationId: String,
    val date: String = "",
    val time: String = "",
    val label: String = "",
    val isActive: Boolean = true,
    val tabletCount: Int = 1,
    val notes: String = ""
) {
    fun toScheduleEntry(): ScheduleEntry {
        return ScheduleEntry(
            date = date,
            time = time,
            label = label,
            isActive = isActive,
            tabletCount = tabletCount,
            notes = notes
        )
    }
    
    companion object {
        fun fromScheduleEntry(entry: ScheduleEntry, medicationId: String): ScheduleEntryEntity {
            return ScheduleEntryEntity(
                id = "${medicationId}_${entry.date}_${entry.time}",
                medicationId = medicationId,
                date = entry.date,
                time = entry.time,
                label = entry.label,
                isActive = entry.isActive,
                tabletCount = entry.tabletCount,
                notes = entry.notes
            )
        }
    }
}

// ============ DAOs ============

@Dao
interface PatientDao {
    @Query("SELECT * FROM patients WHERE id = :id")
    suspend fun getPatient(id: String): PatientEntity?
    
    @Query("SELECT * FROM patients LIMIT 1")
    suspend fun getCurrentPatient(): PatientEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPatient(patient: PatientEntity)
    
    @Update
    suspend fun updatePatient(patient: PatientEntity)
    
    @Query("DELETE FROM patients")
    suspend fun deleteAllPatients()
}

@Dao
interface MedicationDao {
    @Query("SELECT * FROM medications WHERE patientId = :patientId")
    suspend fun getMedications(patientId: String): List<MedicationEntity>
    
    @Query("SELECT * FROM medications WHERE patientId = :patientId AND isActive = 1")
    suspend fun getActiveMedications(patientId: String): List<MedicationEntity>
    
    @Query("SELECT * FROM medications WHERE id = :id")
    suspend fun getMedication(id: String): MedicationEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedication(medication: MedicationEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedications(medications: List<MedicationEntity>)
    
    @Update
    suspend fun updateMedication(medication: MedicationEntity)
    
    @Query("DELETE FROM medications WHERE patientId = :patientId")
    suspend fun deleteMedicationsForPatient(patientId: String)
    
    @Query("DELETE FROM medications WHERE id = :id")
    suspend fun deleteMedication(id: String)
}

@Dao
interface MedicineNotificationDao {
    @Query("SELECT * FROM medicine_notifications WHERE patientId = :patientId")
    suspend fun getNotifications(patientId: String): List<MedicineNotificationEntity>
    
    @Query("SELECT * FROM medicine_notifications WHERE patientId = :patientId AND isActive = 1")
    suspend fun getActiveNotifications(patientId: String): List<MedicineNotificationEntity>
    
    @Query("SELECT * FROM medicine_notifications WHERE id = :id")
    suspend fun getNotification(id: String): MedicineNotificationEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: MedicineNotificationEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotifications(notifications: List<MedicineNotificationEntity>)
    
    @Update
    suspend fun updateNotification(notification: MedicineNotificationEntity)
    
    @Query("DELETE FROM medicine_notifications WHERE patientId = :patientId")
    suspend fun deleteNotificationsForPatient(patientId: String)
    
    @Query("DELETE FROM medicine_notifications WHERE id = :id")
    suspend fun deleteNotification(id: String)
}

@Dao
interface VisitDao {
    @Query("SELECT * FROM visits WHERE patientId = :patientId ORDER BY visitDate DESC")
    suspend fun getVisits(patientId: String): List<VisitEntity>
    
    @Query("SELECT * FROM visits WHERE id = :id")
    suspend fun getVisit(id: String): VisitEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVisit(visit: VisitEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVisits(visits: List<VisitEntity>)
    
    @Query("DELETE FROM visits WHERE patientId = :patientId")
    suspend fun deleteVisitsForPatient(patientId: String)
}

@Dao
interface CaretakerApprovalDao {
    @Query("SELECT * FROM caretaker_approvals WHERE patientId = :patientId")
    suspend fun getApprovals(patientId: String): List<CaretakerApprovalEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApproval(approval: CaretakerApprovalEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApprovals(approvals: List<CaretakerApprovalEntity>)
    
    @Query("DELETE FROM caretaker_approvals WHERE patientId = :patientId")
    suspend fun deleteApprovalsForPatient(patientId: String)
}

// Database instance
object PatientDatabaseProvider {
    private var INSTANCE: PatientDatabase? = null
    
    fun getDatabase(context: Context): PatientDatabase {
        return INSTANCE ?: synchronized(this) {
            val instance = Room.databaseBuilder(
                context.applicationContext,
                PatientDatabase::class.java,
                "patient_database"
            )
                .fallbackToDestructiveMigration()
                .build()
            INSTANCE = instance
            instance
        }
    }
}
