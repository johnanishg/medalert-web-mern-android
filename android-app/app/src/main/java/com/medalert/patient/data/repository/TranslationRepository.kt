package com.medalert.patient.data.repository

import com.medalert.patient.data.api.ApiService
import com.medalert.patient.data.model.TranslationBatchResponse
import com.medalert.patient.data.model.TranslationSingleResponse
import javax.inject.Inject

class TranslationRepository @Inject constructor(
    private val api: ApiService
) {
    suspend fun translate(text: String, target: String, source: String? = null): String? {
        return try {
            val body = mutableMapOf(
                "text" to text,
                "targetLanguage" to target
            )
            if (source != null) body["sourceLanguage"] = source
            println("TranslationRepository: Sending single translation request: $body")
            val resp = api.translate(body)
            println("TranslationRepository: Single response code: ${resp.code()}, Success: ${resp.isSuccessful}")
            if (resp.isSuccessful) {
                val payload: TranslationSingleResponse? = resp.body()
                println("TranslationRepository: Single response body: $payload")
                payload?.translatedText
            } else {
                println("TranslationRepository: Single translation error response: ${resp.errorBody()?.string()}")
                null
            }
        } catch (e: Exception) {
            println("TranslationRepository: Single translation exception: ${e.message}")
            null
        }
    }

    suspend fun translateBatch(texts: List<String>, target: String, source: String? = null): List<String> {
        if (texts.isEmpty()) return emptyList()
        return try {
            val body: MutableMap<String, Any> = mutableMapOf(
                "texts" to texts,
                "targetLanguage" to target
            )
            if (source != null) body["sourceLanguage"] = source
            println("TranslationRepository: Sending batch translation request: $body")
            val resp = api.translateBatch(body)
            println("TranslationRepository: Response code: ${resp.code()}, Success: ${resp.isSuccessful}")
            if (resp.isSuccessful) {
                val payload: TranslationBatchResponse? = resp.body()
                println("TranslationRepository: Response body: $payload")
                val list = payload?.translatedTexts
                if (list != null) {
                    println("TranslationRepository: Translated texts: $list")
                    return list
                }
            } else {
                println("TranslationRepository: Error response: ${resp.errorBody()?.string()}")
            }
            texts
        } catch (e: Exception) {
            println("TranslationRepository: Exception: ${e.message}")
            texts
        }
    }
}
