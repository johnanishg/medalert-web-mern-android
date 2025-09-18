package com.medalert.patient.data.repository

import com.medalert.patient.data.api.ApiService
import com.medalert.patient.data.model.*
import com.medalert.patient.data.local.UserPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PatientRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    
    // Authentication
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            android.util.Log.d("PatientRepository", "Attempting login for email: $email")
            val response = apiService.login(LoginRequest(email, password, "patient"))
            android.util.Log.d("PatientRepository", "Login response code: ${response.code()}")
            android.util.Log.d("PatientRepository", "Login response body: ${response.body()}")
            
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                android.util.Log.d("PatientRepository", "Login successful, saving token")
                // Save token and user data
                userPreferences.saveAuthToken(authResponse.token)
                userPreferences.saveUserData(authResponse.user)
                Result.success(authResponse)
            } else {
                android.util.Log.e("PatientRepository", "Login failed: ${response.code()} - ${response.message()}")
                Result.failure(Exception(response.message() ?: "Login failed"))
            }
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Login exception: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    suspend fun register(request: RegisterRequest): Result<AuthResponse> {
        return try {
            val response = apiService.register(request)
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                // Save token and user data
                userPreferences.saveAuthToken(authResponse.token)
                userPreferences.saveUserData(authResponse.user)
                Result.success(authResponse)
            } else {
                Result.failure(Exception(response.message() ?: "Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        userPreferences.clearAuthData()
    }
    
    // Patient Profile
    suspend fun getPatientProfile(): Result<Patient> {
        return try {
            val user = userPreferences.getUserData().first()
            if (user != null) {
                val patientId = user.getPatientId()
                android.util.Log.d("PatientRepository", "Fetching patient profile for user: $patientId")
                android.util.Log.d("PatientRepository", "User data: _id=${user._id}, id=${user.id}, userId=${user.userId}")
                
                val response = apiService.getPatientProfile(patientId)
                android.util.Log.d("PatientRepository", "Profile response code: ${response.code()}")
                
                if (response.isSuccessful && response.body()?.patient != null) {
                    val patient = response.body()!!.patient!!
                    android.util.Log.d("PatientRepository", "Profile fetched successfully. Medicines count: ${patient.currentMedications.size}")
                    android.util.Log.d("PatientRepository", "Profile data: ${patient}")
                    android.util.Log.d("PatientRepository", "Patient ID info: _id=${patient._id}, id=${patient.id}, userId=${patient.userId}")
                    android.util.Log.d("PatientRepository", "User-friendly ID: ${patient.getUserFriendlyId()}")
                    
                    // Validate and log medicine data
                    patient.currentMedications.forEachIndexed { index, medicine ->
                        android.util.Log.d("PatientRepository", "Medicine $index: name=${medicine.name}, dosage=${medicine.dosage}, frequency=${medicine.frequency}")
                    }
                    
                    Result.success(patient)
                } else {
                    android.util.Log.e("PatientRepository", "Profile fetch failed: ${response.code()} - ${response.message()}")
                    Result.failure(Exception(response.message() ?: "Failed to get profile"))
                }
            } else {
                android.util.Log.e("PatientRepository", "User not logged in")
                Result.failure(Exception("User not logged in"))
            }
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Profile fetch exception: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    suspend fun updatePatientProfile(patient: Patient): Result<Patient> {
        return try {
            val patientId = patient.getPatientId()
            val response = apiService.updatePatientProfile(patientId, patient)
            if (response.isSuccessful && response.body()?.data != null) {
                // Update local user data
                userPreferences.saveUserData(response.body()!!.data!!)
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to update profile"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Medicine Management
    suspend fun updateMedicine(medicineIndex: Int, updateData: Map<String, Any>): Result<Medication> {
        return try {
            val response = apiService.updateMedicine(medicineIndex, updateData)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to update medicine"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun addMedicine(medication: Medication): Result<Medication> {
        return try {
            val response = apiService.addMedicine(medication)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to add medicine"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
           suspend fun deleteMedicine(medicineIndex: Int): Result<Boolean> {
               return try {
                   val response = apiService.deleteMedicine(medicineIndex)
                   if (response.isSuccessful) {
                       Result.success(true)
                   } else {
                       Result.failure(Exception(response.message() ?: "Failed to delete medicine"))
                   }
               } catch (e: Exception) {
                   Result.failure(e)
               }
           }

           // Medicine Timing Management
           suspend fun updateMedicineTiming(
               medicineIndex: Int,
               timing: List<String>? = null,
               customSchedule: List<ScheduleEntry>? = null,
               startDate: String? = null,
               endDate: String? = null,
               totalTablets: Int? = null,
               remainingTablets: Int? = null
           ): Result<Medication> {
               return try {
                   val timingData = mutableMapOf<String, Any>()
                   
                   timing?.let { timingData["timing"] = it }
                   customSchedule?.let { timingData["customSchedule"] = it }
                   startDate?.let { timingData["startDate"] = it }
                   endDate?.let { timingData["endDate"] = it }
                   totalTablets?.let { timingData["totalTablets"] = it }
                   remainingTablets?.let { timingData["remainingTablets"] = it }
                   
                   android.util.Log.d("PatientRepository", "Updating medicine timing for index $medicineIndex with data: $timingData")
                   
                   val response = apiService.updateMedicineTiming(medicineIndex, timingData)
                   android.util.Log.d("PatientRepository", "API response: isSuccessful=${response.isSuccessful}, code=${response.code()}, message=${response.message()}")
                   
                   if (response.isSuccessful && response.body()?.data != null) {
                       val updatedMedication = response.body()!!.data!!
                       android.util.Log.d("PatientRepository", "Successfully updated medication: ${updatedMedication.name}, timing: ${updatedMedication.timing}")
                       Result.success(updatedMedication)
                   } else {
                       android.util.Log.e("PatientRepository", "API call failed: ${response.message()}")
                       Result.failure(Exception(response.message() ?: "Failed to update medicine timing"))
                   }
               } catch (e: Exception) {
                   android.util.Log.e("PatientRepository", "Exception during timing update: ${e.message}", e)
                   Result.failure(e)
               }
           }
    
    // Medicine Notifications
    suspend fun setMedicineTimings(request: SetTimingsRequest): Result<MedicineNotification> {
        return try {
            val response = apiService.setMedicineTimings(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to set timings"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMedicineNotifications(): Result<List<MedicineNotification>> {
        return try {
            val user = userPreferences.getUserData().first()
            if (user != null) {
                val patientId = user.getPatientId()
                val response = apiService.getMedicineNotifications(patientId)
                if (response.isSuccessful && response.body()?.data != null) {
                    Result.success(response.body()!!.data!!)
                } else {
                    Result.failure(Exception(response.message() ?: "Failed to get notifications"))
                }
            } else {
                Result.failure(Exception("User not logged in"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Adherence Tracking
    suspend fun recordAdherence(
        medicineIndex: Int,
        taken: Boolean,
        notes: String = ""
    ): Result<Boolean> {
        return try {
            val user = userPreferences.getUserData().first()
            if (user != null) {
                val patientId = user.getPatientId()
                val adherenceData = mapOf(
                    "taken" to taken,
                    "timestamp" to System.currentTimeMillis(),
                    "notes" to notes
                )
                val response = apiService.recordAdherence(medicineIndex, adherenceData)
                if (response.isSuccessful) {
                    Result.success(true)
                } else {
                    Result.failure(Exception(response.message() ?: "Failed to record adherence"))
                }
            } else {
                Result.failure(Exception("User not logged in"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Caretaker Management
    suspend fun getAvailableCaretakers(search: String? = null): Result<List<Caretaker>> {
        return try {
            val response = apiService.getAvailableCaretakers(search)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to get caretakers"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun assignCaretaker(caretakerUserId: String): Result<Boolean> {
        return try {
            val request = mapOf("caretakerUserId" to caretakerUserId)
            val response = apiService.assignCaretaker(request)
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to assign caretaker"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCaretakerRequests(): Result<List<CaretakerApproval>> {
        return try {
            val response = apiService.getCaretakerRequests()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to get caretaker requests"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // User Data
    fun getUserData(): Flow<Patient?> = userPreferences.getUserData()
    fun getAuthToken(): Flow<String?> = userPreferences.getAuthToken()
    
    suspend fun isLoggedIn(): Boolean {
        return userPreferences.getAuthToken().first() != null
    }
    
    // Comprehensive data fetching (similar to web frontend)
    suspend fun fetchAllPatientData(): Result<PatientDataBundle> {
        return try {
            val user = userPreferences.getUserData().first()
            if (user == null) {
                return Result.failure(Exception("User not logged in"))
            }
            
            android.util.Log.d("PatientRepository", "Fetching all patient data for user: ${user.getPatientId()}")
            
            // Fetch patient profile with medicines
            val patientResult = getPatientProfile()
            if (patientResult.isFailure) {
                return Result.failure(patientResult.exceptionOrNull() ?: Exception("Failed to fetch patient profile"))
            }
            
            val patient = patientResult.getOrThrow()
            
            // Fetch medicine notifications
            val notificationsResult = getMedicineNotifications()
            val notifications = if (notificationsResult.isSuccess) {
                notificationsResult.getOrThrow()
            } else {
                android.util.Log.w("PatientRepository", "Failed to fetch notifications: ${notificationsResult.exceptionOrNull()?.message}")
                emptyList()
            }
            
            // Fetch caretaker requests
            val caretakerRequestsResult = getCaretakerRequests()
            val caretakerRequests = if (caretakerRequestsResult.isSuccess) {
                caretakerRequestsResult.getOrThrow()
            } else {
                android.util.Log.w("PatientRepository", "Failed to fetch caretaker requests: ${caretakerRequestsResult.exceptionOrNull()?.message}")
                emptyList()
            }
            
            val dataBundle = PatientDataBundle(
                patient = patient,
                medicines = patient.currentMedications,
                notifications = notifications,
                caretakerRequests = caretakerRequests,
                visits = patient.visits
            )
            
            android.util.Log.d("PatientRepository", "All data fetched successfully. Medicines: ${dataBundle.medicines.size}, Notifications: ${dataBundle.notifications.size}")
            Result.success(dataBundle)
            
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Failed to fetch all patient data: ${e.message}", e)
            Result.failure(e)
        }
    }
}

// Data bundle to hold all patient-related data
data class PatientDataBundle(
    val patient: Patient,
    val medicines: List<Medication>,
    val notifications: List<MedicineNotification>,
    val caretakerRequests: List<CaretakerApproval>,
    val visits: List<Visit>
)