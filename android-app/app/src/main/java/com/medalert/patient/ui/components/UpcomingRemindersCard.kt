package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medalert.patient.data.model.Medication
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun UpcomingRemindersCard(
    medications: List<Medication>,
    onViewAll: () -> Unit
) {
    // Get upcoming reminders (next 24 hours)
    val upcomingReminders = getUpcomingReminders(medications)
    
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
                    text = "Upcoming Reminders",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                TextButton(onClick = onViewAll) {
                    Text("View All")
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            if (upcomingReminders.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = "No reminders",
                        modifier = Modifier.size(28.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No upcoming reminders",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(upcomingReminders) { reminder ->
                        ReminderChip(reminder = reminder)
                    }
                }
            }
        }
    }
}

@Composable
private fun ReminderChip(reminder: UpcomingReminder) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = when {
                reminder.isOverdue -> MaterialTheme.colorScheme.errorContainer
                reminder.isDueNow -> MaterialTheme.colorScheme.tertiaryContainer
                else -> MaterialTheme.colorScheme.secondaryContainer
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = when {
                    reminder.isOverdue -> Icons.Default.Warning
                    reminder.isDueNow -> Icons.Default.NotificationImportant
                    else -> Icons.Default.Schedule
                },
                contentDescription = "Reminder Status",
                tint = when {
                    reminder.isOverdue -> MaterialTheme.colorScheme.onErrorContainer
                    reminder.isDueNow -> MaterialTheme.colorScheme.onTertiaryContainer
                    else -> MaterialTheme.colorScheme.onSecondaryContainer
                },
                modifier = Modifier.size(18.dp)
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = reminder.time,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = when {
                    reminder.isOverdue -> MaterialTheme.colorScheme.onErrorContainer
                    reminder.isDueNow -> MaterialTheme.colorScheme.onTertiaryContainer
                    else -> MaterialTheme.colorScheme.onSecondaryContainer
                }
            )
            
            Text(
                text = reminder.medicineName,
                style = MaterialTheme.typography.bodySmall,
                color = when {
                    reminder.isOverdue -> MaterialTheme.colorScheme.onErrorContainer
                    reminder.isDueNow -> MaterialTheme.colorScheme.onTertiaryContainer
                    else -> MaterialTheme.colorScheme.onSecondaryContainer
                }
            )
        }
    }
}

private data class UpcomingReminder(
    val medicineName: String,
    val time: String,
    val isOverdue: Boolean,
    val isDueNow: Boolean
)

private fun getUpcomingReminders(medications: List<Medication>): List<UpcomingReminder> {
    val now = Calendar.getInstance()
    val currentTime = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    val reminders = mutableListOf<UpcomingReminder>()
    
    medications.forEach { medication ->
        medication.timing.forEach { timeStr ->
            try {
                val timeParts = timeStr.split(":")
                val hours = timeParts[0].toInt()
                val minutes = timeParts[1].toInt()
                val scheduledTime = hours * 60 + minutes
                
                val timeDiff = scheduledTime - currentTime
                
                // Include reminders for next 24 hours
                if (timeDiff >= -30 && timeDiff <= 1440) { // -30 minutes to +24 hours
                    reminders.add(
                        UpcomingReminder(
                            medicineName = medication.name,
                            time = timeStr,
                            isOverdue = timeDiff < -30,
                            isDueNow = timeDiff >= -30 && timeDiff <= 30
                        )
                    )
                }
            } catch (e: Exception) {
                // Handle time parsing error
            }
        }
    }
    
    return reminders.sortedBy { it.time }
}