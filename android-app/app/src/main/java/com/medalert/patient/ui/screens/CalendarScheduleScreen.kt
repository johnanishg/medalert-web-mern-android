package com.medalert.patient.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.ScheduledDose
import com.medalert.patient.viewmodel.PatientViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScheduleScreen(
    onNavigateBack: () -> Unit,
    patientViewModel: PatientViewModel = hiltViewModel()
) {
    val medications by patientViewModel.medications.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()
    
    var currentDate by remember { mutableStateOf(Date()) }
    var selectedDate by remember { mutableStateOf<Date?>(null) }
    
    // Load data when screen opens
    LaunchedEffect(Unit) {
        patientViewModel.refreshAllData()
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top App Bar
        TopAppBar(
            title = { 
                Text(
                    text = "Medicine Schedule",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
            },
            actions = {
                // Refresh button
                IconButton(
                    onClick = { 
                        patientViewModel.refreshAllData()
                    }
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        )
        
        // Smart Schedule Information
        val smartScheduledMedicines = medications.filter { it.smartScheduled && it.scheduleExplanation.isNotEmpty() }
        if (smartScheduledMedicines.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "🤖 Smart Schedule Information",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    smartScheduledMedicines.forEach { medicine ->
                        Text(
                            text = "${medicine.name}: ${medicine.scheduleExplanation}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                }
            }
        }
        
        // Calendar Header
        CalendarHeader(
            currentDate = currentDate,
            onPreviousMonth = { 
                val calendar = Calendar.getInstance()
                calendar.time = currentDate
                calendar.add(Calendar.MONTH, -1)
                currentDate = calendar.time
            },
            onNextMonth = { 
                val calendar = Calendar.getInstance()
                calendar.time = currentDate
                calendar.add(Calendar.MONTH, 1)
                currentDate = calendar.time
            }
        )
        
        // Legend
        LegendSection()
        
        // Calendar Grid
        CalendarGrid(
            currentDate = currentDate,
            medications = medications,
            selectedDate = selectedDate,
            onDateSelected = { selectedDate = it },
            onDoseTaken = { medication, dose ->
                // Handle dose taken
                patientViewModel.recordAdherence(
                    medications.indexOf(medication), 
                    true
                )
            }
        )
        
        // Medicine Management Section
        MedicineManagementSection(
            medications = medications,
            onEditMedicine = { medication ->
                // Handle edit medicine
            },
            onDeleteMedicine = { medication ->
                // Handle delete medicine
            }
        )
    }
    
    // Loading indicator
    if (uiState.isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    }
}

@Composable
fun CalendarHeader(
    currentDate: Date,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onPreviousMonth) {
            Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Month")
        }
        
        Text(
            text = dateFormat.format(currentDate),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        IconButton(onClick = onNextMonth) {
            Icon(Icons.Default.ChevronRight, contentDescription = "Next Month")
        }
    }
}

@Composable
fun LegendSection() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            LegendItem(
                color = Color.Green,
                label = "Taken"
            )
            LegendItem(
                color = Color.Red,
                label = "Overdue"
            )
            LegendItem(
                color = Color(0xFFFF9800),
                label = "Due Now"
            )
            LegendItem(
                color = Color.Gray,
                label = "Scheduled"
            )
        }
    }
}

