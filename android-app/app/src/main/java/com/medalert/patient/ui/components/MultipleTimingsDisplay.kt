package com.medalert.patient.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medalert.patient.data.model.Medication
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MultipleTimingsDisplay(
    medication: Medication,
    modifier: Modifier = Modifier,
    showCurrentTime: Boolean = true
) {
    val currentTime = remember { 
        SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Medication Schedule",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${medication.timing.size} times/day",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Timings display
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                itemsIndexed(medication.timing) { index, time ->
                    TimingChip(
                        time = time,
                        index = index + 1,
                        isCurrentTime = showCurrentTime && isCurrentTiming(time, currentTime),
                        totalTimings = medication.timing.size
                    )
                }
            }
            
            // Additional info
            if (medication.foodTiming.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Food timing: ${medication.foodTiming}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun TimingChip(
    time: String,
    index: Int,
    isCurrentTime: Boolean,
    totalTimings: Int,
    modifier: Modifier = Modifier
) {
    val containerColor = if (isCurrentTime) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.primaryContainer
    }
    
    val contentColor = if (isCurrentTime) {
        MaterialTheme.colorScheme.onPrimary
    } else {
        MaterialTheme.colorScheme.onPrimaryContainer
    }
    
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Timing number indicator
            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(
                        if (isCurrentTime) {
                            MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.2f)
                        } else {
                            MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = index.toString(),
                    style = MaterialTheme.typography.labelSmall,
                    color = contentColor,
                    fontWeight = FontWeight.Bold
                )
            }
            
            // Time text
            Text(
                text = time,
                style = MaterialTheme.typography.bodyMedium,
                color = contentColor,
                fontWeight = if (isCurrentTime) FontWeight.Bold else FontWeight.Medium
            )
            
            // Current time indicator
            if (isCurrentTime) {
                Icon(
                    imageVector = Icons.Default.Schedule,
                    contentDescription = "Current time",
                    modifier = Modifier.size(16.dp),
                    tint = contentColor
                )
            }
        }
    }
}

@Composable
private fun isCurrentTiming(medicationTime: String, currentTime: String): Boolean {
    return try {
        // Parse times and check if they match (within 5 minutes tolerance)
        val medicationMinutes = parseTimeToMinutes(medicationTime)
        val currentMinutes = parseTimeToMinutes(currentTime)
        
        kotlin.math.abs(medicationMinutes - currentMinutes) <= 5
    } catch (e: Exception) {
        false
    }
}

private fun parseTimeToMinutes(timeString: String): Int {
    val parts = timeString.split(":")
    if (parts.size >= 2) {
        val hours = parts[0].toIntOrNull() ?: 0
        val minutes = parts[1].toIntOrNull() ?: 0
        return hours * 60 + minutes
    }
    return 0
}

@Composable
fun TimingProgressIndicator(
    medication: Medication,
    modifier: Modifier = Modifier
) {
    val currentTime = remember { 
        SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
    }
    
    val completedTimings = remember(medication.timing, currentTime) {
        medication.timing.count { time ->
            val timeMinutes = parseTimeToMinutes(time)
            val currentMinutes = parseTimeToMinutes(currentTime)
            timeMinutes < currentMinutes
        }
    }
    
    Card(
        modifier = modifier.fillMaxWidth(),
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
                Text(
                    text = "Today's Progress",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "$completedTimings/${medication.timing.size}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            LinearProgressIndicator(
                progress = if (medication.timing.isNotEmpty()) {
                    completedTimings.toFloat() / medication.timing.size
                } else 0f,
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }
    }
}
