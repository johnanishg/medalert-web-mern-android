package com.medalert.patient.data.service

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

data class ChatMessage(
    val id: String,
    val role: String, // "user" or "assistant"
    val content: String,
    val timestamp: Long
)

data class DashboardContext(
    val dashboardType: String,
    val userInfo: Map<String, Any>,
    val currentData: Map<String, Any>,
    val availableFeatures: List<String>
)

@Singleton
class GeminiService @Inject constructor(
    private val chatbotApiService: ChatbotApiService
) {
    
    private var isInitialized = false
    
    suspend fun initialize() = withContext(Dispatchers.IO) {
        try {
            val response = chatbotApiService.getStatus()
            if (response.isSuccessful) {
                val status = response.body()
                isInitialized = status?.available == true
                if (isInitialized) {
                    Log.d("GeminiService", "Chatbot API initialized successfully")
                } else {
                    Log.w("GeminiService", "Chatbot API not available: ${status?.message}")
                }
            } else {
                Log.e("GeminiService", "Failed to check chatbot status: ${response.code()}")
            }
        } catch (error: Exception) {
            Log.e("GeminiService", "Error initializing chatbot API", error)
        }
    }
    
    suspend fun sendMessage(
        message: String,
        context: DashboardContext,
        chatHistory: List<ChatMessage> = emptyList()
    ): String = withContext(Dispatchers.IO) {
        if (!isInitialized) {
            return@withContext "I'm sorry, the AI assistant is currently unavailable. Please check the API configuration."
        }
        
        try {
            val request = ChatbotMessageRequest(message, context, chatHistory)
            val response = chatbotApiService.sendMessage(request)
            
            if (response.isSuccessful) {
                val result = response.body()
                result?.message ?: "I'm sorry, I couldn't generate a response. Please try again."
            } else {
                Log.e("GeminiService", "Failed to send message: ${response.code()}")
                "I'm sorry, I encountered an error while processing your request. Please try again."
            }
        } catch (error: Exception) {
            Log.e("GeminiService", "Error sending message", error)
            "I'm sorry, I encountered an error while processing your request. Please try again."
        }
    }
    
    suspend fun analyzeHealthData(context: DashboardContext): String = withContext(Dispatchers.IO) {
        if (!isInitialized) {
            return@withContext "I'm sorry, the AI assistant is currently unavailable for health analysis."
        }
        
        try {
            val request = ChatbotAnalysisRequest(context)
            val response = chatbotApiService.analyzeHealthData(request)
            
            if (response.isSuccessful) {
                val result = response.body()
                result?.message ?: "I'm sorry, I couldn't generate a health analysis. Please try again."
            } else {
                Log.e("GeminiService", "Failed to analyze health data: ${response.code()}")
                "I'm sorry, I encountered an error while analyzing your health data. Please try again."
            }
        } catch (error: Exception) {
            Log.e("GeminiService", "Error analyzing health data", error)
            "I'm sorry, I encountered an error while analyzing your health data. Please try again."
        }
    }
    
    fun isAvailable(): Boolean = isInitialized
}
