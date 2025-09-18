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
fun EnhancedTimingDialog(
    medication: Medication,
    onSave: (List<ScheduledDose>) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedDoses by remember { mutableStateOf(medication.scheduledDoses.toMutableList()) }
    var showAddDoseDialog by remember { mutableStateOf(false) }
    
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
                            Text(
                                text = "Current Schedule",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            selectedDoses.forEach { dose ->
                                ScheduledDoseCard(
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
                
                // Add new dose button
                Button(
                    onClick = { showAddDoseDialog = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add New Dose Time")
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
    
    // Add dose dialog
    if (showAddDoseDialog) {
        AddDoseDialog(
            medication = medication,
            onSave = { newDose ->
                selectedDoses.add(newDose)
                showAddDoseDialog = false
            },
            onDismiss = { showAddDoseDialog = false }
        )
    }
}

@Composable
fun ScheduledDoseCard(
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
                    text = "${dose.label} - ${dose.time}",
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
fun AddDoseDialog(
    medication: Medication,
    onSave: (ScheduledDose) -> Unit,
    onDismiss: () -> Unit
) {
    var time by remember { mutableStateOf("") }
    var label by remember { mutableStateOf("") }
    var dosage by remember { mutableStateOf(medication.dosage) }
    var notes by remember { mutableStateOf("") }
    var selectedDays by remember { mutableStateOf(setOf<Int>()) }
    
    val predefinedLabels = listOf(
        "Morning" to "Morning",
        "Afternoon" to "Afternoon", 
        "Evening" to "Evening",
        "Night" to "Night",
        "Custom" to "Custom"
    )
    
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
                    text = "Add New Dose",
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
                            placeholder = { Text("e.g., 08:00") }
                        )
                    }
                    
                    // Label selection
                    item {
                        Text(
                            text = "Label",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        LazyColumn {
                            items(predefinedLabels) { (value, displayName) ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .selectable(
                                            selected = label == value,
                                            onClick = { label = value }
                                        )
                                        .padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = label == value,
                                        onClick = { label = value }
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(displayName)
                                }
                            }
                        }
                    }
                    
                    // Dosage
                    item {
                        OutlinedTextField(
                            value = dosage,
                            onValueChange = { dosage = it },
                            label = { Text("Dosage") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
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
                            maxLines = 3
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
                            if (time.isNotEmpty() && label.isNotEmpty() && selectedDays.isNotEmpty()) {
                                val newDose = ScheduledDose(
                                    id = UUID.randomUUID().toString(),
                                    time = time,
                                    label = label,
                                    dosage = dosage,
                                    daysOfWeek = selectedDays.toList(),
                                    notes = notes
                                )
                                onSave(newDose)
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = time.isNotEmpty() && label.isNotEmpty() && selectedDays.isNotEmpty()
                    ) {
                        Text("Add Dose")
                    }
                }
            }
        }
    }
}
