package com.medalert.patient.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.medalert.patient.ui.screens.*
import com.medalert.patient.viewmodel.AuthViewModel

@Composable
fun MedAlertNavigation(
    navController: NavHostController,
    authViewModel: AuthViewModel
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    
    // Determine start destination based on auth state
    val startDestination = if (currentUser != null) "dashboard" else "login"
    
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable("login") {
            LoginScreen(
                onNavigateToRegister = {
                    navController.navigate("register") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                authViewModel = authViewModel
            )
        }
        
        composable("register") {
            RegisterScreen(
                onNavigateToLogin = {
                    navController.navigate("login") {
                        popUpTo("register") { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    navController.navigate("dashboard") {
                        popUpTo("register") { inclusive = true }
                    }
                },
                authViewModel = authViewModel
            )
        }
        
        composable("dashboard") {
            EnhancedDashboardScreen(
                onNavigateToMedications = {
                    navController.navigate("medications")
                },
                onNavigateToProfile = {
                    navController.navigate("profile")
                },
                onNavigateToNotifications = {
                    navController.navigate("notifications")
                },
                onNavigateToCalendarSchedule = {
                    navController.navigate("calendar_schedule")
                },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        
        composable("medications") {
            MedicationsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToSchedule = { medication ->
                    navController.navigate("medication_schedule/${medication._id}")
                }
            )
        }
        
        composable("medication_schedule/{medicationId}") { backStackEntry ->
            val medicationId = backStackEntry.arguments?.getString("medicationId") ?: ""
            // For now, we'll need to get the medication from the viewmodel
            // In a real app, you might pass the medication as a parameter or fetch it by ID
            MedicationScheduleScreen(
                medication = com.medalert.patient.data.model.Medication(_id = medicationId),
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("calendar_schedule") {
            CalendarScheduleScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("profile") {
            ProfileScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("notifications") {
            NotificationsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}