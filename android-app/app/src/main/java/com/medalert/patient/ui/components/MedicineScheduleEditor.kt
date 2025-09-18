package com.medalert.patient.ui.components

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.ScheduleEntry
import com.medalert.patient.services.MedicineScheduleCalculator
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MedicineScheduleEditor(
    medication: Medication,
    scheduleCalculator: MedicineScheduleCalculator,
    onScheduleUpdated: (List<ScheduleEntry>) -> Unit,
    onDismiss: () -> Unit
) {
    var schedule by remember { mutableStateOf(scheduleCalculator.calculateSchedule(medication)) }
    var showAddEntry by remember { mutableStateOf(false) }
    var selectedEntry by remember { mutableStateOf<ScheduleEntry?>(null) }
    
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
                        text = "Edit Schedule - ${medication.name}",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Schedule Summary
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
                            text = "Schedule Summary",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = scheduleCalculator.getScheduleSummary(medication),
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Text(
                            text = "Remaining days: ${scheduleCalculator.getRemainingDays(medication)}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Add Entry Button
                Button(
                    onClick = { showAddEntry = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add Schedule Entry")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Schedule Entries List
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(schedule.sortedWith(compareBy<ScheduleEntry> { it.date }.thenBy { it.time })) { entry ->
                        ScheduleEntryCard(
                            entry = entry,
                            onEdit = { selectedEntry = entry },
                            onDelete = {
                                schedule = schedule.filter { it != entry }
                            },
                            onToggleActive = {
                                schedule = schedule.map { 
                                    if (it == entry) it.copy(isActive = !it.isActive) else it 
                                }
                            }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Action Buttons
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
                            onScheduleUpdated(schedule)
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
    
    // Add Entry Dialog
    if (showAddEntry) {
        AddScheduleEntryDialog(
            onAdd = { newEntry ->
                schedule = schedule + newEntry
                showAddEntry = false
            },
            onDismiss = { showAddEntry = false }
        )
    }
    
    // Edit Entry Dialog
    selectedEntry?.let { entry ->
        EditScheduleEntryDialog(
            entry = entry,
            onUpdate = { updatedEntry ->
                schedule = schedule.map { if (it == entry) updatedEntry else it }
                selectedEntry = null
            },
            onDismiss = { selectedEntry = null }
        )
    }
}

@Composable
fun ScheduleEntryCard(
    entry: ScheduleEntry,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onToggleActive: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (entry.isActive) 
                MaterialTheme.colorScheme.surface 
            else 
                MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status indicator
            Icon(
                imageVector = if (entry.isActive) Icons.Default.CheckCircle else Icons.Default.Cancel,
                contentDescription = if (entry.isActive) "Active" else "Inactive",
                tint = if (entry.isActive) 
                    MaterialTheme.colorScheme.primary 
                else 
                    MaterialTheme.colorScheme.error
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Entry details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${entry.date} at ${entry.time}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${entry.label} - ${entry.tabletCount} tablet${if (entry.tabletCount > 1) "s" else ""}",
                    style = MaterialTheme.typography.bodyMedium
                )
                if (entry.notes.isNotEmpty()) {
                    Text(
                        text = entry.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Action buttons
            Row {
                IconButton(onClick = onToggleActive) {
                    Icon(
                        imageVector = if (entry.isActive) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (entry.isActive) "Pause" else "Activate"
                    )
                }
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit")
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete")
                }
            }
        }
    }
}

@Composable
fun AddScheduleEntryDialog(
    onAdd: (ScheduleEntry) -> Unit,
    onDismiss: () -> Unit
) {
    var date by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }
    var label by remember { mutableStateOf("Custom") }
    var tabletCount by remember { mutableStateOf(1) }
    var notes by remember { mutableStateOf("") }
    
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Schedule Entry") },
        text = {
            Column {
                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Time (HH:MM)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = label,
                    onValueChange = { label = it },
                    label = { Text("Label") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = tabletCount.toString(),
                    onValueChange = { tabletCount = it.toIntOrNull() ?: 1 },
                    label = { Text("Tablet Count") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (date.isNotEmpty() && time.isNotEmpty()) {
                        onAdd(
                            ScheduleEntry(
                                date = date,
                                time = time,
                                label = label,
                                tabletCount = tabletCount,
                                notes = notes
                            )
                        )
                    }
                }
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun EditScheduleEntryDialog(
    entry: ScheduleEntry,
    onUpdate: (ScheduleEntry) -> Unit,
    onDismiss: () -> Unit
) {
    var date by remember { mutableStateOf(entry.date) }
    var time by remember { mutableStateOf(entry.time) }
    var label by remember { mutableStateOf(entry.label) }
    var tabletCount by remember { mutableStateOf(entry.tabletCount) }
    var notes by remember { mutableStateOf(entry.notes) }
    var isActive by remember { mutableStateOf(entry.isActive) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Schedule Entry") },
        text = {
            Column {
                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Time (HH:MM)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = label,
                    onValueChange = { label = it },
                    label = { Text("Label") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = tabletCount.toString(),
                    onValueChange = { tabletCount = it.toIntOrNull() ?: 1 },
                    label = { Text("Tablet Count") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isActive,
                        onCheckedChange = { isActive = it }
                    )
                    Text("Active")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onUpdate(
                        entry.copy(
                            date = date,
                            time = time,
                            label = label,
                            tabletCount = tabletCount,
                            notes = notes,
                            isActive = isActive
                        )
                    )
                }
            ) {
                Text("Update")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
