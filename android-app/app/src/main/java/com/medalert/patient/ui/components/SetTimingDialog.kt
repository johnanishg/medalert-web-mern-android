package com.medalert.patient.ui.components

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
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.NotificationTime

@Composable
fun SetTimingDialog(
    medication: Medication,
    onDismiss: () -> Unit,
    onSave: (List<NotificationTime>) -> Unit,
    onEditTiming: ((List<String>) -> Unit)? = null
) {
    var notificationTimes by remember { 
        mutableStateOf(
            if (medication.timing.isNotEmpty()) {
                medication.timing.map { time ->
                    NotificationTime(time = time, label = "Custom", isActive = true)
                }
            } else {
                listOf(NotificationTime(time = "08:00", label = "Morning", isActive = true))
            }
        )
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Set Medication Timings",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column {
                Text(
                    text = "${medication.name} - ${medication.dosage}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Timing Edit Section
                onEditTiming?.let { editTimingCallback ->
                    TimingEditSection(
                        currentTiming = medication.timing,
                        onTimingUpdate = editTimingCallback
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                }
                
                Text(
                    text = "Scheduled Times:",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Summary of all timings
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Total Timings:",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "${notificationTimes.size} times/day",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                LazyColumn(
                    modifier = Modifier.height(200.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    itemsIndexed(notificationTimes) { index, notificationTime ->
                        TimingRow(
                            notificationTime = notificationTime,
                            index = index + 1,
                            onTimeChange = { newTime ->
                                notificationTimes = notificationTimes.toMutableList().apply {
                                    this[index] = this[index].copy(time = newTime)
                                }
                            },
                            onRemove = if (notificationTimes.size > 1) {
                                {
                                    notificationTimes = notificationTimes.toMutableList().apply {
                                        removeAt(index)
                                    }
                                }
                            } else null
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                TextButton(
                    onClick = {
                        notificationTimes = notificationTimes + NotificationTime(
                            time = "08:00",
                            label = "Custom",
                            isActive = true
                        )
                    }
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Another Time")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Text(
                        text = "Note: Reminders will be sent at the scheduled times. Make sure to enable notifications for this app.",
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(12.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(notificationTimes) }
            ) {
                Text("Save Timings")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimingRow(
    notificationTime: NotificationTime,
    index: Int,
    onTimeChange: (String) -> Unit,
    onRemove: (() -> Unit)?
) {
    var showTimePicker by remember { mutableStateOf(false) }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Timing number indicator
        Card(
            modifier = Modifier.size(32.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primary
            ),
            shape = androidx.compose.foundation.shape.CircleShape
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = index.toString(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onPrimary,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        OutlinedTextField(
            value = notificationTime.time,
            onValueChange = onTimeChange,
            label = { Text("Time $index") },
            leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = "Time") },
            modifier = Modifier.weight(1f),
            singleLine = true,
            placeholder = { Text("HH:MM") }
        )
        
        onRemove?.let { removeAction ->
            IconButton(onClick = removeAction) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Remove",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun TimingEditSection(
    currentTiming: List<String>,
    onTimingUpdate: (List<String>) -> Unit
) {
    var selectedTimings by remember { mutableStateOf(currentTiming.toMutableSet()) }
    var showCustomTimeInput by remember { mutableStateOf(false) }
    var customTime by remember { mutableStateOf("") }
    var showTimePicker by remember { mutableStateOf(false) }
    var customTimeError by remember { mutableStateOf("") }
    
    val predefinedTimings = listOf(
        "morning" to "Morning (8:00 AM)",
        "afternoon" to "Afternoon (2:00 PM)", 
        "evening" to "Evening (6:00 PM)",
        "night" to "Night (8:00 PM)"
    )
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Text(
                text = "Edit Basic Timing",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Current: ${if (currentTiming.isEmpty()) "No timing set" else currentTiming.joinToString(", ")}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Predefined timing options
            predefinedTimings.forEach { (timing, displayName) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = selectedTimings.contains(timing),
                        onCheckedChange = { isChecked ->
                            if (isChecked) {
                                selectedTimings.add(timing)
                            } else {
                                selectedTimings.remove(timing)
                            }
                        }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = displayName,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            
            // Custom time input
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = showCustomTimeInput,
                    onCheckedChange = { 
                        showCustomTimeInput = it
                        if (!it) {
                            customTime = ""
                            customTimeError = ""
                        }
                    }
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Add Custom Time",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            if (showCustomTimeInput) {
                Spacer(modifier = Modifier.height(8.dp))
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = customTime,
                            onValueChange = { newTime ->
                                customTime = newTime
                                customTimeError = validateTime(newTime)
                            },
                            label = { Text("Time (HH:MM)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            placeholder = { Text("e.g., 09:30") },
                            isError = customTimeError.isNotEmpty(),
                            supportingText = if (customTimeError.isNotEmpty()) {
                                { Text(customTimeError) }
                            } else null,
                            trailingIcon = {
                                IconButton(
                                    onClick = { showTimePicker = true }
                                ) {
                                    Icon(
                                        Icons.Default.Schedule,
                                        contentDescription = "Time Picker",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (customTime.isNotEmpty() && customTimeError.isEmpty()) {
                                    val formattedTime = formatTime(customTime)
                                    if (formattedTime.isNotEmpty()) {
                                        selectedTimings.add(formattedTime)
                                        customTime = ""
                                        customTimeError = ""
                                        showCustomTimeInput = false
                                    }
                                }
                            },
                            enabled = customTime.isNotEmpty() && customTimeError.isEmpty()
                        ) {
                            Text("Add")
                        }
                    }
                    
                    // Time picker dialog
                    if (showTimePicker) {
                        TimePickerDialog(
                            initialTime = customTime,
                            onTimeSelected = { time ->
                                customTime = time
                                customTimeError = validateTime(time)
                                showTimePicker = false
                            },
                            onDismiss = { showTimePicker = false }
                        )
                    }
                }
            }
            
            // Selected timings display
            if (selectedTimings.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(8.dp)
                    ) {
                        Text(
                            text = "Selected:",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium
                        )
                        selectedTimings.forEach { timing ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "• $timing",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                IconButton(
                                    onClick = { selectedTimings.remove(timing) },
                                    modifier = Modifier.size(16.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Remove,
                                        contentDescription = "Remove",
                                        tint = MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(12.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Update button
            Button(
                onClick = {
                    onTimingUpdate(selectedTimings.toList())
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = selectedTimings != currentTiming.toSet()
            ) {
                Text("Update Timing")
            }
        }
    }
}

// Helper functions for time validation and formatting
private fun validateTime(time: String): String {
    if (time.isEmpty()) return ""
    
    // Allow various formats: HH:MM, H:MM, HH:M, H:M
    val timeRegex = Regex("^\\d{1,2}:\\d{1,2}$")
    if (!timeRegex.matches(time)) {
        return "Please enter time in HH:MM format"
    }
    
    val parts = time.split(":")
    val hours = parts[0].toIntOrNull()
    val minutes = parts[1].toIntOrNull()
    
    if (hours == null || minutes == null) {
        return "Invalid time format"
    }
    
    if (hours < 0 || hours > 23) {
        return "Hours must be between 0-23"
    }
    
    if (minutes < 0 || minutes > 59) {
        return "Minutes must be between 0-59"
    }
    
    return ""
}

private fun formatTime(time: String): String {
    if (time.isEmpty()) return ""
    
    val parts = time.split(":")
    val hours = parts[0].toIntOrNull() ?: return ""
    val minutes = parts[1].toIntOrNull() ?: return ""
    
    return String.format("%02d:%02d", hours, minutes)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimePickerDialog(
    initialTime: String,
    onTimeSelected: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val timeParts = if (initialTime.isNotEmpty() && initialTime.contains(":")) {
        val parts = initialTime.split(":")
        val hours = parts[0].toIntOrNull() ?: 8
        val minutes = parts[1].toIntOrNull() ?: 0
        hours to minutes
    } else {
        8 to 0
    }
    
    var selectedHours by remember { mutableStateOf(timeParts.first) }
    var selectedMinutes by remember { mutableStateOf(timeParts.second) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Select Time",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Choose the time for your medication",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Time picker
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Hours picker
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Hours",
                            style = MaterialTheme.typography.labelMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = {
                                    selectedHours = if (selectedHours > 0) selectedHours - 1 else 23
                                }
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = "Decrease hours")
                            }
                            Text(
                                text = String.format("%02d", selectedHours),
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            IconButton(
                                onClick = {
                                    selectedHours = if (selectedHours < 23) selectedHours + 1 else 0
                                }
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Increase hours")
                            }
                        }
                    }
                    
                    Text(
                        text = ":",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    // Minutes picker
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Minutes",
                            style = MaterialTheme.typography.labelMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = {
                                    selectedMinutes = if (selectedMinutes > 0) selectedMinutes - 1 else 59
                                }
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = "Decrease minutes")
                            }
                            Text(
                                text = String.format("%02d", selectedMinutes),
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            IconButton(
                                onClick = {
                                    selectedMinutes = if (selectedMinutes < 59) selectedMinutes + 1 else 0
                                }
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Increase minutes")
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Quick time buttons
                Text(
                    text = "Quick Select:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("08:00", "12:00", "18:00", "20:00").forEach { time ->
                        val quickTimeParts = time.split(":")
                        val hours = quickTimeParts[0].toInt()
                        val minutes = quickTimeParts[1].toInt()
                        
                        AssistChip(
                            onClick = {
                                selectedHours = hours
                                selectedMinutes = minutes
                            },
                            label = { Text(time) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val formattedTime = String.format("%02d:%02d", selectedHours, selectedMinutes)
                    onTimeSelected(formattedTime)
                }
            ) {
                Text("Select")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}