package com.medalert.patient.data.api

import com.medalert.patient.data.model.*
import kotlinx.parcelize.RawValue
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // Authentication
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    // Patient Profile
    @GET("patients/profile/{id}")
    suspend fun getPatientProfile(@Path("id") id: String): Response<PatientProfileResponse>
    
    @PUT("patients/profile/{id}")
    suspend fun updatePatientProfile(
        @Path("id") id: String,
        @Body patient: Patient
    ): Response<ApiResponse<Patient>>
    
    // Medicine Management
    @POST("patients/medicines")
    suspend fun addMedicine(@Body medication: Medication): Response<ApiResponse<Medication>>
    
    @PUT("patients/medicines/{medicineIndex}")
    suspend fun updateMedicine(
        @Path("medicineIndex") medicineIndex: Int,
        @Body updateData: Map<String, Any>
    ): Response<ApiResponse<Medication>>
    
           @DELETE("patients/medicines/{medicineIndex}")
           suspend fun deleteMedicine(
               @Path("medicineIndex") medicineIndex: Int
           ): Response<ApiResponse<Any>>

           // Medicine Timing Management
           @PUT("patients/medicines/{medicineIndex}/timing")
           suspend fun updateMedicineTiming(
               @Path("medicineIndex") medicineIndex: Int,
               @Body timingData: Map<String, @RawValue Any>
           ): Response<ApiResponse<Medication>>
    
    // Medicine Notifications
    @POST("medicine-notifications/set-timings")
    suspend fun setMedicineTimings(@Body request: SetTimingsRequest): Response<ApiResponse<MedicineNotification>>
    
    @GET("medicine-notifications/patient/{patientId}")
    suspend fun getMedicineNotifications(@Path("patientId") patientId: String): Response<ApiResponse<List<MedicineNotification>>>
    
    @PUT("medicine-notifications/{notificationId}/timings")
    suspend fun updateNotificationTimings(
        @Path("notificationId") notificationId: String,
        @Body timings: Map<String, List<NotificationTime>>
    ): Response<ApiResponse<MedicineNotification>>
    
    @PUT("medicine-notifications/{notificationId}/toggle")
    suspend fun toggleNotification(
        @Path("notificationId") notificationId: String,
        @Body active: Map<String, Boolean>
    ): Response<ApiResponse<MedicineNotification>>
    
    @DELETE("medicine-notifications/{notificationId}")
    suspend fun deleteNotification(@Path("notificationId") notificationId: String): Response<ApiResponse<Any>>
    
    // Adherence Tracking
    @POST("adherence/record/{medicineIndex}")
    suspend fun recordAdherence(
        @Path("medicineIndex") medicineIndex: Int,
        @Body adherenceData: Map<String, Any>
    ): Response<ApiResponse<Any>>
    
    @GET("adherence/history/{medicineIndex}")
    suspend fun getAdherenceHistory(
        @Path("medicineIndex") medicineIndex: Int
    ): Response<ApiResponse<Any>>
    
    // Caretaker Management
    @GET("patients/caretakers")
    suspend fun getAvailableCaretakers(@Query("search") search: String? = null): Response<ApiResponse<List<Caretaker>>>
    
    @POST("patients/assign-caretaker")
    suspend fun assignCaretaker(@Body request: Map<String, String>): Response<ApiResponse<Any>>
    
    @DELETE("patients/remove-caretaker")
    suspend fun removeCaretaker(): Response<ApiResponse<Any>>
    
    @GET("patients/caretaker-requests")
    suspend fun getCaretakerRequests(): Response<ApiResponse<List<CaretakerApproval>>>
    
    @PUT("patients/caretaker-approval/{caretakerId}")
    suspend fun updateCaretakerApproval(
        @Path("caretakerId") caretakerId: String,
        @Body status: Map<String, String>
    ): Response<ApiResponse<Patient>>
}