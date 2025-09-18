package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.ScheduledDose
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomTimingDialog(
    medication: Medication,
    onSave: (List<ScheduledDose>) -> Unit,
    onDismiss: () -> Unit
) {
    // Initialize with existing doses or generate default ones based on frequency
    var selectedDoses by remember { 
        mutableStateOf(
            if (medication.scheduledDoses.isNotEmpty()) {
                medication.scheduledDoses.toMutableList()
            } else {
                generateDefaultDosesFromFrequency(medication).toMutableList()
            }
        )
    }
    var showAddTimeDialog by remember { mutableStateOf(false) }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
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
                    Text(
                        text = "Medicine Schedule - ${medication.name}",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Current schedule display
                if (selectedDoses.isNotEmpty()) {
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
                                Text(
                                    text = "Current Schedule",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                
                                // Show auto-generated indicator if any doses are auto-generated
                                if (selectedDoses.any { it.notes.contains("Auto-generated") }) {
                                    Card(
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                                        )
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                Icons.Default.AutoAwesome,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp),
                                                tint = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Auto-generated",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSecondaryContainer
                                            )
                                        }
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            // Show helpful text for auto-generated schedules
                            if (selectedDoses.any { it.notes.contains("Auto-generated") }) {
                                Text(
                                    text = "Timings were automatically set based on your prescription frequency. You can edit or add more times as needed.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(bottom = 8.dp)
                                )
                            }
                            
                            selectedDoses.forEach { dose ->
                                CustomDoseCard(
                                    dose = dose,
                                    onEdit = { updatedDose ->
                                        val index = selectedDoses.indexOfFirst { it.id == dose.id }
                                        if (index != -1) {
                                            selectedDoses[index] = updatedDose
                                        }
                                    },
                                    onDelete = {
                                        selectedDoses.remove(dose)
                                    }
                                )
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Add new time button
                Button(
                    onClick = { showAddTimeDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add New Time")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            onSave(selectedDoses)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save Schedule")
                    }
                }
            }
        }
    }
    
    // Add time dialog
    if (showAddTimeDialog) {
        AddCustomTimeDialog(
            medication = medication,
            onSave = { newDose ->
                selectedDoses.add(newDose)
                showAddTimeDialog = false
            },
            onDismiss = { showAddTimeDialog = false }
        )
    }
}

