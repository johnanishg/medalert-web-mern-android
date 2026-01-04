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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.NotificationTime
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NumericTimingDialog(
    medication: Medication,
    onSave: (List<NotificationTime>) -> Unit,
    onDismiss: () -> Unit
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
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f),
            shape = MaterialTheme.shapes.large
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
                        text = "Set Medication Times",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Medicine info
                Text(
                    text = "${medication.name} - ${medication.dosage}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Summary card
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
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "${notificationTimes.size} times/day",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Scheduled Times:",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Timing list
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    itemsIndexed(notificationTimes) { index, notificationTime ->
                        NumericTimingRow(
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
                
                // Add timing button
                OutlinedButton(
                    onClick = {
                        notificationTimes = notificationTimes + NotificationTime(
                            time = "08:00",
                            label = "Custom",
                            isActive = true
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add Another Time")
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
                        onClick = { onSave(notificationTimes) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save Times")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NumericTimingRow(
    notificationTime: NotificationTime,
    index: Int,
    onTimeChange: (String) -> Unit,
    onRemove: (() -> Unit)?
) {
    var showTimePicker by remember { mutableStateOf(false) }
    var timeError by remember { mutableStateOf("") }
    
    // Parse current time
    val currentTime = try {
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        timeFormat.parse(notificationTime.time) ?: Date()
    } catch (e: Exception) {
        Date()
    }
    
    val currentHour = currentTime.hours
    val currentMinute = currentTime.minutes
    
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
                // Timing number indicator
                Card(
                    modifier = Modifier.size(28.dp),
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
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Time input field
            OutlinedTextField(
                value = notificationTime.time,
                onValueChange = { newTime ->
                    timeError = ""
                    // Validate time format
                    if (isValidTimeFormat(newTime)) {
                        onTimeChange(newTime)
                    } else if (newTime.length <= 5) {
                        // Allow partial input while typing
                        onTimeChange(newTime)
                    }
                },
                label = { Text("Time $index") },
                leadingIcon = { Icon(Icons.Default.Schedule, contentDescription = "Time") },
                trailingIcon = {
                    IconButton(onClick = { showTimePicker = true }) {
                        Icon(Icons.Default.AccessTime, contentDescription = "Time Picker")
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("HH:MM") },
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                    keyboardType = KeyboardType.Number
                ),
                isError = timeError.isNotEmpty(),
                supportingText = if (timeError.isNotEmpty()) {
                    { Text(timeError) }
                } else {
                    { Text("Enter time in HH:MM format (24-hour)") }
                }
            )
            
            // Quick time buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf("08:00", "12:00", "18:00", "20:00").forEach { quickTime ->
                    OutlinedButton(
                        onClick = { onTimeChange(quickTime) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = quickTime,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }
        }
    }
    
    // Time picker dialog
    if (showTimePicker) {
        TimePickerDialog(
            initialHour = currentHour,
            initialMinute = currentMinute,
            onTimeSelected = { hour, minute ->
                val formattedTime = String.format("%02d:%02d", hour, minute)
                onTimeChange(formattedTime)
                showTimePicker = false
            },
            onDismiss = { showTimePicker = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimePickerDialog(
    initialHour: Int,
    initialMinute: Int,
    onTimeSelected: (Int, Int) -> Unit,
    onDismiss: () -> Unit
) {
    val timePickerState = rememberTimePickerState(
        initialHour = initialHour,
        initialMinute = initialMinute
    )
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Time") },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                TimePicker(
                    state = timePickerState
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onTimeSelected(timePickerState.hour, timePickerState.minute) }
            ) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun isValidTimeFormat(time: String): Boolean {
    return try {
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        timeFormat.isLenient = false
        timeFormat.parse(time)
        true
    } catch (e: Exception) {
        false
    }
}
