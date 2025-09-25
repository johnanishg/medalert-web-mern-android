package com.medalert.patient.data.model

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class TranslationSingleRequest(
    val text: String,
    val targetLanguage: String,
    val sourceLanguage: String? = null
) : Parcelable

@Parcelize
data class TranslationBatchRequest(
    val texts: List<String>,
    val targetLanguage: String,
    val sourceLanguage: String? = null
) : Parcelable


