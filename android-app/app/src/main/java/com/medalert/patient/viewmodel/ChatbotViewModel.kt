package com.medalert.patient.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medalert.patient.data.service.ChatMessage
import com.medalert.patient.data.service.DashboardContext
import com.medalert.patient.data.service.GeminiService
import com.medalert.patient.data.api.ApiService
import com.medalert.patient.data.service.PcmWavRecorder
import com.medalert.patient.data.repository.PatientRepository
import com.medalert.patient.data.model.Patient
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.Visit
import com.medalert.patient.data.model.MedicineNotification
import com.medalert.patient.utils.MarkdownRenderer
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import android.speech.tts.TextToSpeech
import android.app.Application
import java.io.File
import java.util.Locale
import com.medalert.patient.BuildConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatbotViewModel @Inject constructor(
    private val geminiService: GeminiService,
    private val apiService: ApiService,
    private val patientRepository: PatientRepository,
    private val app: Application
) : ViewModel(), TextToSpeech.OnInitListener {
    
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()
    
    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _isAvailable = MutableStateFlow(false)
    val isAvailable: StateFlow<Boolean> = _isAvailable.asStateFlow()
    private val _isRecording = MutableStateFlow(false)
    val isRecording: StateFlow<Boolean> = _isRecording.asStateFlow()
    private val _ttsEnabled = MutableStateFlow(true)
    val ttsEnabled: StateFlow<Boolean> = _ttsEnabled.asStateFlow()

    private var recorder: PcmWavRecorder? = null
    private var textToSpeech: TextToSpeech? = null
    private var markdownRenderer: MarkdownRenderer? = null
    private var ttsInitialized = false
    
    // User data state
    private var currentPatient: Patient? = null
    private var currentMedications: List<Medication> = emptyList()
    private var currentVisits: List<Visit> = emptyList()
    private var currentNotifications: List<MedicineNotification> = emptyList()
    
    init {
        // Initialize Gemini service and fetch user data
        viewModelScope.launch {
            geminiService.initialize()
            _isAvailable.value = geminiService.isAvailable()
            fetchUserData()
        }
        // Initialize TTS and markdown renderer
        try { 
            textToSpeech = TextToSpeech(app, this)
            android.util.Log.d("ChatbotViewModel", "TTS initialization started")
        } catch (e: Exception) {
            android.util.Log.e("ChatbotViewModel", "TTS initialization failed", e)
        }
        markdownRenderer = MarkdownRenderer()
        markdownRenderer?.initialize(app)
    }
    
    fun setInputText(text: String) {
        _inputText.value = text
    }

    fun toggleTts() { 
        val newValue = !_ttsEnabled.value
        _ttsEnabled.value = newValue
        android.util.Log.d("ChatbotViewModel", "TTS toggled to: $newValue")
        if (!newValue) {
            // Stop any ongoing speech when muting
            try {
                textToSpeech?.stop()
                android.util.Log.d("ChatbotViewModel", "TTS stopped due to mute")
            } catch (e: Exception) {
                android.util.Log.e("ChatbotViewModel", "TTS stop failed", e)
            }
        } else {
            // Test TTS when enabling
            speakIfEnabled("TTS enabled")
        }
    }

    override fun onCleared() {
        super.onCleared()
        try { textToSpeech?.shutdown() } catch (_: Exception) {}
    }

    override fun onInit(status: Int) {
        ttsInitialized = status == TextToSpeech.SUCCESS
        if (ttsInitialized) {
            try { 
                textToSpeech?.language = Locale.US
                android.util.Log.d("ChatbotViewModel", "TTS initialized successfully")
            } catch (e: Exception) {
                android.util.Log.e("ChatbotViewModel", "TTS language setting failed", e)
                ttsInitialized = false
            }
        } else {
            android.util.Log.e("ChatbotViewModel", "TTS initialization failed with status: $status")
        }
    }

    fun speakIfEnabled(text: String) {
        if (!_ttsEnabled.value || !ttsInitialized) {
            android.util.Log.d("ChatbotViewModel", "TTS disabled or not initialized: enabled=${_ttsEnabled.value}, initialized=$ttsInitialized")
            return
        }
        val cleanText = markdownRenderer?.stripMarkdown(text) ?: text
        try { 
            textToSpeech?.speak(cleanText, TextToSpeech.QUEUE_ADD, null, System.currentTimeMillis().toString())
            android.util.Log.d("ChatbotViewModel", "TTS speaking: ${cleanText.take(50)}...")
        } catch (e: Exception) {
            android.util.Log.e("ChatbotViewModel", "TTS speak failed", e)
        }
    }

    private suspend fun fetchUserData() {
        try {
            val dataResult = patientRepository.fetchAllPatientData()
            if (dataResult.isSuccess) {
                val dataBundle = dataResult.getOrThrow()
                currentPatient = dataBundle.patient
                currentMedications = dataBundle.medicines
                currentVisits = dataBundle.visits
                currentNotifications = dataBundle.notifications
                
                android.util.Log.d("ChatbotViewModel", "User data fetched successfully: " +
                    "Patient: ${currentPatient?.name}, " +
                    "Medications: ${currentMedications.size}, " +
                    "Visits: ${currentVisits.size}, " +
                    "Notifications: ${currentNotifications.size}")
            } else {
                android.util.Log.w("ChatbotViewModel", "Failed to fetch user data: ${dataResult.exceptionOrNull()?.message}")
            }
        } catch (e: Exception) {
            android.util.Log.e("ChatbotViewModel", "Error fetching user data: ${e.message}")
        }
    }

    private fun createDashboardContext(): DashboardContext {
        val patient = currentPatient
        return DashboardContext(
            dashboardType = "patient",
            userInfo = mapOf(
                "name" to (patient?.name ?: "Patient"),
                "email" to (patient?.email ?: ""),
                "age" to (patient?.age ?: 0).toString(),
                "gender" to (patient?.gender ?: ""),
                "phoneNumber" to (patient?.phoneNumber ?: ""),
                "patientId" to (patient?.getUserFriendlyId() ?: "")
            ),
            currentData = mapOf(
                "medicines" to currentMedications.map { med ->
                    mapOf(
                        "name" to med.name,
                        "dosage" to med.dosage,
                        "frequency" to med.frequency,
                        "instructions" to med.instructions,
                        "timing" to med.timing,
                        "foodTiming" to med.foodTiming,
                        "prescribedBy" to med.prescribedBy,
                        "duration" to med.duration,
                        "isActive" to med.isActive,
                        "adherence" to med.adherence.map { record ->
                            mapOf(
                                "timestamp" to record.timestamp,
                                "taken" to record.taken,
                                "notes" to record.notes
                            )
                        },
                        "scheduledDoses" to med.scheduledDoses.map { dose ->
                            mapOf(
                                "time" to dose.time,
                                "label" to dose.label,
                                "dosage" to dose.dosage,
                                "isActive" to dose.isActive,
                                "daysOfWeek" to dose.daysOfWeek
                            )
                        }
                    )
                },
                "visits" to currentVisits.map { visit ->
                    mapOf(
                        "visitDate" to visit.visitDate,
                        "visitType" to visit.visitType,
                        "doctorName" to visit.doctorName,
                        "diagnosis" to visit.diagnosis,
                        "notes" to visit.notes,
                        "followUpDate" to visit.followUpDate,
                        "followUpRequired" to visit.followUpRequired,
                        "medicines" to visit.medicines.map { med ->
                            mapOf(
                                "name" to med.name,
                                "dosage" to med.dosage,
                                "frequency" to med.frequency,
                                "duration" to med.duration,
                                "instructions" to med.instructions
                            )
                        }
                    )
                },
                "diagnoses" to (patient?.medicalHistory ?: emptyList()).map { condition ->
                    mapOf(
                        "condition" to condition.condition,
                        "diagnosisDate" to condition.diagnosisDate,
                        "status" to condition.status
                    )
                },
                "allergies" to (patient?.allergies ?: emptyList()),
                "adherenceData" to currentMedications.flatMap { med -> med.adherence }.map { record ->
                    mapOf(
                        "medicineName" to (currentMedications.find { it.adherence.contains(record) }?.name ?: ""),
                        "timestamp" to record.timestamp,
                        "taken" to record.taken,
                        "notes" to record.notes
                    )
                },
                "notifications" to currentNotifications.map { notif ->
                    mapOf(
                        "medicineName" to notif.medicineName,
                        "dosage" to notif.dosage,
                        "instructions" to notif.instructions,
                        "notificationTimes" to notif.notificationTimes.map { time ->
                            mapOf(
                                "time" to time.time,
                                "label" to time.label,
                                "isActive" to time.isActive
                            )
                        },
                        "frequency" to notif.frequency,
                        "duration" to notif.duration,
                        "isActive" to notif.isActive
                    )
                }
            ),
            availableFeatures = listOf(
                "Medication Management",
                "Adherence Tracking", 
                "Notifications",
                "Health Analysis",
                "Profile Management",
                "Visit History",
                "Medical History",
                "Allergy Management"
            )
        )
    }

    fun startRecording() {
        if (_isRecording.value) return
        recorder = PcmWavRecorder(16000)
        _isRecording.value = recorder?.start() == true
    }

    fun stopRecordingAndTranscribe(languageCode: String = "en-US") {
        if (!_isRecording.value) return
        _isRecording.value = false
        
        val rec = recorder ?: return
        rec.stop()
        
        viewModelScope.launch {
            try {
                val wavBytes = rec.getWavBytes()
                if (wavBytes.isNotEmpty()) {
                    uploadAndTranscribe(wavBytes, languageCode)
                }
            } catch (e: Exception) {
                android.util.Log.e("ChatbotViewModel", "STT error: ${e.message}")
            }
        }
    }

    private suspend fun uploadAndTranscribe(wavBytes: ByteArray, languageCode: String = "en-US") {
        try {
            // Write to temp file
            val tempFile = File.createTempFile("stt_", ".wav", app.cacheDir)
            tempFile.writeBytes(wavBytes)
            val reqFile = tempFile.asRequestBody("audio/wav".toMediaTypeOrNull())
            val audioPart = MultipartBody.Part.createFormData("audio", tempFile.name, reqFile)
            val langBody = languageCode.toRequestBody("text/plain".toMediaTypeOrNull())
            val rateBody = "16000".toRequestBody("text/plain".toMediaTypeOrNull())
            val encBody = "LINEAR16".toRequestBody("text/plain".toMediaTypeOrNull())

            val resp = apiService.transcribeSpeech(audioPart, langBody, rateBody, encBody)
            if (resp.isSuccessful) {
                val body = resp.body()
                val text = body?.transcription
                if (!text.isNullOrBlank()) {
                    setInputText((inputText.value + " "+ text).trim())
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("ChatbotViewModel", "STT error: ${e.message}")
        }
    }
    
    fun sendMessage() {
        val message = _inputText.value.trim()
        if (message.isBlank() || _isLoading.value || !_isAvailable.value) return
        
        // Add user message
        val userMessage = ChatMessage(
            id = System.currentTimeMillis().toString(),
            role = "user",
            content = message,
            timestamp = System.currentTimeMillis()
        )
        _messages.value = _messages.value + userMessage
        _inputText.value = ""
        _isLoading.value = true
        
        viewModelScope.launch {
            try {
                // Refresh user data before sending message
                fetchUserData()
                
                // Create dashboard context with real user data
                val context = createDashboardContext()

                // Local medicine info quick-answer
                getMedicineQuickAnswer(message)?.let { quick ->
                    val assistantMessage = ChatMessage(
                        id = (System.currentTimeMillis() + 1).toString(),
                        role = "assistant",
                        content = quick,
                        timestamp = System.currentTimeMillis()
                    )
                    _messages.value = _messages.value + assistantMessage
                    speakIfEnabled(quick)
                    return@launch
                }
                
                val response = geminiService.sendMessage(
                    message = message,
                    context = context,
                    chatHistory = _messages.value
                )
                
                val assistantMessage = ChatMessage(
                    id = (System.currentTimeMillis() + 1).toString(),
                    role = "assistant",
                    content = response,
                    timestamp = System.currentTimeMillis()
                )
                
                _messages.value = _messages.value + assistantMessage
                
                // Speak the response if TTS is enabled
                speakIfEnabled(response)
            } catch (e: Exception) {
                val errorMessage = ChatMessage(
                    id = (System.currentTimeMillis() + 1).toString(),
                    role = "assistant",
                    content = "I'm sorry, I encountered an error. Please try again or check your internet connection.",
                    timestamp = System.currentTimeMillis()
                )
                _messages.value = _messages.value + errorMessage
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun getMedicineQuickAnswer(query: String): String? {
        return try {
            val meds = currentMedications
            if (meds.isEmpty()) return null
            val q = query.lowercase()
            val intent = Regex("(medicine|medication|drug|tablet|capsule|dose|dosage|when|how|what|info|information|details|schedule|timing)").containsMatchIn(q)
            if (!intent) return null

            val best = meds
                .map { med -> med to similarity(q, med.name.lowercase()) }
                .sortedByDescending { it.second }
                .firstOrNull()
            if (best == null || best.first.name.isBlank() || best.second < 0.3) return null

            val med = best.first
            val lines = mutableListOf<String>()
            lines += "## Medicine information: ${med.name}"
            if (med.dosage.isNotBlank()) lines += "- Dosage: ${med.dosage}"
            if (med.frequency.isNotBlank()) lines += "- Frequency: ${med.frequency}"
            if (med.timing.isNotEmpty()) lines += "- Timing: ${med.timing.joinToString(", ")}"
            if (med.foodTiming.isNotBlank()) lines += "- With food: ${med.foodTiming}"
            if (med.instructions.isNotBlank()) lines += "- Instructions: ${med.instructions}"
            if (med.startDate.isNotBlank()) lines += "- Start date: ${med.startDate}"
            if (med.endDate.isNotBlank()) lines += "- End date: ${med.endDate}"
            if (med.prescribedBy.isNotBlank()) lines += "- Prescribed by: ${med.prescribedBy}"
            if (med.scheduledDoses.isNotEmpty()) {
                val items = med.scheduledDoses.filter { it.isActive }.map { dose ->
                    "  - ${dose.label.ifBlank { "Dose" }} at ${dose.time}${if (dose.dosage.isNotBlank()) " (${dose.dosage})" else ""}"
                }
                if (items.isNotEmpty()) {
                    lines += "- Active scheduled doses:\n" + items.joinToString("\n")
                }
            }
            lines.joinToString("\n")
        } catch (_: Exception) { null }
    }

    private fun similarity(a: String, b: String): Double {
        if (a.isBlank() || b.isBlank()) return 0.0
        val ta = a.split(Regex("[^a-z0-9]+", RegexOption.IGNORE_CASE)).filter { it.isNotBlank() }.toSet()
        val tb = b.split(Regex("[^a-z0-9]+", RegexOption.IGNORE_CASE)).filter { it.isNotBlank() }.toSet()
        if (ta.isEmpty() || tb.isEmpty()) return 0.0
        val inter = ta.count { tb.contains(it) }
        return inter.toDouble() / maxOf(ta.size, tb.size).toDouble()
    }
    
    fun performHealthAnalysis() {
        if (_isLoading.value || !_isAvailable.value) return
        
        _isLoading.value = true
        
        viewModelScope.launch {
            try {
                // Refresh user data before analysis
                fetchUserData()
                
                // Create dashboard context with real user data
                val context = createDashboardContext()
                
                val analysis = geminiService.analyzeHealthData(context)
                
                val analysisMessage = ChatMessage(
                    id = System.currentTimeMillis().toString(),
                    role = "assistant",
                    content = "## 📊 Comprehensive Health Analysis\n\n$analysis",
                    timestamp = System.currentTimeMillis()
                )
                
                _messages.value = _messages.value + analysisMessage
                
                // Speak the analysis if TTS is enabled
                speakIfEnabled(analysis)
            } catch (e: Exception) {
                val errorMessage = ChatMessage(
                    id = System.currentTimeMillis().toString(),
                    role = "assistant",
                    content = "I'm sorry, I encountered an error while analyzing your health data. Please try again.",
                    timestamp = System.currentTimeMillis()
                )
                _messages.value = _messages.value + errorMessage
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun addWelcomeMessage() {
        if (_messages.value.isEmpty()) {
            val patientName = currentPatient?.name ?: "Patient"
            val medicationCount = currentMedications.size
            val visitCount = currentVisits.size
            
            val welcomeContent = if (currentPatient != null) {
                "Hello ${patientName}! I'm your MedAlert AI assistant. " +
                "I can see you have ${medicationCount} medication(s) and ${visitCount} visit(s) in your records. " +
                "I can help you with medication reminders, adherence tracking, visit summaries, and health analysis. " +
                "How can I assist you today?"
            } else {
                "Hello! I'm your MedAlert AI assistant. I can help you navigate the patient dashboard and understand your healthcare data. " +
                "Please make sure you're logged in to get personalized assistance. How can I help you today?"
            }
            
            val welcomeMessage = ChatMessage(
                id = System.currentTimeMillis().toString(),
                role = "assistant",
                content = welcomeContent,
                timestamp = System.currentTimeMillis()
            )
            _messages.value = listOf(welcomeMessage)
        }
    }
    
    fun clearChat() {
        _messages.value = emptyList()
        addWelcomeMessage()
    }
}
