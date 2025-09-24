package com.medalert.patient.data.service

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class ChatbotStatusResponse(
    val success: Boolean,
    val available: Boolean,
    val message: String
)

data class ChatbotMessageRequest(
    val message: String,
    val context: DashboardContext,
    val chatHistory: List<ChatMessage> = emptyList()
)

data class ChatbotMessageResponse(
    val success: Boolean,
    val message: String
)

data class ChatbotAnalysisRequest(
    val context: DashboardContext
)

data class ChatbotAnalysisResponse(
    val success: Boolean,
    val message: String
)

interface ChatbotApiService {
    @GET("chatbot/status")
    suspend fun getStatus(): Response<ChatbotStatusResponse>
    
    @POST("chatbot/message")
    suspend fun sendMessage(@Body request: ChatbotMessageRequest): Response<ChatbotMessageResponse>
    
    @POST("chatbot/analyze")
    suspend fun analyzeHealthData(@Body request: ChatbotAnalysisRequest): Response<ChatbotAnalysisResponse>
}