@Composable
fun LegendItem(
    color: Color,
    label: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(12.dp)
                .background(color, RoundedCornerShape(2.dp))
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun CalendarGrid(
    currentDate: Date,
    medications: List<Medication>,
    selectedDate: Date?,
    onDateSelected: (Date) -> Unit,
    onDoseTaken: (Medication, ScheduledDose) -> Unit
) {
    val calendar = Calendar.getInstance()
    calendar.time = currentDate
    
    // Get first day of month and number of days
    val firstDayOfMonth = calendar.get(Calendar.DAY_OF_WEEK)
    val daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    
    // Generate days for the month
    val days = (1..daysInMonth).map { day ->
        val dayCalendar = Calendar.getInstance()
        dayCalendar.time = currentDate
        dayCalendar.set(Calendar.DAY_OF_MONTH, day)
        dayCalendar.time
    }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Day headers
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat").forEach { day ->
                Text(
                    text = day,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Calendar days
        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            modifier = Modifier.height(400.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // Empty cells for days before the first day of month
            items(firstDayOfMonth - 1) {
                Spacer(modifier = Modifier.height(80.dp))
            }
            
            // Calendar days
            items(days) { date ->
                CalendarDay(
                    date = date,
                    medications = medications,
                    isSelected = selectedDate?.let { 
                        it.toDateString() == date.toDateString() 
                    } ?: false,
                    isToday = date.toDateString() == Date().toDateString(),
                    onClick = { onDateSelected(date) },
                    onDoseTaken = onDoseTaken
                )
            }
        }
    }
}

@Composable
fun CalendarDay(
    date: Date,
    medications: List<Medication>,
    isSelected: Boolean,
    isToday: Boolean,
    onClick: () -> Unit,
    onDoseTaken: (Medication, ScheduledDose) -> Unit
) {
    val dayOfMonth = SimpleDateFormat("d", Locale.getDefault()).format(date)
    
    // Get doses for this date
    val dayDoses = medications.flatMap { medication ->
        medication.scheduledDoses.filter { dose ->
            // Check if dose is scheduled for this date
            // This is a simplified check - you might want to implement proper date matching
            true // For now, show all doses
        }.map { dose -> medication to dose }
    }
    
    val maxColumns = if (dayDoses.isNotEmpty()) {
        dayDoses.groupBy { it.first.name }.values.maxOfOrNull { it.size } ?: 1
    } else 1
    
    Card(
        modifier = Modifier
            .height(80.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = when {
                isSelected -> MaterialTheme.colorScheme.primaryContainer
                isToday -> MaterialTheme.colorScheme.secondaryContainer
                else -> MaterialTheme.colorScheme.surface
            }
        ),
        border = if (isSelected) {
            androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
        } else null
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp)
        ) {
            // Date number
            Text(
                text = dayOfMonth,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                color = when {
                    isSelected -> MaterialTheme.colorScheme.onPrimaryContainer
                    isToday -> MaterialTheme.colorScheme.onSecondaryContainer
                    else -> MaterialTheme.colorScheme.onSurface
                }
            )
            
            // Medicine doses
            if (dayDoses.isNotEmpty()) {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    items(dayDoses.take(3)) { (medication, dose) ->
                        DoseItem(
                            medication = medication,
                            dose = dose,
                            onDoseTaken = { onDoseTaken(medication, dose) }
                        )
                    }
                }
            } else {
                Text(
                    text = "No doses",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun DoseItem(
    medication: Medication,
    dose: ScheduledDose,
    onDoseTaken: () -> Unit
) {
    val isTaken = false // You'll need to implement this based on your data model
    val isOverdue = false // You'll need to implement this based on your data model
    val isCurrent = false // You'll need to implement this based on your data model
    
    val backgroundColor = when {
        isTaken -> Color.Green.copy(alpha = 0.2f)
        isOverdue -> Color.Red.copy(alpha = 0.2f)
        isCurrent -> Color(0xFFFF9800).copy(alpha = 0.2f)
        else -> Color.Gray.copy(alpha = 0.2f)
    }
    
    val borderColor = when {
        isTaken -> Color.Green
        isOverdue -> Color.Red
        isCurrent -> Color(0xFFFF9800)
        else -> Color.Gray
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = backgroundColor
        ),
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = medication.name,
                style = MaterialTheme.typography.bodySmall,
                fontSize = 8.sp,
                maxLines = 1,
                modifier = Modifier.weight(1f)
            )
            
            IconButton(
                onClick = onDoseTaken,
                modifier = Modifier.size(12.dp)
            ) {
                Icon(
                    if (isTaken) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = if (isTaken) "Taken" else "Mark as taken",
                    modifier = Modifier.size(8.dp)
                )
            }
        }
    }
}

@Composable
fun MedicineManagementSection(
    medications: List<Medication>,
    onEditMedicine: (Medication) -> Unit,
    onDeleteMedicine: (Medication) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Medicine Management",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(medications) { medication ->
                    MedicineManagementItem(
                        medication = medication,
                        onEdit = { onEditMedicine(medication) },
                        onDelete = { onDeleteMedicine(medication) }
                    )
                }
            }
        }
    }
}

@Composable
fun MedicineManagementItem(
    medication: Medication,
    onEdit: () -> Unit,
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
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = medication.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "${medication.dosage} • ${medication.frequency}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Today: ${medication.scheduledDoses.size} doses",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Row {
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

// Extension function to get date string
private fun Date.toDateString(): String {
    val format = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    return format.format(this)
}
