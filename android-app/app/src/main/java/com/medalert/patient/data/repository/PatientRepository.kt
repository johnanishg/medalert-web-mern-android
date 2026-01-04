package com.medalert.patient.data.repository

import com.medalert.patient.data.api.ApiService
import com.medalert.patient.data.model.*
import com.medalert.patient.data.local.UserPreferences
import com.medalert.patient.data.local.PatientDao
import com.medalert.patient.data.local.MedicationDao
import com.medalert.patient.data.local.MedicineNotificationDao
import com.medalert.patient.data.local.VisitDao
import com.medalert.patient.data.local.CaretakerApprovalDao
import com.medalert.patient.data.local.PatientEntity
import com.medalert.patient.data.local.MedicationEntity
import com.medalert.patient.data.local.MedicineNotificationEntity
import com.medalert.patient.data.local.VisitEntity
import com.medalert.patient.data.local.CaretakerApprovalEntity
import com.medalert.patient.util.NetworkConnectivityManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PatientRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences,
    private val patientDao: PatientDao,
    private val medicationDao: MedicationDao,
    private val medicineNotificationDao: MedicineNotificationDao,
    private val visitDao: VisitDao,
    private val caretakerApprovalDao: CaretakerApprovalDao,
    private val networkConnectivityManager: NetworkConnectivityManager
) {
    
    // Authentication
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            android.util.Log.d("PatientRepository", "Attempting login for email: $email")
            
            // Check network connectivity first
            if (!networkConnectivityManager.isConnected()) {
                android.util.Log.e("PatientRepository", "No internet connection")
                return Result.failure(Exception("No internet connection. Please check your network settings."))
            }
            
            val response = apiService.login(LoginRequest(email, password, "patient"))
            android.util.Log.d("PatientRepository", "Login response code: ${response.code()}")
            android.util.Log.d("PatientRepository", "Login response body: ${response.body()}")
            
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                android.util.Log.d("PatientRepository", "Login successful, saving token")
                // Save token and user data
                userPreferences.saveAuthToken(authResponse.token)
                userPreferences.saveUserData(authResponse.user)
                
                // Sync will happen on first fetch
                Result.success(authResponse)
            } else {
                val errorBody = response.errorBody()?.string()
                android.util.Log.e("PatientRepository", "Login failed: ${response.code()} - ${response.message()}")
                android.util.Log.e("PatientRepository", "Error body: $errorBody")
                Result.failure(Exception(errorBody ?: response.message() ?: "Login failed"))
            }
        } catch (e: java.net.UnknownHostException) {
            android.util.Log.e("PatientRepository", "Cannot reach server: ${e.message}", e)
            Result.failure(Exception("Cannot reach server. Please check if ngrok tunnel is active and open the URL in a browser first."))
        } catch (e: java.net.SocketTimeoutException) {
            android.util.Log.e("PatientRepository", "Request timed out: ${e.message}", e)
            Result.failure(Exception("Request timed out. The server may be slow or unreachable. Please try again."))
        } catch (e: java.net.ConnectException) {
            android.util.Log.e("PatientRepository", "Connection refused: ${e.message}", e)
            Result.failure(Exception("Cannot connect to server. Please check if the backend is running and ngrok tunnel is active."))
        } catch (e: java.net.NoRouteToHostException) {
            android.util.Log.e("PatientRepository", "No route to host: ${e.message}", e)
            Result.failure(Exception("No route to host. Please open the ngrok URL in a browser first to bypass the warning page, then try again."))
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Login exception: ${e.javaClass.simpleName} - ${e.message}", e)
            Result.failure(Exception("Login failed: ${e.message ?: e.javaClass.simpleName}"))
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
    
    // Helper function to check connectivity before update operations
    private fun requireConnectivity(): Result<Unit> {
        return if (networkConnectivityManager.isConnected()) {
            Result.success(Unit)
        } else {
            Result.failure(Exception("No internet connection. Please connect to the internet to make updates."))
        }
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
            // Check connectivity first
            requireConnectivity().getOrThrow()
            
            val patientId = patient.getPatientId()
            val response = apiService.updatePatientProfile(patientId, patient)
            if (response.isSuccessful && response.body()?.data != null) {
                // Update local user data
                userPreferences.saveUserData(response.body()!!.data!!)
                
                // Also update local database
                val patientEntity = PatientEntity.fromPatient(response.body()!!.data!!)
                patientDao.updatePatient(patientEntity)
                
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
            // Check connectivity first
            requireConnectivity().getOrThrow()
            
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
            // Check connectivity first
            requireConnectivity().getOrThrow()
            
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
                   // Check connectivity first
                   requireConnectivity().getOrThrow()
                   
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
                   // Check connectivity first
                   requireConnectivity().getOrThrow()
                   
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
            // Check connectivity first
            requireConnectivity().getOrThrow()
            
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
        notes: String = "",
        doseId: String? = null,
        scheduledTime: String? = null
    ): Result<Boolean> {
        return try {
            // Check connectivity first
            requireConnectivity().getOrThrow()
            
            val user = userPreferences.getUserData().first()
            if (user != null) {
                val patientId = user.getPatientId()
                val adherenceData = mutableMapOf<String, Any>(
                    "taken" to taken,
                    "timestamp" to java.time.Instant.now().toString(),
                    "notes" to notes
                )
                
                // Add doseId if provided
                if (doseId != null) {
                    adherenceData["doseId"] = doseId
                }
                
                // Add scheduledTime if provided
                if (scheduledTime != null) {
                    adherenceData["scheduledTime"] = scheduledTime
                }
                
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
            // Check connectivity first
            requireConnectivity().getOrThrow()
            
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
                // If network fetch fails, try to get from local storage
                android.util.Log.w("PatientRepository", "Failed to fetch from network, trying local storage")
                val localData = getLocalPatientData(user.getPatientId())
                if (localData != null) {
                    return Result.success(localData)
                }
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
            
            // Sync fetched data to local database
            syncPatientDataToLocal(dataBundle)
            
            android.util.Log.d("PatientRepository", "All data fetched successfully. Medicines: ${dataBundle.medicines.size}, Notifications: ${dataBundle.notifications.size}")
            Result.success(dataBundle)
            
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Failed to fetch all patient data: ${e.message}", e)
            // Try to return local data if available
            val user = userPreferences.getUserData().first()
            if (user != null) {
                val localData = getLocalPatientData(user.getPatientId())
                if (localData != null) {
                    return Result.success(localData)
                }
            }
            Result.failure(e)
        }
    }
    
    // Sync patient data to local database
    private suspend fun syncPatientDataToLocal(dataBundle: PatientDataBundle) {
        try {
            val patientId = dataBundle.patient.getPatientId()
            android.util.Log.d("PatientRepository", "Syncing patient data to local database for: $patientId")
            
            // Save patient entity
            val patientEntity = PatientEntity.fromPatient(dataBundle.patient)
            patientDao.insertPatient(patientEntity)
            
            // Save medications
            medicationDao.deleteMedicationsForPatient(patientId)
            val medicationEntities = dataBundle.medicines.map { 
                MedicationEntity.fromMedication(it, patientId) 
            }
            medicationDao.insertMedications(medicationEntities)
            
            // Save notifications
            medicineNotificationDao.deleteNotificationsForPatient(patientId)
            val notificationEntities = dataBundle.notifications.map { 
                MedicineNotificationEntity.fromMedicineNotification(it) 
            }
            medicineNotificationDao.insertNotifications(notificationEntities)
            
            // Save visits
            visitDao.deleteVisitsForPatient(patientId)
            val visitEntities = dataBundle.visits.map { 
                VisitEntity.fromVisit(it, patientId) 
            }
            visitDao.insertVisits(visitEntities)
            
            // Save caretaker approvals
            caretakerApprovalDao.deleteApprovalsForPatient(patientId)
            val approvalEntities = dataBundle.caretakerRequests.map { 
                CaretakerApprovalEntity.fromCaretakerApproval(it, patientId) 
            }
            caretakerApprovalDao.insertApprovals(approvalEntities)
            
            android.util.Log.d("PatientRepository", "Successfully synced patient data to local database")
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Error syncing patient data: ${e.message}", e)
        }
    }
    
    // Get patient data from local database
    private suspend fun getLocalPatientData(patientId: String): PatientDataBundle? {
        try {
            val patientEntity = patientDao.getPatient(patientId) ?: return null
            val patient = patientEntity.toPatient().copy(
                currentMedications = medicationDao.getMedications(patientId).map { it.toMedication() },
                visits = visitDao.getVisits(patientId).map { it.toVisit() },
                caretakerApprovals = caretakerApprovalDao.getApprovals(patientId).map { it.toCaretakerApproval() }
            )
            
            val notifications = medicineNotificationDao.getNotifications(patientId).map { it.toMedicineNotification() }
            
            return PatientDataBundle(
                patient = patient,
                medicines = patient.currentMedications,
                notifications = notifications,
                caretakerRequests = patient.caretakerApprovals,
                visits = patient.visits
            )
        } catch (e: Exception) {
            android.util.Log.e("PatientRepository", "Error getting local patient data: ${e.message}", e)
            return null
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