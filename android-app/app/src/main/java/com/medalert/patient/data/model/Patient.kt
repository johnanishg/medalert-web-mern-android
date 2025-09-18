package com.medalert.patient.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

@Parcelize
data class Patient(
    val _id: String = "",
    val id: String = "", // For compatibility with backend response
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val dateOfBirth: String = "",
    val age: Int = 0,
    val gender: String = "",
    val phoneNumber: String = "",
    val emergencyContact: EmergencyContact? = null,
    val medicalHistory: List<MedicalCondition> = emptyList(),
    val allergies: List<String> = emptyList(),
    val currentMedications: List<Medication> = emptyList(),
    val visits: List<Visit> = emptyList(),
    val selectedCaretaker: SelectedCaretaker? = null,
    val caretakerApprovals: List<CaretakerApproval> = emptyList(),
    val isActive: Boolean = true,
    val createdAt: String = "",
    val updatedAt: String = ""
) : Parcelable {
    // Helper function to get the correct ID
    fun getPatientId(): String {
        return if (_id.isNotEmpty()) _id else id
    }
    
    // Helper function to get the user-friendly patient ID
    fun getUserFriendlyId(): String {
        return if (userId.isNotEmpty()) userId else getPatientId()
    }
    
    // Helper function to get display ID (user-friendly ID for UI)
    fun getDisplayId(): String {
        return if (userId.isNotEmpty()) {
            "Patient ID: $userId"
        } else {
            "Patient ID: ${getPatientId()}"
        }
    }
}

@Parcelize
data class EmergencyContact(
    val name: String = "",
    val phone: String = "",
    val relationship: String = ""
) : Parcelable

@Parcelize
data class MedicalCondition(
    val condition: String = "",
    val diagnosisDate: String = "",
    val status: String = ""
) : Parcelable

@Parcelize
data class Medication(
    val _id: String = "",
    val name: String = "",
    val dosage: String = "",
    val frequency: String = "",
    val duration: String = "",
    val instructions: String = "",
    val timing: List<String> = emptyList(),
    val foodTiming: String = "",
    val prescribedBy: String = "",
    val prescribedDate: String = "",
    val prescriptionId: String = "",
    val scheduleExplanation: String = "",
    val smartScheduled: Boolean = false,
    val adherence: List<AdherenceRecord> = emptyList(),
    val lastTaken: String = "",
    val updatedAt: String = "",
    val updatedBy: String = "",
    // Enhanced scheduling fields
    val startDate: String = "",
    val endDate: String = "",
    val totalTablets: Int = 0,
    val remainingTablets: Int = 0,
    val isActive: Boolean = true,
    val customSchedule: List<ScheduleEntry> = emptyList(),
    // Detailed timing and dose tracking
    val scheduledDoses: List<ScheduledDose> = emptyList(),
    val doseRecords: List<DoseRecord> = emptyList()
) : Parcelable

@Parcelize
data class AdherenceRecord(
    val timestamp: String = "",
    val taken: Boolean = false,
    val notes: String = "",
    val recordedBy: String = ""
) : Parcelable

@Parcelize
data class ScheduleEntry(
    val date: String = "", // YYYY-MM-DD format
    val time: String = "", // HH:MM format
    val label: String = "", // Morning, Afternoon, Evening, Night, Custom
    val isActive: Boolean = true,
    val tabletCount: Int = 1,
    val notes: String = ""
) : Parcelable

@Parcelize
data class Visit(
    val visitDate: String = "",
    val visitType: String = "",
    val doctorId: String = "",
    val doctorName: String = "",
    val diagnosis: String = "",
    val notes: String = "",
    val medicines: List<PrescribedMedicine> = emptyList(),
    val followUpDate: String = "",
    val followUpRequired: Boolean = false,
    val createdAt: String = ""
) : Parcelable

@Parcelize
data class PrescribedMedicine(
    val name: String = "",
    val dosage: String = "",
    val frequency: String = "",
    val duration: String = "",
    val instructions: String = ""
) : Parcelable

@Parcelize
data class SelectedCaretaker(
    val caretakerId: String = "",
    val caretakerUserId: String = "",
    val caretakerName: String = "",
    val caretakerEmail: String = "",
    val assignedAt: String = ""
) : Parcelable

@Parcelize
data class CaretakerApproval(
    val caretakerId: String = "",
    val status: String = "", // pending, approved, rejected
    val requestedAt: String = "",
    val approvedAt: String = "",
    val rejectedAt: String = ""
) : Parcelable

@Parcelize
data class ScheduledDose(
    val id: String = "",
    val time: String = "", // HH:MM format
    val label: String = "", // Morning, Afternoon, Evening, Night, Custom
    val dosage: String = "",
    val isActive: Boolean = true,
    val daysOfWeek: List<Int> = emptyList(), // 0=Sunday, 1=Monday, etc.
    val startDate: String = "",
    val endDate: String = "",
    val notes: String = ""
) : Parcelable

@Parcelize
data class DoseRecord(
    val id: String = "",
    val scheduledDoseId: String = "",
    val scheduledTime: String = "", // HH:MM format
    val scheduledDate: String = "", // YYYY-MM-DD format
    val actualTime: String = "", // HH:MM format when actually taken
    val actualDate: String = "", // YYYY-MM-DD format when actually taken
    val status: DoseStatus = DoseStatus.PENDING,
    val notes: String = "",
    val recordedAt: String = "",
    val recordedBy: String = "patient" // patient, caretaker, system
) : Parcelable

enum class DoseStatus {
    PENDING,    // Not yet taken
    TAKEN,      // Taken on time or within grace period
    MISSED,     // Not taken within grace period
    SKIPPED,    // Intentionally skipped by user
    LATE        // Taken but late
}