package com.medalert.patient.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class Caretaker(
    val _id: String = "",
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val experience: Int = 0,
    val specializations: List<String> = emptyList(),
    val hourlyRate: Double = 0.0,
    val certifications: List<String> = emptyList(),
    val isActive: Boolean = true
) : Parcelable