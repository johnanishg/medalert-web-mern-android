package com.medalert.patient.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.NotificationTime
import com.medalert.patient.data.model.ScheduleEntry
import com.medalert.patient.ui.components.MedicationCard
import com.medalert.patient.ui.components.EditMedicineDialog
import com.medalert.patient.ui.components.MedicineScheduleEditor
import com.medalert.patient.ui.components.EditTimingDialog
import com.medalert.patient.ui.components.NumericTimingDialog
import com.medalert.patient.ui.components.CustomTimingDialog
import com.medalert.patient.services.MedicineScheduleCalculator
import com.medalert.patient.viewmodel.PatientViewModel
import com.medalert.patient.viewmodel.LanguageViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicationsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSchedule: (Medication) -> Unit = {},
    patientViewModel: PatientViewModel = hiltViewModel(),
    languageViewModel: LanguageViewModel = hiltViewModel()
) {
    val medications by patientViewModel.medications.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()
    
    // Translations
    val lang by languageViewModel.language.collectAsState()
    var uiTranslations by remember(lang) { mutableStateOf<Map<String, String>>(emptyMap()) }
    LaunchedEffect(lang) {
        val keys = listOf(
            "My Medications",
            "Back",
            "Refresh",
            "Add Medicine",
            "Sync Timing",
            "No medications yet",
            "Your prescribed medications will appear here",
            "No medications",
            "Create/Edit",
            "Edit timing",
            "Edit schedule",
            "Edit",
            "Delete",
            "Edit Medicine",
            "Edit Timing",
            "Edit Schedule",
            "View Schedule"
        )
        val translated = languageViewModel.translateBatch(keys, lang)
        uiTranslations = keys.mapIndexed { i, k -> k to (translated.getOrNull(i) ?: k) }.toMap()
    }
    fun t(key: String): String = uiTranslations[key] ?: key

    // Snackbar for error messages
    val snackbarHostState = remember { SnackbarHostState() }
    
    var showTimingDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showScheduleEditor by remember { mutableStateOf(false) }
    var showEditTimingDialog by remember { mutableStateOf(false) }
    var selectedMedication by remember { mutableStateOf<Medication?>(null) }
    var selectedMedicationIndex by remember { mutableStateOf(-1) }
    
    // Schedule calculator instance
    val scheduleCalculator = remember { MedicineScheduleCalculator() }
    
    // Load data when screen opens
    LaunchedEffect(Unit) {
        patientViewModel.refreshAllData()
    }
    
    // Show error messages
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(
                message = error,
                duration = SnackbarDuration.Long
            )
            patientViewModel.clearError()
        }
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top App Bar
        TopAppBar(
            title = { Text(t("My Medications")) },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = t("Back"))
                }
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
                
                IconButton(onClick = { 
                    selectedMedication = null
                    selectedMedicationIndex = -1
                    showEditDialog = true 
                }) {
                    Icon(Icons.Default.Add, contentDescription = t("Add Medicine"))
                }
                
                IconButton(onClick = { 
                    patientViewModel.refreshAllData()
                    // Also trigger timing sync
                    patientViewModel.syncMedicineTimingFromWeb(-1) // -1 means sync all
                }) {
                    Icon(Icons.Default.Sync, contentDescription = t("Sync Timing"))
                }
            }
        )
        
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (medications.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MedicalServices,
                                    contentDescription = t("No medications"),
                                    modifier = Modifier.size(64.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = t("No medications yet"),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = t("Your prescribed medications will appear here"),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    itemsIndexed(medications) { index, medication ->
                        MedicationCard(
                            medication = medication,
                            onRecordAdherence = { taken ->
                                patientViewModel.recordAdherence(index, taken)
                            },
                            onEditTiming = {
                                selectedMedication = medication
                                selectedMedicationIndex = index
                                showTimingDialog = true
                            },
                            onEditQuickTiming = {
                                selectedMedication = medication
                                selectedMedicationIndex = index
                                showEditTimingDialog = true
                            },
                            onEditSchedule = {
                                selectedMedication = medication
                                selectedMedicationIndex = index
                                showScheduleEditor = true
                            },
                            onEdit = {
                                selectedMedication = medication
                                selectedMedicationIndex = index
                                showEditDialog = true
                            },
                            onDelete = {
                                patientViewModel.deleteMedicine(index)
                            },
                            onViewSchedule = {
                                onNavigateToSchedule(medication)
                            },
                            showActions = true,
                            translate = { key -> t(key) }
                        )
                    }
                }
            }
        }
    }
    
    // Custom Timing Dialog
    if (showTimingDialog && selectedMedication != null) {
        CustomTimingDialog(
            medication = selectedMedication!!,
            onDismiss = { 
                showTimingDialog = false
                selectedMedication = null
                selectedMedicationIndex = -1
            },
            onSave = { scheduledDoses ->
                patientViewModel.updateMedicationSchedule(selectedMedication!!, scheduledDoses)
                showTimingDialog = false
                selectedMedication = null
                selectedMedicationIndex = -1
            }
        )
    }
    
    // Edit Medicine Dialog
    if (showEditDialog) {
        EditMedicineDialog(
            medication = selectedMedication,
            onDismiss = { 
                showEditDialog = false
                selectedMedication = null
                selectedMedicationIndex = -1
            },
            onSave = { updatedMedication ->
                if (selectedMedicationIndex == -1) {
                    // Add new medicine
                    patientViewModel.addMedicine(updatedMedication)
                } else {
                    // Update existing medicine
                    patientViewModel.updateMedicine(selectedMedicationIndex, updatedMedication)
                }
                showEditDialog = false
                selectedMedication = null
                selectedMedicationIndex = -1
            }
        )
    }
    
    // Schedule Editor Dialog
    if (showScheduleEditor && selectedMedication != null) {
        MedicineScheduleEditor(
            medication = selectedMedication!!,
            scheduleCalculator = scheduleCalculator,
            onScheduleUpdated = { updatedSchedule ->
                // Update the medication with the new schedule
                val updatedMedication = selectedMedication!!.copy(
                    customSchedule = updatedSchedule
                )
                patientViewModel.updateMedicine(selectedMedicationIndex, updatedMedication)
            },
            onDismiss = {
                showScheduleEditor = false
                selectedMedication = null
                selectedMedicationIndex = -1
            }
        )
    }
    
    // Edit Timing Dialog
    if (showEditTimingDialog && selectedMedication != null) {
        NumericTimingDialog(
            medication = selectedMedication!!,
            onSave = { newTimings ->
                val timingStrings = newTimings.map { it.time }
                patientViewModel.editMedicineTiming(selectedMedicationIndex, timingStrings)
            },
            onDismiss = {
                showEditTimingDialog = false
                selectedMedication = null
                selectedMedicationIndex = -1
            }
        )
    }
    
    // Snackbar for error messages
    SnackbarHost(
        hostState = snackbarHostState,
        modifier = Modifier.fillMaxSize()
    )
}