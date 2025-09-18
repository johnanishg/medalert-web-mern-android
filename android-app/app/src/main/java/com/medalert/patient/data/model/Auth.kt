package com.medalert.patient.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import kotlinx.parcelize.RawValue

@Parcelize
data class LoginRequest(
    val email: String,
    val password: String,
    val role: String = "patient"
) : Parcelable

@Parcelize
data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val confirmPassword: String,
    val role: String = "patient",
    val dateOfBirth: String,
    val age: Int,
    val gender: String,
    val phoneNumber: String,
    val selectedCaretakerId: String = ""
) : Parcelable

@Parcelize
data class AuthResponse(
    val message: String,
    val token: String,
    val user: Patient
) : Parcelable

@Parcelize
data class ApiResponse<T>(
    val message: String,
    val data: @RawValue T? = null,
    val error: String? = null
) : Parcelable

@Parcelize
data class PatientProfileResponse(
    val message: String,
    val patient: Patient? = null,
    val error: String? = null
) : Parcelable