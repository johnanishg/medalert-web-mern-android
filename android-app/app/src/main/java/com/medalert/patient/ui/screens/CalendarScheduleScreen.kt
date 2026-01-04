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
import com.medalert.patient.data.model.DoseStatus
import com.medalert.patient.viewmodel.LanguageViewModel
import com.medalert.patient.viewmodel.PatientViewModel
import java.text.SimpleDateFormat
import java.util.*
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScheduleScreen(
    onNavigateBack: () -> Unit,
    patientViewModel: PatientViewModel = hiltViewModel(),
    languageViewModel: LanguageViewModel = hiltViewModel()
) {
    val medications by patientViewModel.medications.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()
    
    var currentDate by remember { mutableStateOf(Date()) }
    var selectedDate by remember { mutableStateOf<Date?>(null) }
    
    // Translations
    val lang by languageViewModel.language.collectAsState()
    var uiTranslations by remember(lang) { mutableStateOf<Map<String, String>>(emptyMap()) }
    LaunchedEffect(lang) {
        val keys = listOf(
            "Medicine Schedule",
            "Back",
            "Refresh",
            "🤖 Smart Schedule Information",
            "Taken",
            "Overdue",
            "Due Now",
            "Scheduled",
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "No doses",
            "Medicine Management",
            "Today:",
            "Edit",
            "Delete",
            "Mark as taken",
            "Previous Month",
            "Next Month"
        )
        val translated = languageViewModel.translateBatch(keys, lang)
        uiTranslations = keys.mapIndexed { i, k -> k to (translated.getOrNull(i) ?: k) }.toMap()
    }
    fun t(key: String): String = uiTranslations[key] ?: key

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
                    text = t("Medicine Schedule"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = t("Back"))
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
                        contentDescription = t("Refresh"),
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
                            text = t("🤖 Smart Schedule Information"),
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
            },
            translate = { key -> t(key) }
        )
        
        // Legend
        LegendSection(translate = { key -> t(key) })
        
        // Calendar Grid
        CalendarGrid(
            currentDate = currentDate,
            medications = medications,
            selectedDate = selectedDate,
            onDateSelected = { selectedDate = it },
            onDoseTaken = { medication, dose ->
                // Handle dose taken
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val calendar = Calendar.getInstance()
                val currentDateStr = dateFormat.format(calendar.time)
                
                // Create scheduled time string (ISO format)
                val scheduledDateTime = try {
                    val timeParts = dose.time.split(":")
                    if (timeParts.size != 2) {
                        null
                    } else {
                        val hours = timeParts[0].toInt()
                        val minutes = timeParts[1].toInt()
                        calendar.time = dateFormat.parse(currentDateStr) ?: Date()
                        calendar.set(Calendar.HOUR_OF_DAY, hours)
                        calendar.set(Calendar.MINUTE, minutes)
                        calendar.set(Calendar.SECOND, 0)
                        calendar.set(Calendar.MILLISECOND, 0)
                        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                        isoFormat.timeZone = TimeZone.getTimeZone("UTC")
                        isoFormat.format(calendar.time)
                    }
                } catch (e: Exception) {
                    null
                }
                
                patientViewModel.recordAdherence(
                    medications.indexOf(medication), 
                    true,
                    "",
                    dose.id,
                    scheduledDateTime
                )
            },
            translate = { key -> t(key) }
        )
        
        // Medicine Management Section
        MedicineManagementSection(
            medications = medications,
            onEditMedicine = { medication ->
                // Handle edit medicine
            },
            onDeleteMedicine = { medication ->
                // Handle delete medicine
            },
            translate = { key -> t(key) }
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
    onNextMonth: () -> Unit,
    translate: (String) -> String
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
            Icon(Icons.Default.ChevronLeft, contentDescription = translate("Previous Month"))
        }
        
        Text(
            text = dateFormat.format(currentDate),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        IconButton(onClick = onNextMonth) {
            Icon(Icons.Default.ChevronRight, contentDescription = translate("Next Month"))
        }
    }
}

