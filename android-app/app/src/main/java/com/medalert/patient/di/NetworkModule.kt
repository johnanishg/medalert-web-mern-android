package com.medalert.patient.di

import android.content.Context
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.medalert.patient.data.api.ApiService
import com.medalert.patient.data.local.UserPreferences
import com.medalert.patient.data.local.DoseTrackingDatabase
import com.medalert.patient.data.local.DoseTrackingDao
import com.medalert.patient.data.local.DoseTrackingDatabaseProvider
import com.medalert.patient.data.repository.DoseTrackingRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.FileInputStream
import java.util.Properties
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideBaseUrl(@ApplicationContext context: Context): String {
        return try {
            val properties = Properties()
            // Try multiple possible locations for local.properties
            val possiblePaths = listOf(
                java.io.File(context.filesDir.parent, "local.properties"),
                java.io.File("/data/data/${context.packageName}/local.properties"),
                java.io.File(context.filesDir, "local.properties")
            )
            
            var localProperties: java.io.File? = null
            for (path in possiblePaths) {
                if (path.exists()) {
                    localProperties = path
                    break
                }
            }
            
            if (localProperties != null) {
                properties.load(FileInputStream(localProperties))
                val url = properties.getProperty("api.base.url", "http://192.168.29.72:5001/api/")            //http://172.16.9.156:5001/api/
                android.util.Log.d("NetworkModule", "Using API URL from ${localProperties.absolutePath}: $url")
                url
            } else {
                android.util.Log.d("NetworkModule", "local.properties not found in any location, using hardcoded URL")
                "http://192.168.29.72:5001/api/" // Use your actual IP as fallback
            }
        } catch (e: Exception) {
            android.util.Log.e("NetworkModule", "Error loading properties: ${e.message}")
            "http://192.168.29.72:5001/api/" // Use your actual IP as fallback
        }
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
        
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
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
}