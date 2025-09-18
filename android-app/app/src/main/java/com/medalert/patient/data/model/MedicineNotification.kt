package com.medalert.patient.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class MedicineNotification(
    val _id: String = "",
    val patientId: String = "",
    val patientName: String = "",
    val patientPhone: String = "",
    val medicineName: String = "",
    val dosage: String = "",
    val instructions: String = "",
    val foodTiming: String = "",
    val notificationTimes: List<NotificationTime> = emptyList(),
    val frequency: String = "",
    val duration: String = "",
    val isActive: Boolean = true,
    val startDate: String = "",
    val endDate: String = "",
    val prescriptionId: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
) : Parcelable

@Parcelize
data class NotificationTime(
    val time: String = "", // HH:MM format
    val label: String = "Custom",
    val isActive: Boolean = true
) : Parcelable

@Parcelize
data class SetTimingsRequest(
    val medicineName: String,
    val dosage: String,
    val instructions: String = "",
    val foodTiming: String = "",
    val notificationTimes: List<NotificationTime>,
    val frequency: String = "",
    val duration: String = "",
    val prescriptionId: String = ""
) : Parcelable