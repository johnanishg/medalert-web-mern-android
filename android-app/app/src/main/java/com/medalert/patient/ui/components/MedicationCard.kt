package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medalert.patient.data.model.Medication
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MedicationCard(
    medication: Medication,
    onRecordAdherence: (Boolean) -> Unit,
    onEditTiming: () -> Unit,
    onEditQuickTiming: (() -> Unit)? = null,
    onEditSchedule: (() -> Unit)? = null,
    onEdit: (() -> Unit)? = null,
    onDelete: (() -> Unit)? = null,
    onViewSchedule: (() -> Unit)? = null,
    showActions: Boolean = true,
    translate: (String) -> String = { it }
) {
    var showAdherenceDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = medication.name,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = medication.dosage,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                
                if (showActions) {
                    Row {
                        onEdit?.let { editAction ->
                            IconButton(onClick = editAction) {
                                Icon(
                                    Icons.Default.Edit, 
                                    contentDescription = translate("Edit Medicine"),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        
                        IconButton(onClick = onEditTiming) {
                            Icon(
                                Icons.Default.Schedule, 
                                contentDescription = translate("Edit Timing"),
                                tint = MaterialTheme.colorScheme.tertiary
                            )
                        }
                        
                        onEditQuickTiming?.let { quickTimingAction ->
                            IconButton(onClick = quickTimingAction) {
                                Icon(
                                    Icons.Default.AccessTime, 
                                    contentDescription = translate("Edit Timing"),
                                    tint = MaterialTheme.colorScheme.tertiary
                                )
                            }
                        }
                        
                        onEditSchedule?.let { scheduleAction ->
                            IconButton(onClick = scheduleAction) {
                                Icon(
                                    Icons.Default.CalendarMonth, 
                                    contentDescription = translate("Edit Schedule"),
                                    tint = MaterialTheme.colorScheme.secondary
                                )
                            }
                        }
                        
                        onViewSchedule?.let { viewScheduleAction ->
                            IconButton(onClick = viewScheduleAction) {
                                Icon(
                                    Icons.Default.ViewList, 
                                    contentDescription = translate("View Schedule"),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        
                        onDelete?.let { deleteAction ->
                            IconButton(onClick = { showDeleteDialog = true }) {
                                Icon(
                                    Icons.Default.Delete, 
                                    contentDescription = translate("Delete"),
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Medication Details
            MedicationDetailRow("Frequency", medication.frequency)
            MedicationDetailRow("Duration", medication.duration)
            
            if (medication.instructions.isNotEmpty()) {
                MedicationDetailRow("Instructions", medication.instructions)
            }
            
            if (medication.foodTiming.isNotEmpty()) {
                MedicationDetailRow("Food Timing", medication.foodTiming)
            }
            
            if (medication.prescribedBy.isNotEmpty()) {
                MedicationDetailRow("Prescribed by", medication.prescribedBy)
            }
            
            // Enhanced Timing Information
            if (medication.timing.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Scheduled Times:",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "${medication.timing.size} times/day",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Display timings in a more organized way
                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    itemsIndexed(medication.timing) { index, time ->
                        AssistChip(
                            onClick = { },
                            label = { 
                                Text(
                                    text = "${index + 1}. $time",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    Icons.Default.Schedule,
                                    contentDescription = "Time",
                                    modifier = Modifier.size(16.dp)
                                )
                            },
                            colors = AssistChipDefaults.assistChipColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                labelColor = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        )
                    }
                }
            }
            
            // Adherence Information
            if (medication.adherence.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                val adherenceRate = (medication.adherence.count { it.taken }.toFloat() / medication.adherence.size * 100).toInt()
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Adherence Rate",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = when {
                                adherenceRate >= 80 -> Icons.Default.CheckCircle
                                adherenceRate >= 60 -> Icons.Default.Warning
                                else -> Icons.Default.Error
                            },
                            contentDescription = "Adherence Status",
                            tint = when {
                                adherenceRate >= 80 -> MaterialTheme.colorScheme.primary
                                adherenceRate >= 60 -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.error
                            },
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "$adherenceRate%",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                adherenceRate >= 80 -> MaterialTheme.colorScheme.primary
                                adherenceRate >= 60 -> MaterialTheme.colorScheme.tertiary
                                else -> MaterialTheme.colorScheme.error
                            }
                        )
                    }
                }
            }
            
            // Action Buttons
            if (showActions) {
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { showAdherenceDialog = true },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Record")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Record")
                    }
                    
                    onEdit?.let { editAction ->
                        OutlinedButton(
                            onClick = editAction,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit")
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Edit")
                        }
                    }
                    
                    OutlinedButton(
                        onClick = onEditTiming,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Schedule, contentDescription = "Timing")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Timing")
                    }
                    
                    onViewSchedule?.let { viewScheduleAction ->
                        OutlinedButton(
                            onClick = viewScheduleAction,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.ViewList, contentDescription = "Schedule")
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Schedule")
                        }
                    }
                }
            }
        }
    }
    
    // Adherence Recording Dialog
    if (showAdherenceDialog) {
        AlertDialog(
            onDismissRequest = { showAdherenceDialog = false },
            title = { Text("Record Medicine") },
            text = {
                Column {
                    Text("Did you take ${medication.name}?")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Dosage: ${medication.dosage}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = {
                            onRecordAdherence(true)
                            showAdherenceDialog = false
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Taken")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Taken")
                    }
                    
                    OutlinedButton(
                        onClick = {
                            onRecordAdherence(false)
                            showAdherenceDialog = false
                        }
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Missed")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Missed")
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showAdherenceDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
    
    // Delete Confirmation Dialog
    if (showDeleteDialog && onDelete != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Medication") },
            text = { Text("Are you sure you want to delete ${medication.name}? This action cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun MedicationDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}