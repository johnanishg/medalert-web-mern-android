package com.medalert.patient.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.data.model.*
import com.medalert.patient.ui.components.CustomTimingDialog
import com.medalert.patient.viewmodel.PatientViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicationScheduleScreen(
    medication: Medication,
    onNavigateBack: () -> Unit,
    patientViewModel: PatientViewModel = hiltViewModel()
) {
    val uiState by patientViewModel.uiState.collectAsState()
    var showEditScheduleDialog by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf(getCurrentDate()) }
    
    // Generate today's schedule
    val todaysSchedule = remember(medication.scheduledDoses, selectedDate) {
        generateTodaysSchedule(medication, selectedDate)
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top App Bar
        TopAppBar(
            title = { 
                Column {
                    Text("${medication.name} Schedule")
                    Text(
                        text = "Dosage: ${medication.dosage}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
                        contentDescription = "Refresh",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                IconButton(onClick = { showEditScheduleDialog = true }) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit Schedule")
                }
            }
        )
        
        // Date selector
        DateSelector(
            selectedDate = selectedDate,
            onDateSelected = { selectedDate = it }
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
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (todaysSchedule.isEmpty()) {
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
                                    imageVector = Icons.Default.Schedule,
                                    contentDescription = "No schedule",
                                    modifier = Modifier.size(64.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "No doses scheduled",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Add schedule times to track your medication",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(todaysSchedule) { doseSchedule ->
                        DoseScheduleCard(
                            doseSchedule = doseSchedule,
                            onMarkTaken = { doseRecord ->
                                patientViewModel.recordDoseTaken(doseRecord)
                            },
                            onMarkMissed = { doseRecord ->
                                patientViewModel.recordDoseMissed(doseRecord)
                            },
                            onMarkSkipped = { doseRecord ->
                                patientViewModel.recordDoseSkipped(doseRecord)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // Edit schedule dialog
    if (showEditScheduleDialog) {
        CustomTimingDialog(
            medication = medication,
            onSave = { updatedSchedule ->
                patientViewModel.updateMedicationSchedule(medication, updatedSchedule)
                showEditScheduleDialog = false
            },
            onDismiss = { showEditScheduleDialog = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateSelector(
    selectedDate: String,
    onDateSelected: (String) -> Unit
) {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val calendar = Calendar.getInstance()
    
    // Generate dates for the next 7 days
    val dates = remember {
        (0..6).map { daysOffset ->
            calendar.timeInMillis = System.currentTimeMillis() + (daysOffset * 24 * 60 * 60 * 1000L)
            dateFormat.format(calendar.time)
        }
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        LazyColumn(
            modifier = Modifier.padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(dates) { date ->
                val isSelected = date == selectedDate
                val isToday = date == getCurrentDate()
                
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = when {
                            isSelected -> MaterialTheme.colorScheme.primary
                            isToday -> MaterialTheme.colorScheme.primaryContainer
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    ),
                    onClick = { onDateSelected(date) }
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = formatDateForDisplay(date),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                        if (isToday) {
                            Text(
                                text = "Today",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DoseScheduleCard(
    doseSchedule: DoseSchedule,
    onMarkTaken: (DoseRecord) -> Unit,
    onMarkMissed: (DoseRecord) -> Unit,
    onMarkSkipped: (DoseRecord) -> Unit
) {
    val statusColor = when (doseSchedule.status) {
        DoseStatus.TAKEN -> Color(0xFF4CAF50) // Green
        DoseStatus.MISSED -> Color(0xFFF44336) // Red
        DoseStatus.SKIPPED -> Color(0xFFFF9800) // Orange
        DoseStatus.LATE -> Color(0xFF9C27B0) // Purple
        DoseStatus.PENDING -> Color(0xFF2196F3) // Blue
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with time and status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "${doseSchedule.scheduledDose.label} - ${doseSchedule.scheduledDose.time}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Dosage: ${doseSchedule.scheduledDose.dosage}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                // Status indicator
                Card(
                    colors = CardDefaults.cardColors(containerColor = statusColor.copy(alpha = 0.1f))
                ) {
                    Text(
                        text = doseSchedule.status.name,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }
            }
            
            // Actual time if taken
            if (doseSchedule.actualTime.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Taken at: ${doseSchedule.actualTime}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Notes if any
            if (doseSchedule.notes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Notes: ${doseSchedule.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Action buttons for pending doses
            if (doseSchedule.status == DoseStatus.PENDING) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { onMarkTaken(doseSchedule.toDoseRecord()) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF4CAF50)
                        )
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Taken")
                    }
                    
                    OutlinedButton(
                        onClick = { onMarkMissed(doseSchedule.toDoseRecord()) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Missed")
                    }
                    
                    OutlinedButton(
                        onClick = { onMarkSkipped(doseSchedule.toDoseRecord()) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.SkipNext, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Skip")
                    }
                }
            }
        }
    }
}

// Data classes for schedule display
data class DoseSchedule(
    val scheduledDose: ScheduledDose,
    val scheduledDate: String,
    val status: DoseStatus,
    val actualTime: String = "",
    val actualDate: String = "",
    val notes: String = ""
) {
    fun toDoseRecord(): DoseRecord {
        return DoseRecord(
            id = UUID.randomUUID().toString(),
            scheduledDoseId = scheduledDose.id,
            scheduledTime = scheduledDose.time,
            scheduledDate = scheduledDate,
            actualTime = actualTime,
            actualDate = actualDate,
            status = status,
            notes = notes,
            recordedAt = getCurrentDateTime(),
            recordedBy = "patient"
        )
    }
}

// Helper functions
fun getCurrentDate(): String {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    return dateFormat.format(Date())
}

fun getCurrentDateTime(): String {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
    return dateFormat.format(Date())
}

fun getCurrentTime(): String {
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    return timeFormat.format(Date())
}

fun formatDateForDisplay(dateString: String): String {
    val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val outputFormat = SimpleDateFormat("MMM dd", Locale.getDefault())
    return try {
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        dateString
    }
}

fun generateTodaysSchedule(medication: Medication, selectedDate: String): List<DoseSchedule> {
    val calendar = Calendar.getInstance()
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val dayOfWeek = try {
        val date = dateFormat.parse(selectedDate)
        calendar.time = date ?: Date()
        calendar.get(Calendar.DAY_OF_WEEK) - 1 // Convert to 0-based (0=Sunday)
    } catch (e: Exception) {
        0
    }
    
    return medication.scheduledDoses
        .filter { it.isActive && (it.daysOfWeek.isEmpty() || it.daysOfWeek.contains(dayOfWeek)) }
        .map { scheduledDose ->
            // Check if there's an existing record for this dose
            val existingRecord = medication.doseRecords.find { record ->
                record.scheduledDoseId == scheduledDose.id && record.scheduledDate == selectedDate
            }
            
            DoseSchedule(
                scheduledDose = scheduledDose,
                scheduledDate = selectedDate,
                status = existingRecord?.status ?: DoseStatus.PENDING,
                actualTime = existingRecord?.actualTime ?: "",
                actualDate = existingRecord?.actualDate ?: "",
                notes = existingRecord?.notes ?: ""
            )
        }
        .sortedBy { it.scheduledDose.time }
}
