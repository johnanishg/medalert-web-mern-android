package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medalert.patient.data.model.Medication
import com.medalert.patient.services.MedicineScheduleCalculator
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ActiveMedicineFilterTest(
    modifier: Modifier = Modifier
) {
    val scheduleCalculator = remember { MedicineScheduleCalculator() }
    
    // Test medicines with different states
    val testMedicines = remember {
        listOf(
            // Active medicine (current date within range)
            Medication(
                _id = "active1",
                name = "Active Medicine 1",
                dosage = "500mg",
                timing = listOf("08:00", "20:00"),
                isActive = true,
                startDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                endDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 30) }.time
                )
            ),
            
            // Inactive medicine (isActive = false)
            Medication(
                _id = "inactive1",
                name = "Inactive Medicine 1",
                dosage = "250mg",
                timing = listOf("12:00"),
                isActive = false,
                startDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                endDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 30) }.time
                )
            ),
            
            // Expired medicine (end date in the past)
            Medication(
                _id = "expired1",
                name = "Expired Medicine 1",
                dosage = "100mg",
                timing = listOf("18:00"),
                isActive = true,
                startDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, -60) }.time
                ),
                endDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, -30) }.time
                )
            ),
            
            // Future medicine (start date in the future)
            Medication(
                _id = "future1",
                name = "Future Medicine 1",
                dosage = "200mg",
                timing = listOf("09:00", "21:00"),
                isActive = true,
                startDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 7) }.time
                ),
                endDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 37) }.time
                )
            ),
            
            // Medicine without timing
            Medication(
                _id = "notiming1",
                name = "No Timing Medicine",
                dosage = "150mg",
                timing = emptyList(),
                isActive = true,
                startDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                endDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
                    Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 30) }.time
                )
            )
        )
    }
    
    var activeCount by remember { mutableStateOf(0) }
    var inactiveCount by remember { mutableStateOf(0) }
    
    // Calculate active/inactive counts
    LaunchedEffect(testMedicines) {
        activeCount = testMedicines.count { scheduleCalculator.isMedicineActive(it) }
        inactiveCount = testMedicines.size - activeCount
    }
    
    Column(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Active Medicine Filter Test",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "This test shows how the system filters active vs inactive medicines for notifications:",
            style = MaterialTheme.typography.bodyMedium
        )
        
        // Summary Card
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Filtering Summary",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Total Medicines: ${testMedicines.size}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "Active Medicines: $activeCount",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Inactive Medicines: $inactiveCount",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        // Medicine List
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(testMedicines) { medicine ->
                MedicineFilterTestCard(
                    medicine = medicine,
                    isActive = scheduleCalculator.isMedicineActive(medicine)
                )
            }
        }
        
        // Expected Behavior
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Expected Behavior",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "• Only ACTIVE medicines should receive notifications",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• INACTIVE medicines should be filtered out",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• EXPIRED medicines should not get notifications",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• FUTURE medicines should not get notifications yet",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• Medicines without timing should be filtered out",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun MedicineFilterTestCard(
    medicine: Medication,
    isActive: Boolean,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.errorContainer
            }
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
                    text = medicine.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isActive) {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    } else {
                        MaterialTheme.colorScheme.onErrorContainer
                    }
                )
                
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isActive) Icons.Default.CheckCircle else Icons.Default.Cancel,
                        contentDescription = if (isActive) "Active" else "Inactive",
                        tint = if (isActive) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.error
                        }
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isActive) "ACTIVE" else "INACTIVE",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (isActive) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.error
                        }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Dosage: ${medicine.dosage}",
                style = MaterialTheme.typography.bodyMedium,
                color = if (isActive) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onErrorContainer
                }
            )
            
            Text(
                text = "Timing: ${if (medicine.timing.isEmpty()) "None" else medicine.timing.joinToString(", ")}",
                style = MaterialTheme.typography.bodyMedium,
                color = if (isActive) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onErrorContainer
                }
            )
            
            Text(
                text = "isActive: ${medicine.isActive}",
                style = MaterialTheme.typography.bodySmall,
                color = if (isActive) {
                    MaterialTheme.colorScheme.onPrimaryContainer
                } else {
                    MaterialTheme.colorScheme.onErrorContainer
                }
            )
            
            if (medicine.startDate.isNotEmpty() && medicine.endDate.isNotEmpty()) {
                Text(
                    text = "Period: ${medicine.startDate} to ${medicine.endDate}",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isActive) {
                        MaterialTheme.colorScheme.onPrimaryContainer
                    } else {
                        MaterialTheme.colorScheme.onErrorContainer
                    }
                )
            }
        }
    }
}
