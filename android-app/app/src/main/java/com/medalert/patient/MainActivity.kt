package com.medalert.patient

import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
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
        
        // Ensure system bars (notification bar) are visible
        setupSystemBars()
        
        // Prevent screenshots and screen recording in kiosk mode
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        
        // Enable kiosk/lock task mode
        enableKioskMode()
        
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
    
    override fun onResume() {
        super.onResume()
        // Re-enable lock task mode if it was exited
        enableKioskMode()
    }
    
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            // Re-enable lock task mode if focus is regained
            enableKioskMode()
        }
    }
    
    override fun onPause() {
        super.onPause()
        // Re-enable lock task mode when activity resumes
        enableKioskMode()
    }
    
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Prevent home button from working
        if (keyCode == KeyEvent.KEYCODE_HOME) {
            android.util.Log.d("MainActivity", "Home button pressed - preventing default action")
            return true // Consume the event
        }
        
        // Prevent recent apps button
        if (keyCode == KeyEvent.KEYCODE_APP_SWITCH) {
            android.util.Log.d("MainActivity", "Recent apps button pressed - preventing default action")
            return true // Consume the event
        }
        
        // Allow back button to work normally
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            return super.onKeyDown(keyCode, event)
        }
        
        return super.onKeyDown(keyCode, event)
    }
    
    override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
        // Prevent long press on home button
        if (keyCode == KeyEvent.KEYCODE_HOME) {
            android.util.Log.d("MainActivity", "Home button long pressed - preventing default action")
            return true // Consume the event
        }
        
        // Prevent long press on recent apps button
        if (keyCode == KeyEvent.KEYCODE_APP_SWITCH) {
            android.util.Log.d("MainActivity", "Recent apps button long pressed - preventing default action")
            return true // Consume the event
        }
        
        return super.onKeyLongPress(keyCode, event)
    }
    
    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Re-enable lock task mode when user tries to leave
        android.util.Log.d("MainActivity", "User trying to leave - re-enabling lock task mode")
        // Use post to ensure this runs after the system processes the leave hint
        window.decorView.post {
            enableKioskMode()
        }
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        // Re-enable lock task mode when new intent is received
        enableKioskMode()
    }
    
    private fun enableKioskMode() {
        try {
            val devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(this, DeviceAdminReceiver::class.java)
            
            // Check if app is device owner (for full kiosk mode)
            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                // Set lock task packages
                devicePolicyManager.setLockTaskPackages(adminComponent, arrayOf(packageName))
                
                // Start lock task mode
                if (!isInLockTaskMode()) {
                    startLockTask()
                    android.util.Log.d("MainActivity", "Lock task mode enabled (Device Owner)")
                }
            } else {
                // Try to start lock task mode even without device owner
                // This works if the app is set as a launcher
                try {
                    if (!isInLockTaskMode()) {
                        startLockTask()
                        android.util.Log.d("MainActivity", "Lock task mode enabled (Launcher mode)")
                    }
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "Could not start lock task mode: ${e.message}")
                }
            }
            
            // If somehow lock task mode was exited, try to re-enable it
            if (!isInLockTaskMode()) {
                android.util.Log.w("MainActivity", "Not in lock task mode - attempting to re-enable")
                try {
                    startLockTask()
                } catch (e: Exception) {
                    android.util.Log.e("MainActivity", "Failed to re-enable lock task mode: ${e.message}")
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Error enabling kiosk mode: ${e.message}")
        }
    }
    
    private fun isInLockTaskMode(): Boolean {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return activityManager.isInLockTaskMode
    }
    
    private fun setupSystemBars() {
        // Ensure system bars (notification bar) are visible and accessible
        // Clear any flags that might hide the system bars
        window.clearFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN
            or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        )
        
        // Make sure system bars are visible (status bar shows time and battery)
        // Use WindowCompat for proper system bar handling - keep system bars visible
        WindowCompat.setDecorFitsSystemWindows(window, true)
        
        // Ensure status bar is visible (notification bar) - shows time and battery
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                // Show system bars (status bar and navigation bar)
                // Status bar shows time, battery, and allows access to settings via quick settings
                controller.show(android.view.WindowInsets.Type.statusBars())
                controller.show(android.view.WindowInsets.Type.navigationBars())
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
        }
        
        android.util.Log.d("MainActivity", "System bars configured - notification bar visible with time and battery")
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