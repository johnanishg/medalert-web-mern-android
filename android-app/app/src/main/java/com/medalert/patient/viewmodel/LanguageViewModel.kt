package com.medalert.patient.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medalert.patient.data.local.UserPreferences
import com.medalert.patient.data.repository.TranslationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LanguageViewModel @Inject constructor(
    private val userPreferences: UserPreferences,
    private val translationRepository: TranslationRepository
) : ViewModel() {

    val language: StateFlow<String> = userPreferences
        .getPreferredLanguage()
        .map { it ?: "en" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), "en")

    fun setLanguage(code: String) {
        viewModelScope.launch {
            userPreferences.savePreferredLanguage(code)
        }
    }

    suspend fun translate(text: String, targetLanguage: String, source: String? = null): String {
        println("LanguageViewModel: translate called with target=$targetLanguage, text=$text")
        if (targetLanguage == "en") {
            println("LanguageViewModel: Target is English, returning original text")
            return text
        }
        return try {
            println("LanguageViewModel: Calling translationRepository.translate")
            val result = translationRepository.translate(text, targetLanguage, source)
            println("LanguageViewModel: Translation result: $result")
            result ?: text
        } catch (e: Exception) {
            println("LanguageViewModel: Exception in translate: ${e.message}")
            text
        }
    }

    suspend fun translateBatch(texts: List<String>, targetLanguage: String, source: String? = null): List<String> {
        println("LanguageViewModel: translateBatch called with target=$targetLanguage, texts=$texts")
        if (targetLanguage == "en") {
            println("LanguageViewModel: Target is English, returning original texts")
            return texts
        }
        return try {
            println("LanguageViewModel: Calling translationRepository.translateBatch")
            val result = translationRepository.translateBatch(texts, targetLanguage, source)
            println("LanguageViewModel: Translation result: $result")
            result
        } catch (e: Exception) {
            println("LanguageViewModel: Exception in translateBatch: ${e.message}")
            texts
        }
    }
}


