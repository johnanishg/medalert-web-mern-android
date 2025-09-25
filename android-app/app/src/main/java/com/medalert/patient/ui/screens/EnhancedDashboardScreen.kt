package com.medalert.patient.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.ui.components.MedicationCard
import com.medalert.patient.ui.components.NumericTimingDialog
import com.medalert.patient.ui.components.QuickStatsCard
import com.medalert.patient.ui.components.SetTimingDialog
import com.medalert.patient.ui.components.UpcomingRemindersCard
import com.medalert.patient.viewmodel.AuthViewModel
import com.medalert.patient.viewmodel.PatientViewModel
import com.medalert.patient.viewmodel.LanguageViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnhancedDashboardScreen(
    onNavigateToMedications: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToCalendarSchedule: () -> Unit = {},
    onNavigateToChatbot: () -> Unit = {},
    onLogout: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    patientViewModel: PatientViewModel = hiltViewModel()
) {
    val patient by patientViewModel.patient.collectAsState()
    val medications by patientViewModel.medications.collectAsState()
    val notifications by patientViewModel.notifications.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()
    
    var activeTab by remember { mutableStateOf(DashboardTab.PROFILE) }
    
    // Language selector state
    val languageViewModel: LanguageViewModel = hiltViewModel()
    val lang by languageViewModel.language.collectAsState()
    var langMenu by remember { mutableStateOf(false) }
    var uiTranslations by remember(lang) { mutableStateOf<Map<String, String>>(emptyMap()) }
    
    fun t(key: String): String = uiTranslations[key] ?: key
    fun translate(key: String): String = t(key)
    
    LaunchedEffect(lang) {
        println("Language changed to: $lang")
        val keys = listOf(
            "Edit Profile",
            "History",
            "From Date",
            "To Date",
            "Clear",
            "Apply",
            "Calendar View",
            "View All",
            "Add Notification",
            "Add Caretaker",
            "View Calendar Schedule",
            "Patient Information",
            "Name",
            "Email",
            "Phone",
            "Age",
            "Gender",
            "Patient ID",
            "Emergency Contact",
            "Relationship",
            "Health Overview",
            "Active Medicines",
            "Total Visits",
            "Known Allergies",
            "Quick Actions",
            "Medical History",
            "No medical history recorded",
            "Diagnosed",
            "Status",
            "Allergies",
            "No known allergies",
            "Allergy",
            "Medicine Summary",
            "Filter by date range",
            "Current Medications",
            "No medications",
            "No medications yet",
            "Your prescribed medications will appear here",
            "Visit History",
            "No visit history available",
            "Date",
            "Doctor",
            "Diagnosis",
            "Medicine Notifications",
            "Manage your medicine reminder notifications and alarm settings",
            "Notification Statistics",
            "Active Notifications",
            "Total Reminders",
            "Response Rate",
            "Current Notifications",
            "No notifications set up",
            "Add medicine notifications to get timely reminders",
            "Edit notification",
            "Delete notification",
            "Dosage",
            "Times",
            "Caretaker Management",
            "Manage your caretaker relationships and approval requests",
            "Current Caretaker",
            "Assigned",
            "Contact caretaker",
            "Remove caretaker",
            "No caretaker assigned",
            "Add a caretaker to help manage your health",
            "Caretaker Requests",
            "No pending requests",
            "Requested",
            "Medicine Schedule",
            "View your complete medication schedule and track adherence",
            "No Medicines Scheduled",
            "Add medicines to see your schedule",
            "Frequency",
            "Daily Timings",
            "Edit timing",
            "Add Timing",
            "Instructions",
            "Refresh",
            "Language",
            "Notifications",
            "Logout",
            "MedAlert Dashboard",
            // dynamic value translations
            "male", "female", "other",
            "medications", "conditions",
            // Additional keys for tab content
            "Medicine Summary",
            "Filter by date range",
            "From Date",
            "To Date",
            "Clear",
            "Apply",
            "Current Medications",
            "Calendar View",
            "View All",
            "No medications",
            "No medications yet",
            "Your prescribed medications will appear here",
            "Visit History",
            "No visit history available",
            "Date",
            "Doctor",
            "Diagnosis",
            "Medicine Notifications",
            "Manage your medicine reminder notifications and alarm settings",
            "Add Notification",
            "Notification Statistics",
            "Active Notifications",
            "Total Reminders",
            "Response Rate",
            "Current Notifications",
            "No notifications set up",
            "Add medicine notifications to get timely reminders",
            "Edit notification",
            "Delete notification",
            "Dosage",
            "Times",
            "Caretaker Management",
            "Manage your caretaker relationships and approval requests",
            "Add Caretaker",
            "Current Caretaker",
            "Assigned",
            "Contact caretaker",
            "Remove caretaker",
            "No caretaker assigned",
            "Add a caretaker to help manage your health",
            "Caretaker Requests",
            "No pending requests",
            "Status",
            "Requested",
            "Medicine Schedule",
            "View your complete medication schedule and track adherence",
            "View Calendar Schedule",
            "No Medicines Scheduled",
            "Add medicines to see your schedule",
            "Frequency",
            "Daily Timings:",
            "Pending",
            "Late",
            "Active",
            "Inactive",
            "Taken at",
            "Dose History",
            "No dose records yet",
            "And",
            "more...",
            "Edit",
            "Delete",
            "Profile",
            "Medicines",
            "Schedule",
            "Visits",
            "Notifications",
            "Caretaker",
            "Edit Medicine",
            "Edit Timing",
            "Edit Schedule",
            "View Schedule"
        )
        println("Calling translateBatch with ${keys.size} keys")
        val translated = languageViewModel.translateBatch(keys, lang)
        println("Translated keys: $translated")
        uiTranslations = keys.mapIndexed { index, key -> key to (translated.getOrNull(index) ?: key) }.toMap()
        println("UI Translations: $uiTranslations")
    }
    
    // Load data when screen opens
    LaunchedEffect(Unit) {
        patientViewModel.refreshAllData()
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Header with theme toggle and logout
        TopAppBar(
            title = { 
                Text(
                    text = t("MedAlert Dashboard"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            actions = {
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
                
                // Language dropdown
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
                
                IconButton(onClick = onNavigateToChatbot) {
                    Icon(Icons.Default.SmartToy, contentDescription = t("AI Assistant"))
                }
                
                IconButton(onClick = onLogout) {
                    Icon(Icons.Default.Logout, contentDescription = t("Logout"))
                }
            }
        )
        
        // Tab Navigation
        TabRow(
            selectedTabIndex = activeTab.ordinal,
            modifier = Modifier.fillMaxWidth()
        ) {
            DashboardTab.values().forEach { tab ->
                Tab(
                    selected = activeTab == tab,
                    onClick = { activeTab = tab },
                    icon = {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = t(tab.title)
                        )
                    },
                    text = {
                        Text(
                            text = t(tab.title),
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                )
            }
        }
        
        // Tab Content
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            when (activeTab) {
                DashboardTab.PROFILE -> ProfileTabContent(
                    patient = patient,
                    onEditProfile = onNavigateToProfile,
                    translate = { key -> t(key) }
                )
                DashboardTab.MEDICINES -> MedicinesTabContent(
                    medications = medications,
                    onNavigateToMedications = onNavigateToMedications,
                    onNavigateToCalendarSchedule = onNavigateToCalendarSchedule,
                    patientViewModel = patientViewModel,
                    translate = { key -> t(key) }
                )
                DashboardTab.SCHEDULE -> ScheduleTabContent(
                    medications = medications,
                    onNavigateToCalendarSchedule = onNavigateToCalendarSchedule,
                    patientViewModel = patientViewModel,
                    translate = { key -> t(key) }
                )
                DashboardTab.VISITS -> VisitsTabContent(
                    patient = patient,
                    translate = { key -> t(key) }
                )
                DashboardTab.NOTIFICATIONS -> NotificationsTabContent(
                    notifications = notifications,
                    translate = { key -> t(key) }
                )
                DashboardTab.CARETAKER -> CaretakerTabContent(
                    patient = patient,
                    patientViewModel = patientViewModel,
                    translate = { key -> t(key) }
                )
            }
        }
        
        // Loading indicator
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
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

@Composable
fun ProfileTabContent(
    patient: com.medalert.patient.data.model.Patient?,
    onEditProfile: () -> Unit,
    translate: (String) -> String
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Patient Information Card with Statistics
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
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
                            text = translate("Patient Information"),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        
                        IconButton(onClick = onEditProfile) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = translate("Edit Profile"),
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    patient?.let { p ->
                        // Translate patient name
                        val translatedName = if (p.name.isNotEmpty()) {
                            try {
                                // Use the translate function to translate the name
                                translate(p.name)
                            } catch (e: Exception) {
                                p.name
                            }
                        } else {
                            p.name
                        }
                        DashboardProfileInfoRow(translate("Name"), translatedName)
                        DashboardProfileInfoRow(translate("Email"), p.email)
                        DashboardProfileInfoRow(translate("Phone"), p.phoneNumber)
                        DashboardProfileInfoRow(translate("Age"), p.age.toString())
                        val genderDisplay = when (p.gender.lowercase()) {
                            "male" -> translate("male")
                            "female" -> translate("female")
                            "other" -> translate("other")
                            else -> p.gender
                        }
                        DashboardProfileInfoRow(translate("Gender"), genderDisplay)
                        DashboardProfileInfoRow(translate("Patient ID"), p.getUserFriendlyId())
                        
                        p.emergencyContact?.let { contact ->
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = translate("Emergency Contact"),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            // Translate emergency contact name
                            val translatedContactName = if (contact.name.isNotEmpty()) {
                                try {
                                    translate(contact.name)
                                } catch (e: Exception) {
                                    contact.name
                                }
                            } else {
                                contact.name
                            }
                            DashboardProfileInfoRow(translate("Name"), translatedContactName)
                            DashboardProfileInfoRow(translate("Phone"), contact.phone)
                            DashboardProfileInfoRow(translate("Relationship"), contact.relationship)
                        }
                    }
                }
            }
        }
        
        // Quick Statistics Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Health Overview"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // Active Medicines
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "${patient?.currentMedications?.size ?: 0}",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = translate("Active Medicines"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        
                        // Total Visits
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "${patient?.visits?.size ?: 0}",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                text = translate("Total Visits"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        
                        // Allergies
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "${patient?.allergies?.size ?: 0}",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.tertiary
                            )
                            Text(
                                text = translate("Known Allergies"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
        
        // Quick Actions Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Quick Actions"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // Edit Profile Button
                        Button(
                            onClick = onEditProfile,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(translate("Edit Profile"))
                        }
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        // View Medical History Button
                        OutlinedButton(
                            onClick = { /* Navigate to medical history */ },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.History, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(translate("History"))
                        }
                    }
                }
            }
        }
        
        // Medical History Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Medical History"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    patient?.medicalHistory?.let { history ->
                        if (history.isEmpty()) {
                            Text(
                                text = translate("No medical history recorded"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            history.forEach { condition ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp)
                                    ) {
                                        Text(
                                            text = condition.condition,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "${translate("Diagnosed")}: ${condition.diagnosisDate}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = "${translate("Status")}: ${condition.status}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
        
        // Allergies Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Allergies"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    patient?.allergies?.let { allergies ->
                        if (allergies.isEmpty()) {
                            Text(
                                text = translate("No known allergies"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            allergies.forEach { allergy ->
                                AssistChip(
                                    onClick = { },
                                    label = { Text(allergy) },
                                    leadingIcon = {
                                        Icon(
                                            Icons.Default.Warning,
                                            contentDescription = translate("Allergy"),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MedicinesTabContent(
    medications: List<com.medalert.patient.data.model.Medication>,
    onNavigateToMedications: () -> Unit,
    onNavigateToCalendarSchedule: () -> Unit,
    patientViewModel: PatientViewModel,
    translate: (String) -> String
) {
    var showDateRangeFilter by remember { mutableStateOf(false) }
    var dateRangeFrom by remember { mutableStateOf("") }
    var dateRangeTo by remember { mutableStateOf("") }
    
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Medicine Summary with Date Range
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
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
                            text = translate("Medicine Summary"),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        
                        IconButton(onClick = { showDateRangeFilter = !showDateRangeFilter }) {
                            Icon(
                                Icons.Default.FilterList,
                                contentDescription = translate("Filter by date range"),
                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    
                    if (showDateRangeFilter) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = dateRangeFrom,
                                onValueChange = { dateRangeFrom = it },
                                label = { Text(translate("From Date")) },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = dateRangeTo,
                                onValueChange = { dateRangeTo = it },
                                label = { Text(translate("To Date")) },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(onClick = { 
                                dateRangeFrom = ""
                                dateRangeTo = ""
                                showDateRangeFilter = false
                            }) {
                                Text(translate("Clear"))
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = { showDateRangeFilter = false }) {
                                Text(translate("Apply"))
                            }
                        }
                    }
                }
            }
        }
        
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
                            text = translate("Current Medications"),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Row {
                            TextButton(onClick = onNavigateToCalendarSchedule) {
                                Text(translate("Calendar View"))
                            }
                            TextButton(onClick = onNavigateToMedications) {
                                Text(translate("View All"))
                            }
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
                                contentDescription = translate("No medications"),
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = translate("No medications yet"),
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = translate("Your prescribed medications will appear here"),
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
                                translate = { key -> translate(key) }
                            )
                            
                            if (medication != medications.take(3).last()) {
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VisitsTabContent(
    patient: com.medalert.patient.data.model.Patient?,
    translate: (String) -> String
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Visit History"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    patient?.visits?.let { visits ->
                        if (visits.isEmpty()) {
                            Text(
                                text = translate("No visit history available"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            visits.forEach { visit ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp)
                                    ) {
                                        Text(
                                            text = visit.visitType.replace("_", " ").uppercase(),
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "${translate("Date")}: ${visit.visitDate}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        visit.doctorName?.let { doctorName ->
                                            Text(
                                                text = "${translate("Doctor")}: $doctorName",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        visit.diagnosis?.let { diagnosis ->
                                            Text(
                                                text = "${translate("Diagnosis")}: $diagnosis",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NotificationsTabContent(
    notifications: List<com.medalert.patient.data.model.MedicineNotification>,
    translate: (String) -> String
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Notification Management Header
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
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
                            text = translate("Medicine Notifications"),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        
                        Button(
                            onClick = { /* Add new notification */ }
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(translate("Add Notification"))
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = translate("Manage your medicine reminder notifications and alarm settings"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
            }
        }
        
        // Notification Statistics
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Notification Statistics"),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "${notifications.size}",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = translate("Active Notifications"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "${notifications.sumOf { it.notificationTimes.size }}",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            Text(
                                text = translate("Total Reminders"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "95%",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.tertiary
                            )
                            Text(
                                text = translate("Response Rate"),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
        
        // Notifications List
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Current Notifications"),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    if (notifications.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.NotificationsOff,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = translate("No notifications set up"),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = translate("Add medicine notifications to get timely reminders"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        }
                    } else {
                        notifications.forEach { notification ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = notification.medicineName,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        
                                        Row {
                                            IconButton(onClick = { /* Edit notification */ }) {
                                                Icon(
                                                    Icons.Default.Edit,
                                                    contentDescription = translate("Edit notification"),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                            IconButton(onClick = { /* Delete notification */ }) {
                                                Icon(
                                                    Icons.Default.Delete,
                                                    contentDescription = translate("Delete notification"),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                    
                                    Text(
                                        text = "${translate("Dosage")}: ${notification.dosage}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = "${translate("Times")}: ${notification.notificationTimes.joinToString(", ") { it.time }}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CaretakerTabContent(
    patient: com.medalert.patient.data.model.Patient?,
    patientViewModel: PatientViewModel,
    translate: (String) -> String
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Caretaker Management Header
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
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
                            text = translate("Caretaker Management"),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        
                        Button(
                            onClick = { /* Add new caretaker */ }
                        ) {
                            Icon(Icons.Default.PersonAdd, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(translate("Add Caretaker"))
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = translate("Manage your caretaker relationships and approval requests"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
            }
        }
        
        // Current Caretaker
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Current Caretaker"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    patient?.selectedCaretaker?.let { caretaker ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = caretaker.caretakerName,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Text(
                                            text = caretaker.caretakerEmail,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                        Text(
                                            text = "${translate("Assigned")}: ${caretaker.assignedAt}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer
                                        )
                                    }
                                    
                                    Row {
                                        IconButton(onClick = { /* Contact caretaker */ }) {
                                            Icon(
                                                Icons.Default.Message,
                                                contentDescription = translate("Contact caretaker"),
                                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                        }
                                        IconButton(onClick = { /* Remove caretaker */ }) {
                                            Icon(
                                                Icons.Default.Remove,
                                                contentDescription = translate("Remove caretaker"),
                                                tint = MaterialTheme.colorScheme.onPrimaryContainer
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    } ?: run {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.PersonOff,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = translate("No caretaker assigned"),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = translate("Add a caretaker to help manage your health"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }
        }
        
        // Caretaker Requests
        item {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = translate("Caretaker Requests"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    patient?.caretakerApprovals?.let { approvals ->
                        if (approvals.isEmpty()) {
                            Text(
                                text = translate("No pending requests"),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            approvals.forEach { approval ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = when (approval.status) {
                                            "approved" -> MaterialTheme.colorScheme.primaryContainer
                                            "rejected" -> MaterialTheme.colorScheme.errorContainer
                                            else -> MaterialTheme.colorScheme.surfaceVariant
                                        }
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp)
                                    ) {
                                        Text(
                                            text = "${translate("Status")}: ${approval.status.uppercase()}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "${translate("Requested")}: ${approval.requestedAt}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardProfileInfoRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

@Composable
fun ScheduleTabContent(
    medications: List<com.medalert.patient.data.model.Medication>,
    onNavigateToCalendarSchedule: () -> Unit,
    patientViewModel: PatientViewModel,
    translate: (String) -> String
) {
    var showTimingDialog by remember { mutableStateOf(false) }
    var selectedMedication by remember { mutableStateOf<com.medalert.patient.data.model.Medication?>(null) }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
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
                        text = translate("Medicine Schedule"),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = translate("View your complete medication schedule and track adherence"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onNavigateToCalendarSchedule,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.CalendarToday, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(translate("View Calendar Schedule"))
                    }
                }
            }
        }
        
        if (medications.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Schedule,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = translate("No Medicines Scheduled"),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = translate("Add medicines to see your schedule"),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        )
                    }
                }
            }
        } else {
            items(medications) { medication ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        // Medicine Name Header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Medication,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = medication.name,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            Text(
                                text = "${medication.dosage}mg",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Frequency
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Repeat,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "${translate("Frequency")}: ${medication.frequency}",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Timings - More Prominent
                        val parsedTiming = parseTimingFromFrequency(medication)
                        android.util.Log.d("EnhancedDashboardScreen", "Medicine: ${medication.name}, timing array: ${medication.timing}, parsed timing: $parsedTiming")
                        if (parsedTiming.isNotEmpty()) {
                            Row(
                                verticalAlignment = Alignment.Top
                            ) {
                                Icon(
                                    Icons.Default.Schedule,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = translate("Daily Timings:"),
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    // Display timings as chips with edit buttons
                                    parsedTiming.forEachIndexed { timeIndex, time ->
                                        Card(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 2.dp),
                                            colors = CardDefaults.cardColors(
                                                containerColor = MaterialTheme.colorScheme.primaryContainer
                                            )
                                        ) {
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = time,
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                                )
                                                IconButton(
                                                    onClick = { /* TODO: Implement edit timing */ },
                                                    modifier = Modifier.size(20.dp)
                                                ) {
                                                    Icon(
                                                        Icons.Default.Edit,
                                                        contentDescription = "Edit timing",
                                                        modifier = Modifier.size(12.dp),
                                                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                                                    )
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Add timing button
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 2.dp)
                                            .clickable { 
                                                selectedMedication = medication
                                                showTimingDialog = true
                                            },
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                                        )
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(horizontal = 12.dp, vertical = 6.dp),
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                Icons.Default.Add,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp),
                                                tint = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Add Timing",
                                                style = MaterialTheme.typography.bodyMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                        }
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        
                        // Instructions
                        if (medication.instructions.isNotEmpty()) {
                            Row(
                                verticalAlignment = Alignment.Top
                            ) {
                                Icon(
                                    Icons.Default.Info,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Instructions: ${medication.instructions}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Timing Dialog
    if (showTimingDialog && selectedMedication != null) {
        NumericTimingDialog(
            medication = selectedMedication!!,
            onSave = { newTimings ->
                // Update the medication with new timings using the proper timing update method
                val medicineIndex = medications.indexOfFirst { it._id == selectedMedication!!._id }
                if (medicineIndex != -1) {
                    val timingStrings = newTimings.map { it.time }
                    patientViewModel.editMedicineTiming(medicineIndex, timingStrings)
                }
                showTimingDialog = false
                selectedMedication = null
            },
            onDismiss = {
                showTimingDialog = false
                selectedMedication = null
            }
        )
    }
}

/**
 * Parse timing from frequency field if timing array is empty or contains generic labels
 */
fun parseTimingFromFrequency(medication: com.medalert.patient.data.model.Medication): List<String> {
    try {
        // If timing array exists and has actual time values (HH:MM format), use it
        if (medication.timing.isNotEmpty()) {
            val timeRegex = Regex("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
            val validTimes = medication.timing.filter { timeRegex.matches(it) }
            if (validTimes.isNotEmpty()) {
                return validTimes
            }
        }

        // Parse from frequency field
        if (medication.frequency.isEmpty()) {
            return listOf("08:00") // Default to morning if no frequency
        }

        val frequency = medication.frequency.lowercase()
        val timing = mutableListOf<String>()

        // Common timing patterns
        if (frequency.contains("morning")) {
            timing.add("08:00")
        }
        if (frequency.contains("afternoon")) {
            timing.add("14:00")
        }
        if (frequency.contains("night") || frequency.contains("evening")) {
            timing.add("20:00")
        }

        // If no standard timings found, try to extract times from the string
        if (timing.isEmpty()) {
            val timeRegex = Regex("(\\d{1,2}):(\\d{2})")
            val matches = timeRegex.findAll(frequency)
            matches.forEach { match ->
                timing.add(match.value)
            }
        }

        // If still no timing found, use default
        if (timing.isEmpty()) {
            timing.add("08:00")
        }

        return timing
    } catch (e: Exception) {
        return listOf("08:00") // Default fallback
    }
}

enum class DashboardTab(
    val title: String,
    val icon: ImageVector
) {
    PROFILE("Profile", Icons.Default.Person),
    MEDICINES("Medicines", Icons.Default.Medication),
    SCHEDULE("Schedule", Icons.Default.Schedule),
    VISITS("Visits", Icons.Default.CalendarToday),
    NOTIFICATIONS("Notifications", Icons.Default.Notifications),
    CARETAKER("Caretaker", Icons.Default.People)
}
