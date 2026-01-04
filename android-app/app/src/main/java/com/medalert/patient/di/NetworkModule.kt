package com.medalert.patient.di

import android.content.Context
import com.medalert.patient.BuildConfig
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.medalert.patient.data.api.ApiService
import com.medalert.patient.data.local.UserPreferences
import com.medalert.patient.data.local.DoseTrackingDatabase
import com.medalert.patient.data.local.DoseTrackingDao
import com.medalert.patient.data.local.DoseTrackingDatabaseProvider
import com.medalert.patient.data.local.PatientDatabase
import com.medalert.patient.data.local.PatientDatabaseProvider
import com.medalert.patient.util.NetworkConnectivityManager
import com.medalert.patient.data.repository.DoseTrackingRepository
import com.medalert.patient.data.repository.TranslationRepository
import com.medalert.patient.data.service.GeminiService
import com.medalert.patient.data.service.ChatbotApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import android.os.Build
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideBaseUrl(@ApplicationContext context: Context): String {
        return try {
            val urlFromBuildConfig = BuildConfig.API_BASE_URL
            if (urlFromBuildConfig.isNotBlank()) {
                android.util.Log.d("NetworkModule", "Using API URL from BuildConfig: $urlFromBuildConfig")
                urlFromBuildConfig
            } else {
                val fallback = if (isEmulator()) "http://10.0.2.2:5000/api/" else "http://127.0.0.1:5000/api/"
                android.util.Log.w("NetworkModule", "BuildConfig.API_BASE_URL blank, using fallback: $fallback")
                fallback
            }
        } catch (e: Exception) {
            val fallback = if (isEmulator()) "http://10.0.2.2:5000/api/" else "http://127.0.0.1:5000/api/"
            android.util.Log.e("NetworkModule", "Error reading BuildConfig.API_BASE_URL: ${e.message}. Using fallback: $fallback")
            fallback
        }
    }

    private fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.lowercase().contains("vbox") ||
                Build.FINGERPRINT.lowercase().contains("test-keys") ||
                Build.HARDWARE.contains("goldfish") ||
                Build.HARDWARE.contains("ranchu") ||
                Build.MODEL.contains("google_sdk") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK built for x86") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
                "google_sdk" == Build.PRODUCT)
    }
    
    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create()
    }
    
    @Provides
    @Singleton
    fun provideAuthInterceptor(userPreferences: UserPreferences): Interceptor {
        return Interceptor { chain ->
            val token = runBlocking { userPreferences.getAuthToken().first() }
            val request = chain.request().newBuilder()
            
            if (!token.isNullOrEmpty()) {
                request.addHeader("Authorization", "Bearer $token")
            }
            
            chain.proceed(request.build())
        }
    }
    
    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        
        // Error handling interceptor to catch and log connection issues
        val errorInterceptor = Interceptor { chain ->
            val request = chain.request()
            try {
                val response = chain.proceed(request)
                
                // Log response details
                if (!response.isSuccessful) {
                    android.util.Log.e("NetworkModule", "HTTP Error: ${response.code} ${response.message} for ${request.url}")
                }
                
                response
            } catch (e: Exception) {
                android.util.Log.e("NetworkModule", "Network error for ${request.url}: ${e.javaClass.simpleName} - ${e.message}", e)
                
                // Provide more specific error messages
                val errorMessage = when {
                    e is java.net.UnknownHostException -> "Cannot reach server. Check internet connection."
                    e is java.net.SocketTimeoutException -> "Request timed out. Server may be slow or unreachable."
                    e is java.net.ConnectException -> "Connection refused. Server may be down or ngrok tunnel inactive."
                    e is java.net.NoRouteToHostException -> "No route to host. Check network connectivity or ngrok tunnel."
                    else -> "Network error: ${e.message ?: e.javaClass.simpleName}"
                }
                
                android.util.Log.e("NetworkModule", "Error details: $errorMessage")
                throw e
            }
        }
        
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(errorInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, gson: Gson, baseUrl: String): Retrofit {
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
    
    @Provides
    @Singleton
    fun provideDoseTrackingDatabase(@ApplicationContext context: Context): DoseTrackingDatabase {
        return DoseTrackingDatabaseProvider.getDatabase(context)
    }
    
    @Provides
    @Singleton
    fun provideDoseTrackingDao(database: DoseTrackingDatabase): DoseTrackingDao {
        return database.doseTrackingDao()
    }
    
    @Provides
    @Singleton
    fun provideDoseTrackingRepository(doseTrackingDao: DoseTrackingDao): DoseTrackingRepository {
        return DoseTrackingRepository(doseTrackingDao)
    }

    @Provides
    @Singleton
    fun provideTranslationRepository(apiService: ApiService): TranslationRepository {
        return TranslationRepository(apiService)
    }
    
    @Provides
    @Singleton
    fun provideChatbotApiService(retrofit: Retrofit): ChatbotApiService {
        return retrofit.create(ChatbotApiService::class.java)
    }
    
    @Provides
    @Singleton
    fun provideGeminiService(chatbotApiService: ChatbotApiService): GeminiService {
        return GeminiService(chatbotApiService)
    }
    
    @Provides
    @Singleton
    fun provideNetworkConnectivityManager(@ApplicationContext context: Context): NetworkConnectivityManager {
        return NetworkConnectivityManager(context)
    }
    
    @Provides
    @Singleton
    fun providePatientDatabase(@ApplicationContext context: Context): PatientDatabase {
        return PatientDatabaseProvider.getDatabase(context)
    }
    
    @Provides
    @Singleton
    fun providePatientDao(database: PatientDatabase): com.medalert.patient.data.local.PatientDao {
        return database.patientDao()
    }
    
    @Provides
    @Singleton
    fun provideMedicationDao(database: PatientDatabase): com.medalert.patient.data.local.MedicationDao {
        return database.medicationDao()
    }
    
    @Provides
    @Singleton
    fun provideMedicineNotificationDao(database: PatientDatabase): com.medalert.patient.data.local.MedicineNotificationDao {
        return database.medicineNotificationDao()
    }
    
    @Provides
    @Singleton
    fun provideVisitDao(database: PatientDatabase): com.medalert.patient.data.local.VisitDao {
        return database.visitDao()
    }
    
    @Provides
    @Singleton
    fun provideCaretakerApprovalDao(database: PatientDatabase): com.medalert.patient.data.local.CaretakerApprovalDao {
        return database.caretakerApprovalDao()
    }
}