package com.medalert.patient.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medalert.patient.data.service.ChatMessage
import com.medalert.patient.data.service.DashboardContext
import com.medalert.patient.data.service.GeminiService
import com.medalert.patient.BuildConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatbotViewModel @Inject constructor(
    private val geminiService: GeminiService
) : ViewModel() {
    
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()
    
    private val _inputText = MutableStateFlow("")
    val inputText: StateFlow<String> = _inputText.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _isAvailable = MutableStateFlow(false)
    val isAvailable: StateFlow<Boolean> = _isAvailable.asStateFlow()
    
    init {
        // Initialize Gemini service
        viewModelScope.launch {
            geminiService.initialize()
            _isAvailable.value = geminiService.isAvailable()
        }
    }
    
    fun setInputText(text: String) {
        _inputText.value = text
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
                // Create dashboard context (you can customize this based on your app's data)
                val context = DashboardContext(
                    dashboardType = "patient",
                    userInfo = mapOf(
                        "name" to "Patient",
                        "email" to "patient@example.com"
                    ),
                    currentData = mapOf(
                        "medicines" to emptyList<Any>(),
                        "visits" to emptyList<Any>(),
                        "diagnoses" to emptyList<Any>(),
                        "adherenceData" to emptyList<Any>(),
                        "notifications" to emptyList<Any>()
                    ),
                    availableFeatures = listOf(
                        "Medication Management",
                        "Adherence Tracking",
                        "Notifications",
                        "Health Analysis",
                        "Profile Management"
                    )
                )
                
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
    
    fun performHealthAnalysis() {
        if (_isLoading.value || !_isAvailable.value) return
        
        _isLoading.value = true
        
        viewModelScope.launch {
            try {
                val context = DashboardContext(
                    dashboardType = "patient",
                    userInfo = mapOf(
                        "name" to "Patient",
                        "email" to "patient@example.com"
                    ),
                    currentData = mapOf(
                        "medicines" to emptyList<Any>(),
                        "visits" to emptyList<Any>(),
                        "diagnoses" to emptyList<Any>(),
                        "adherenceData" to emptyList<Any>(),
                        "notifications" to emptyList<Any>()
                    ),
                    availableFeatures = listOf(
                        "Medication Management",
                        "Adherence Tracking",
                        "Notifications",
                        "Health Analysis",
                        "Profile Management"
                    )
                )
                
                val analysis = geminiService.analyzeHealthData(context)
                
                val analysisMessage = ChatMessage(
                    id = System.currentTimeMillis().toString(),
                    role = "assistant",
                    content = "## 📊 Comprehensive Health Analysis\n\n$analysis",
                    timestamp = System.currentTimeMillis()
                )
                
                _messages.value = _messages.value + analysisMessage
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
            val welcomeMessage = ChatMessage(
                id = System.currentTimeMillis().toString(),
                role = "assistant",
                content = "Hello! I'm your MedAlert AI assistant. I can help you navigate the patient dashboard and understand your healthcare data. How can I assist you today?",
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
