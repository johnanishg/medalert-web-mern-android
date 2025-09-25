package com.medalert.patient.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.ui.components.MedicationCard
import com.medalert.patient.ui.components.QuickStatsCard
import com.medalert.patient.ui.components.UpcomingRemindersCard
import com.medalert.patient.viewmodel.AuthViewModel
import com.medalert.patient.viewmodel.PatientViewModel
import com.medalert.patient.viewmodel.LanguageViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToMedications: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToChatbot: () -> Unit,
    onLogout: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    patientViewModel: PatientViewModel = hiltViewModel(),
    languageViewModel: LanguageViewModel = hiltViewModel()
) {
    val patient by patientViewModel.patient.collectAsState()
    val medications by patientViewModel.medications.collectAsState()
    val notifications by patientViewModel.notifications.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()

    // Translations
    val lang by languageViewModel.language.collectAsState()
    var uiTranslations by remember(lang) { mutableStateOf<Map<String, String>>(emptyMap()) }
    LaunchedEffect(lang) {
        val keys = listOf(
            "Welcome back,",
            "Patient",
            "Refresh",
            "Language",
            "Notifications",
            "Profile",
            "Logout",
            "Current Medications",
            "View All",
            "No medications yet",
            "Your prescribed medications will appear here",
            "Your Patient ID",
            "Share this ID with your doctor for prescriptions",
            "No medications",
            "Edit Medicine",
            "Edit Timing",
            "Edit Schedule",
            "View Schedule",
            "Delete"
        )
        val translated = languageViewModel.translateBatch(keys, lang)
        uiTranslations = keys.mapIndexed { i, k -> k to (translated.getOrNull(i) ?: k) }.toMap()
    }
    fun t(key: String): String = uiTranslations[key] ?: key

    // Load data when screen opens
    LaunchedEffect(Unit) {
        patientViewModel.refreshAllData()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Header
    Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = t("Welcome back,"),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = patient?.name ?: t("Patient"),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
        val lang by languageViewModel.language.collectAsState()
        var langMenu by remember { mutableStateOf(false) }
        Row {
                // Refresh button
                IconButton(
                    onClick = { 
                        patientViewModel.refreshAllData()
                    }
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = t("Refresh"),
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }

            // Language menu
            Box {
                IconButton(onClick = { langMenu = true }) {
                    Icon(Icons.Default.Translate, contentDescription = t("Language"))
                }
                DropdownMenu(expanded = langMenu, onDismissRequest = { langMenu = false }) {
                    DropdownMenuItem(text = { Text("English") }, onClick = { languageViewModel.setLanguage("en"); langMenu = false })
                    DropdownMenuItem(text = { Text("हिन्दी") }, onClick = { languageViewModel.setLanguage("hi"); langMenu = false })
                    DropdownMenuItem(text = { Text("ಕನ್ನಡ") }, onClick = { languageViewModel.setLanguage("kn"); langMenu = false })
                }
            }
                
                IconButton(onClick = onNavigateToNotifications) {
                    Badge(
                        containerColor = MaterialTheme.colorScheme.error,
                        contentColor = MaterialTheme.colorScheme.onError
                    ) {
                    Text("${notifications.size}")
                    }
                    Icon(Icons.Default.Notifications, contentDescription = t("Notifications"))
                }
                
                IconButton(onClick = onNavigateToProfile) {
                    Icon(Icons.Default.Person, contentDescription = t("Profile"))
                }
                
                IconButton(onClick = onNavigateToChatbot) {
                Icon(Icons.Default.SmartToy, contentDescription = t("AI Assistant"))
                }
                
                IconButton(onClick = onLogout) {
                    Icon(Icons.Default.Logout, contentDescription = t("Logout"))
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Quick Stats
                item {
                    QuickStatsCard(
                        totalMedications = medications.size,
                        activeMedications = medications.count { it.timing.isNotEmpty() },
                        missedDoses = 0, // Calculate from adherence data
                        adherenceRate = 85 // Calculate from adherence data
                    )
                }
                
                // Upcoming Reminders
                item {
                    UpcomingRemindersCard(
                        medications = medications,
                        onViewAll = onNavigateToMedications
                    )
                }
                
                // Current Medications
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = t("Current Medications"),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                
                                TextButton(onClick = onNavigateToMedications) {
                                    Text(t("View All"))
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            if (medications.isEmpty()) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.MedicalServices,
                                        contentDescription = t("No medications"),
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = t("No medications yet"),
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = t("Your prescribed medications will appear here"),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            } else {
                                medications.take(3).forEach { medication ->
                                    MedicationCard(
                                        medication = medication,
                                        onRecordAdherence = { taken ->
                                            val medicineIndex = medications.indexOf(medication)
                                            patientViewModel.recordAdherence(medicineIndex, taken)
                                        },
                                        onEditTiming = { /* Navigate to timing edit */ },
                                        showActions = false,
                                        translate = { key -> t(key) }
                                    )
                                    
                                    if (medication != medications.take(3).last()) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Patient ID Card
                item {
                    patient?.let { patientData ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = t("Your Patient ID"),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = patientData.getUserFriendlyId(),
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = t("Share this ID with your doctor for prescriptions"),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }
                }
            }
        }
        
        // Error handling
        uiState.error?.let { error ->
            LaunchedEffect(error) {
                // Show error snackbar
                patientViewModel.clearError()
            }
        }
    }
}