@Composable
fun LegendSection(translate: (String) -> String) {
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
                label = translate("Taken")
            )
            LegendItem(
                color = Color.Red,
                label = translate("Overdue")
            )
            LegendItem(
                color = Color(0xFFFF9800),
                label = translate("Due Now")
            )
            LegendItem(
                color = Color.Gray,
                label = translate("Scheduled")
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
    onDoseTaken: (Medication, ScheduledDose) -> Unit,
    translate: (String) -> String
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
                    text = translate(day),
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
                    onDoseTaken = onDoseTaken,
                    translate = translate
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
    onDoseTaken: (Medication, ScheduledDose) -> Unit,
    translate: (String) -> String
) {
    val dayOfMonth = SimpleDateFormat("d", Locale.getDefault()).format(date)
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val calendar = Calendar.getInstance()
    calendar.time = date
    
    // Get day of week (0=Sunday, 1=Monday, etc.)
    val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) - 1 // Convert to 0-based
    val currentDateStr = dateFormat.format(date)
    
    // Get doses for this date - first filter medications by their date range (like web app)
    // then filter scheduledDoses by their individual date ranges and daysOfWeek
    val dayDoses = medications.filter { medication ->
        // First check if medication is active and date is within medication's startDate/endDate range
        medication.isActive && isMedicationScheduledOnDate(medication, date)
    }.flatMap { medication ->
        // Get doses - use scheduledDoses if available, otherwise generate from timing array
        val dosesToCheck = if (medication.scheduledDoses.isNotEmpty()) {
            medication.scheduledDoses
        } else if (medication.timing.isNotEmpty()) {
            // Generate doses from timing array (like web app shows medicines based on timing)
            generateDosesFromTiming(medication)
        } else {
            emptyList()
        }
        
        // Filter doses by dose-level date range and daysOfWeek
        dosesToCheck.filter { dose ->
            // Check if dose is active
            if (!dose.isActive) return@filter false
            
            // Check if date is within dose's startDate and endDate range
            val doseStartDate = dose.startDate
            val doseEndDate = dose.endDate
            
            if (doseStartDate.isNotEmpty() && currentDateStr < doseStartDate) {
                return@filter false
            }
            if (doseEndDate.isNotEmpty() && currentDateStr > doseEndDate) {
                return@filter false
            }
            
            // Check if day of week matches
            if (dose.daysOfWeek.isNotEmpty() && !dose.daysOfWeek.contains(dayOfWeek)) {
                return@filter false
            }
            
            true
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
                            onDoseTaken = { onDoseTaken(medication, dose) },
                            translate = translate
                        )
                    }
                }
            } else {
                Text(
                    text = translate("No doses"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

/**
 * Get medication start date (similar to web app's getMedicineStartDate)
 */
private fun getMedicationStartDate(medication: Medication): Date {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val dateTimeFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
    dateTimeFormat.timeZone = TimeZone.getTimeZone("UTC")
    
    return when {
        medication.startDate.isNotEmpty() -> {
            try {
                dateFormat.parse(medication.startDate) ?: Date()
            } catch (e: Exception) {
                Date()
            }
        }
        medication.prescribedDate.isNotEmpty() -> {
            try {
                // Try parsing as date-time first, then as date
                dateTimeFormat.parse(medication.prescribedDate) 
                    ?: dateFormat.parse(medication.prescribedDate) 
                    ?: Date()
            } catch (e: Exception) {
                Date()
            }
        }
        else -> Date() // Default to today
    }
}

/**
 * Get medication end date (similar to web app's getMedicineEndDate)
 */
private fun getMedicationEndDate(medication: Medication): Date {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val startDate = getMedicationStartDate(medication)
    val calendar = Calendar.getInstance().apply { time = startDate }
    
    return when {
        medication.endDate.isNotEmpty() -> {
            try {
                dateFormat.parse(medication.endDate) ?: calculateEndDateFromDuration(calendar, medication.duration)
            } catch (e: Exception) {
                calculateEndDateFromDuration(calendar, medication.duration)
            }
        }
        else -> calculateEndDateFromDuration(calendar, medication.duration)
    }
}

/**
 * Calculate end date from duration string
 */
private fun calculateEndDateFromDuration(calendar: Calendar, duration: String): Date {
    val durationLower = duration.lowercase()
    return when {
        durationLower.contains("day") -> {
            val days = extractNumber(duration) ?: 30
            calendar.add(Calendar.DAY_OF_MONTH, days - 1)
            calendar.time
        }
        durationLower.contains("week") -> {
            val weeks = extractNumber(duration) ?: 4
            calendar.add(Calendar.WEEK_OF_YEAR, weeks)
            calendar.add(Calendar.DAY_OF_MONTH, -1)
            calendar.time
        }
        durationLower.contains("month") -> {
            val months = extractNumber(duration) ?: 1
            calendar.add(Calendar.MONTH, months)
            calendar.add(Calendar.DAY_OF_MONTH, -1)
            calendar.time
        }
        else -> {
            // Default to 30 days from start if no duration
            calendar.add(Calendar.DAY_OF_MONTH, 29)
            calendar.time
        }
    }
}

/**
 * Extract number from duration string
 */
private fun extractNumber(duration: String): Int? {
    val regex = Regex("\\d+")
    return regex.find(duration)?.value?.toIntOrNull()
}

/**
 * Generate ScheduledDose objects from medication timing array (for medications without scheduledDoses)
 */
private fun generateDosesFromTiming(medication: Medication): List<ScheduledDose> {
    if (medication.timing.isEmpty()) return emptyList()
    
    val startDate = if (medication.startDate.isNotEmpty()) medication.startDate else ""
    val endDate = if (medication.endDate.isNotEmpty()) medication.endDate else ""
    val allDaysOfWeek = listOf(0, 1, 2, 3, 4, 5, 6) // All days by default
    
    return medication.timing.map { time ->
        ScheduledDose(
            id = "${medication._id}_${time}", // Generate unique ID
            time = time,
            label = getTimeLabel(time),
            dosage = medication.dosage,
            isActive = true,
            daysOfWeek = allDaysOfWeek,
            startDate = startDate,
            endDate = endDate,
            notes = medication.instructions
        )
    }
}

/**
 * Get time label from time string (e.g., "08:00" -> "Morning")
 */
private fun getTimeLabel(time: String): String {
    return try {
        val timeParts = time.split(":")
        if (timeParts.size != 2) return "Custom"
        val hours = timeParts[0].toInt()
        when {
            hours in 6..11 -> "Morning"
            hours in 12..17 -> "Afternoon"
            hours in 18..23 -> "Evening"
            else -> "Night"
        }
    } catch (e: Exception) {
        "Custom"
    }
}

/**
 * Check if medicine is scheduled on a specific date (similar to web app's isMedicineScheduledOnDate)
 */
private fun isMedicationScheduledOnDate(medication: Medication, date: Date): Boolean {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val checkDate = Calendar.getInstance().apply { 
        time = date
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.time
    
    val startDate = getMedicationStartDate(medication)
    val startCalendar = Calendar.getInstance().apply { 
        time = startDate
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.time
    
    val endDate = getMedicationEndDate(medication)
    val endCalendar = Calendar.getInstance().apply { 
        time = endDate
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.time
    
    return checkDate >= startCalendar && checkDate <= endCalendar
}

/**
 * Check if a dose is active (30 minutes before to 2 hours after scheduled time)
 */
fun isDoseActive(scheduledTime: String, scheduledDate: String): Boolean {
    try {
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        
        val timeParts = scheduledTime.split(":")
        if (timeParts.size != 2) return false
        
        val hours = timeParts[0].toInt()
        val minutes = timeParts[1].toInt()
        val date = dateFormat.parse(scheduledDate) ?: return false
        
        val calendar = Calendar.getInstance()
        calendar.time = date
        calendar.set(Calendar.HOUR_OF_DAY, hours)
        calendar.set(Calendar.MINUTE, minutes)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        
        val scheduledDateTime = calendar.timeInMillis
        val now = System.currentTimeMillis()
        
        val timeDiff = now - scheduledDateTime
        val thirtyMinutes = 30 * 60 * 1000L
        val twoHours = 2 * 60 * 60 * 1000L
        
        // Active if: at least 30 minutes before (timeDiff >= -30 mins) AND at most 2 hours after (timeDiff <= 2 hours)
        return timeDiff >= -thirtyMinutes && timeDiff <= twoHours
    } catch (e: Exception) {
        return false
    }
}

@Composable
fun DoseItem(
    medication: Medication,
    dose: ScheduledDose,
    onDoseTaken: () -> Unit,
    translate: (String) -> String
) {
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val calendar = Calendar.getInstance()
    val currentDateStr = dateFormat.format(calendar.time)
    
    // Check if dose is taken by looking at dose records
    val isTaken = medication.doseRecords.any { record ->
        record.scheduledDoseId == dose.id && 
        record.scheduledDate == currentDateStr && 
        record.status == DoseStatus.TAKEN
    }
    
    // Calculate scheduled datetime for this dose
    val scheduledDateTime = try {
        val timeParts = dose.time.split(":")
        if (timeParts.size != 2) throw IllegalArgumentException("Invalid time format")
        val hours = timeParts[0].toInt()
        val minutes = timeParts[1].toInt()
        calendar.time = dateFormat.parse(currentDateStr) ?: Date()
        calendar.set(Calendar.HOUR_OF_DAY, hours)
        calendar.set(Calendar.MINUTE, minutes)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        calendar.timeInMillis
    } catch (e: Exception) {
        null
    }
    
    val now = System.currentTimeMillis()
    val isActive = scheduledDateTime != null && isDoseActive(dose.time, currentDateStr)
    val isOverdue = scheduledDateTime != null && now > scheduledDateTime + (2 * 60 * 60 * 1000L) && !isTaken
    val isCurrent = scheduledDateTime != null && Math.abs(now - scheduledDateTime) <= (30 * 60 * 1000L)
    
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
                modifier = Modifier.size(12.dp),
                enabled = isActive && !isTaken
            ) {
                Icon(
                    if (isTaken) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = if (isTaken) translate("Taken") else translate("Mark as taken"),
                    modifier = Modifier.size(8.dp),
                    tint = if (isTaken) Color.Green else if (isActive) Color.Blue else Color.Gray
                )
            }
        }
    }
}

@Composable
fun MedicineManagementSection(
    medications: List<Medication>,
    onEditMedicine: (Medication) -> Unit,
    onDeleteMedicine: (Medication) -> Unit,
    translate: (String) -> String
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
                text = translate("Medicine Management"),
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
                        onDelete = { onDeleteMedicine(medication) },
                        translate = translate
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
    onDelete: () -> Unit,
    translate: (String) -> String
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
                    text = "${translate("Today:")} ${medication.scheduledDoses.size} doses",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Row {
                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = translate("Edit"))
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = translate("Delete"))
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