@Composable
fun CustomDoseCard(
    dose: ScheduledDose,
    onEdit: (ScheduledDose) -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${dose.time}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Dosage: ${dose.dosage}",
                    style = MaterialTheme.typography.bodyMedium
                )
                if (dose.notes.isNotEmpty()) {
                    Text(
                        text = dose.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Row {
                IconButton(onClick = { onEdit(dose) }) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit")
                }
                IconButton(onClick = onDelete) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Delete",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun AddCustomTimeDialog(
    medication: Medication,
    onSave: (ScheduledDose) -> Unit,
    onDismiss: () -> Unit
) {
    var time by remember { mutableStateOf("") }
    var dosage by remember { mutableStateOf(medication.dosage) }
    var notes by remember { mutableStateOf("") }
    var selectedDays by remember { mutableStateOf(setOf<Int>()) }
    
    val daysOfWeek = listOf(
        "Sun" to 0, "Mon" to 1, "Tue" to 2, "Wed" to 3,
        "Thu" to 4, "Fri" to 5, "Sat" to 6
    )
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Add New Time",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Time input
                    item {
                        OutlinedTextField(
                            value = time,
                            onValueChange = { time = it },
                            label = { Text("Time (HH:MM)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            placeholder = { Text("e.g., 08:00") },
                            leadingIcon = {
                                Icon(Icons.Default.Schedule, contentDescription = "Time")
                            }
                        )
                    }
                    
                    // Dosage
                    item {
                        OutlinedTextField(
                            value = dosage,
                            onValueChange = { dosage = it },
                            label = { Text("Dosage") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = {
                                Icon(Icons.Default.Medication, contentDescription = "Dosage")
                            }
                        )
                    }
                    
                    // Days of week
                    item {
                        Text(
                            text = "Days of Week",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            daysOfWeek.forEach { (dayName, dayValue) ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Checkbox(
                                        checked = selectedDays.contains(dayValue),
                                        onCheckedChange = { checked ->
                                            if (checked) {
                                                selectedDays = selectedDays + dayValue
                                            } else {
                                                selectedDays = selectedDays - dayValue
                                            }
                                        }
                                    )
                                    Text(
                                        text = dayName,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }
                    
                    // Notes
                    item {
                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            label = { Text("Notes (Optional)") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3,
                            leadingIcon = {
                                Icon(Icons.Default.Note, contentDescription = "Notes")
                            }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            if (time.isNotEmpty() && selectedDays.isNotEmpty()) {
                                val newDose = ScheduledDose(
                                    id = UUID.randomUUID().toString(),
                                    time = time,
                                    label = "Custom", // Always use "Custom" since we removed presets
                                    dosage = dosage,
                                    daysOfWeek = selectedDays.toList(),
                                    notes = notes
                                )
                                onSave(newDose)
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = time.isNotEmpty() && selectedDays.isNotEmpty()
                    ) {
                        Text("Add Time")
                    }
                }
            }
        }
    }
}

/**
 * Generate default scheduled doses based on medication frequency
 */
fun generateDefaultDosesFromFrequency(medication: Medication): List<ScheduledDose> {
    val frequency = medication.frequency.lowercase()
    val dosage = medication.dosage
    val defaultDays = listOf(0, 1, 2, 3, 4, 5, 6) // All days of week
    
    return when {
        frequency.contains("once") || frequency.contains("1") -> {
            listOf(
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "08:00",
                    label = "Morning",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                )
            )
        }
        frequency.contains("twice") || frequency.contains("2") || frequency.contains("bid") -> {
            listOf(
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "08:00",
                    label = "Morning",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                ),
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "20:00",
                    label = "Evening",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                )
            )
        }
        frequency.contains("three") || frequency.contains("3") || frequency.contains("tid") -> {
            listOf(
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "08:00",
                    label = "Morning",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                ),
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "14:00",
                    label = "Afternoon",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                ),
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "20:00",
                    label = "Evening",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                )
            )
        }
        frequency.contains("four") || frequency.contains("4") || frequency.contains("qid") -> {
            listOf(
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "08:00",
                    label = "Morning",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                ),
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "12:00",
                    label = "Noon",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                ),
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "16:00",
                    label = "Afternoon",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                ),
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "20:00",
                    label = "Evening",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated from prescription"
                )
            )
        }
        frequency.contains("every") && frequency.contains("hour") -> {
            // For medications taken every few hours, create a basic schedule
            val hours = extractHoursFromFrequency(frequency)
            if (hours > 0) {
                generateHourlySchedule(hours, dosage, defaultDays)
            } else {
                // Default to every 6 hours if can't parse
                generateHourlySchedule(6, dosage, defaultDays)
            }
        }
        else -> {
            // Default to once daily if frequency is unclear
            listOf(
                ScheduledDose(
                    id = UUID.randomUUID().toString(),
                    time = "08:00",
                    label = "Default",
                    dosage = dosage,
                    daysOfWeek = defaultDays,
                    notes = "Auto-generated - please adjust as needed"
                )
            )
        }
    }
}

/**
 * Extract number of hours from frequency string (e.g., "every 6 hours" -> 6)
 */
private fun extractHoursFromFrequency(frequency: String): Int {
    val regex = Regex("every\\s+(\\d+)\\s+hour")
    val match = regex.find(frequency)
    return match?.groupValues?.get(1)?.toIntOrNull() ?: 0
}

/**
 * Generate hourly schedule based on interval
 */
private fun generateHourlySchedule(intervalHours: Int, dosage: String, daysOfWeek: List<Int>): List<ScheduledDose> {
    val doses = mutableListOf<ScheduledDose>()
    var hour = 8 // Start at 8 AM
    
    while (hour < 24) {
        val timeString = String.format("%02d:00", hour)
        val label = when (hour) {
            in 6..11 -> "Morning"
            in 12..17 -> "Afternoon"
            in 18..23 -> "Evening"
            else -> "Night"
        }
        
        doses.add(
            ScheduledDose(
                id = UUID.randomUUID().toString(),
                time = timeString,
                label = label,
                dosage = dosage,
                daysOfWeek = daysOfWeek,
                notes = "Auto-generated - every $intervalHours hours"
            )
        )
        
        hour += intervalHours
    }
    
    return doses
}
