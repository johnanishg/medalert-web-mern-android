package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.window.Dialog
import com.medalert.patient.data.model.DoseRecord
import com.medalert.patient.data.model.DoseStatus
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DoseRecordCard(
    doseRecord: DoseRecord,
    onEdit: (DoseRecord) -> Unit,
    onDelete: (DoseRecord) -> Unit,
    translate: (String) -> String = { it }
) {
    val statusColor = when (doseRecord.status) {
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${doseRecord.scheduledTime} - ${doseRecord.scheduledDate}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (doseRecord.actualTime.isNotEmpty()) {
                        Text(
                            text = "${translate("Taken at")}: ${doseRecord.actualTime}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                Row {
                    // Status indicator
                    Card(
                        colors = CardDefaults.cardColors(containerColor = statusColor.copy(alpha = 0.1f))
                    ) {
                        Text(
                            text = when (doseRecord.status) {
                                DoseStatus.TAKEN -> translate("Taken")
                                DoseStatus.MISSED -> translate("Missed")
                                DoseStatus.SKIPPED -> translate("Skip")
                                DoseStatus.LATE -> translate("Late")
                                DoseStatus.PENDING -> translate("Pending")
                            },
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    IconButton(onClick = { onEdit(doseRecord) }) {
                        Icon(Icons.Default.Edit, contentDescription = translate("Edit"))
                    }
                    IconButton(onClick = { onDelete(doseRecord) }) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = translate("Delete"),
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
            
            if (doseRecord.notes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Notes: ${doseRecord.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun DoseActionButtons(
    onMarkTaken: () -> Unit,
    onMarkMissed: () -> Unit,
    onMarkSkipped: () -> Unit,
    onAddNote: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Primary action buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onMarkTaken,
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
                onClick = onMarkMissed,
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Close, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Missed")
            }
        }
        
        // Secondary action buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onMarkSkipped,
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.SkipNext, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Skip")
            }
            
            OutlinedButton(
                onClick = onAddNote,
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Note, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Note")
            }
        }
    }
}

@Composable
fun DoseNoteDialog(
    initialNote: String = "",
    onSave: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var note by remember { mutableStateOf(initialNote) }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.6f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Add Note",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Note") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    maxLines = 10,
                    placeholder = { Text("Add any notes about this dose...") }
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
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
                            onSave(note)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
}

@Composable
fun DoseStatusIndicator(
    status: DoseStatus,
    modifier: Modifier = Modifier,
    translate: (String) -> String = { it }
) {
    val (color, icon) = when (status) {
        DoseStatus.TAKEN -> Color(0xFF4CAF50) to Icons.Default.Check
        DoseStatus.MISSED -> Color(0xFFF44336) to Icons.Default.Close
        DoseStatus.SKIPPED -> Color(0xFFFF9800) to Icons.Default.SkipNext
        DoseStatus.LATE -> Color(0xFF9C27B0) to Icons.Default.Schedule
        DoseStatus.PENDING -> Color(0xFF2196F3) to Icons.Default.Schedule
    }
    
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = when (status) {
                    DoseStatus.TAKEN -> translate("Taken")
                    DoseStatus.MISSED -> translate("Missed")
                    DoseStatus.SKIPPED -> translate("Skip")
                    DoseStatus.LATE -> translate("Late")
                    DoseStatus.PENDING -> translate("Pending")
                },
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

@Composable
fun DoseHistoryCard(
    doseRecords: List<DoseRecord>,
    onRecordClick: (DoseRecord) -> Unit,
    translate: (String) -> String = { it }
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = translate("Dose History"),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            if (doseRecords.isEmpty()) {
                Text(
                    text = translate("No dose records yet"),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                doseRecords.take(5).forEach { record ->
                    DoseRecordCard(
                        doseRecord = record,
                        onEdit = onRecordClick,
                        onDelete = { /* Handle delete */ },
                        translate = translate
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                if (doseRecords.size > 5) {
                    Text(
                        text = translate("And ${doseRecords.size - 5} more..."),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun AdherenceStatsCard(
    totalDoses: Int,
    takenDoses: Int,
    missedDoses: Int,
    skippedDoses: Int
) {
    val adherenceRate = if (totalDoses > 0) (takenDoses.toFloat() / totalDoses * 100).toInt() else 0
    
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Adherence Statistics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Adherence rate
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Adherence Rate",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "$adherenceRate%",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        adherenceRate >= 90 -> Color(0xFF4CAF50)
                        adherenceRate >= 70 -> Color(0xFFFF9800)
                        else -> Color(0xFFF44336)
                    }
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Dose breakdown
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem("Taken", takenDoses, Color(0xFF4CAF50))
                StatItem("Missed", missedDoses, Color(0xFFF44336))
                StatItem("Skipped", skippedDoses, Color(0xFFFF9800))
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    count: Int,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = count.toString(),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
