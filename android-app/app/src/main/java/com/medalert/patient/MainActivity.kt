package com.medalert.patient

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.rememberNavController
import com.medalert.patient.navigation.MedAlertNavigation
import com.medalert.patient.services.TimingSyncService
import com.medalert.patient.ui.theme.MedAlertTheme
import com.medalert.patient.viewmodel.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Start timing sync service
        startTimingSyncService()
        
        setContent {
            MedAlertTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val authViewModel: AuthViewModel = hiltViewModel()
                    
                    MedAlertNavigation(
                        navController = navController,
                        authViewModel = authViewModel
                    )
                }
            }
        }
    }
    
    private fun startTimingSyncService() {
        try {
            val intent = Intent(this, TimingSyncService::class.java)
            startService(intent)
            android.util.Log.d("MainActivity", "Started TimingSyncService")
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to start TimingSyncService: ${e.message}", e)
        }
    }
}