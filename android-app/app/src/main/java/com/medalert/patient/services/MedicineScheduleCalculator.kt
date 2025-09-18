package com.medalert.patient.services

import com.medalert.patient.data.model.Medication
import com.medalert.patient.data.model.ScheduleEntry
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MedicineScheduleCalculator @Inject constructor() {
    
    companion object {
        private const val DATE_FORMAT = "yyyy-MM-dd"
        private const val TIME_FORMAT = "HH:mm"
        private const val DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    }
    
    private val dateFormat = SimpleDateFormat(DATE_FORMAT, Locale.getDefault())
    private val timeFormat = SimpleDateFormat(TIME_FORMAT, Locale.getDefault())
    private val dateTimeFormat = SimpleDateFormat(DATETIME_FORMAT, Locale.getDefault())
    
    /**
     * Calculate a complete schedule for a medicine based on its properties
     */
    fun calculateSchedule(medication: Medication): List<ScheduleEntry> {
        val schedule = mutableListOf<ScheduleEntry>()
        
        try {
            // Parse start and end dates
            val startDate = parseStartDate(medication)
            val endDate = parseEndDate(medication, startDate)
            val totalDays = calculateTotalDays(startDate, endDate)
            
            // Parse timing information
            val dailyTimes = parseDailyTimes(medication)
            
            // Calculate tablets per day
            val tabletsPerDay = calculateTabletsPerDay(medication, totalDays)
            
            // Generate schedule entries
            var currentDate = startDate
            var dayIndex = 0
            
            while (currentDate <= endDate && dayIndex < totalDays) {
                val dateString = dateFormat.format(currentDate)
                
                // Distribute tablets across daily times
                val tabletsPerTime = distributeTabletsAcrossTimes(tabletsPerDay, dailyTimes.size)
                
                dailyTimes.forEachIndexed { timeIndex, time ->
                    val tabletCount = tabletsPerTime.getOrElse(timeIndex) { 0 }
                    if (tabletCount > 0) {
                        schedule.add(
                            ScheduleEntry(
                                date = dateString,
                                time = time,
                                label = getTimeLabel(time),
                                isActive = true,
                                tabletCount = tabletCount,
                                notes = medication.instructions
                            )
                        )
                    }
                }
                
                currentDate = Calendar.getInstance().apply {
                    time = currentDate
                    add(Calendar.DAY_OF_MONTH, 1)
                }.time
                dayIndex++
            }
            
            android.util.Log.d("MedicineScheduleCalculator", "Generated ${schedule.size} schedule entries for ${medication.name}")
            
        } catch (e: Exception) {
            android.util.Log.e("MedicineScheduleCalculator", "Error calculating schedule for ${medication.name}: ${e.message}", e)
        }
        
        return schedule
    }
    
    /**
     * Parse start date from medication
     */
    private fun parseStartDate(medication: Medication): Date {
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
                    dateTimeFormat.parse(medication.prescribedDate) ?: Date()
                } catch (e: Exception) {
                    Date()
                }
            }
            else -> Date() // Default to today
        }
    }
    
    /**
     * Parse end date from medication duration
     */
    private fun parseEndDate(medication: Medication, startDate: Date): Date {
        val duration = medication.duration.lowercase()
        val calendar = Calendar.getInstance().apply { time = startDate }
        
        return when {
            medication.endDate.isNotEmpty() -> {
                try {
                    dateFormat.parse(medication.endDate) ?: calculateEndDateFromDuration(calendar, duration)
                } catch (e: Exception) {
                    calculateEndDateFromDuration(calendar, duration)
                }
            }
            else -> calculateEndDateFromDuration(calendar, duration)
        }
    }
    
    /**
     * Calculate end date from duration string
     */
    private fun calculateEndDateFromDuration(calendar: Calendar, duration: String): Date {
        return when {
            duration.contains("day") -> {
                val days = extractNumber(duration) ?: 1
                calendar.add(Calendar.DAY_OF_MONTH, days - 1)
                calendar.time
            }
            duration.contains("week") -> {
                val weeks = extractNumber(duration) ?: 1
                calendar.add(Calendar.WEEK_OF_YEAR, weeks)
                calendar.add(Calendar.DAY_OF_MONTH, -1)
                calendar.time
            }
            duration.contains("month") -> {
                val months = extractNumber(duration) ?: 1
                calendar.add(Calendar.MONTH, months)
                calendar.add(Calendar.DAY_OF_MONTH, -1)
                calendar.time
            }
            else -> {
                // Default to 7 days if duration is unclear
                calendar.add(Calendar.DAY_OF_MONTH, 6)
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
     * Calculate total days between start and end date
     */
    private fun calculateTotalDays(startDate: Date, endDate: Date): Int {
        val diffInMillis = endDate.time - startDate.time
        return (diffInMillis / (24 * 60 * 60 * 1000)).toInt() + 1
    }
    
    /**
     * Parse daily times from medication timing
     */
    private fun parseDailyTimes(medication: Medication): List<String> {
        val times = mutableListOf<String>()
        
        // Parse from timing list
        medication.timing.forEach { timeString ->
            when (timeString.lowercase()) {
                "morning" -> times.add("08:00")
                "afternoon" -> times.add("14:00")
                "evening" -> times.add("18:00")
                "night" -> times.add("20:00")
                else -> {
                    // Try to parse as time format (HH:MM)
                    if (timeString.matches(Regex("\\d{1,2}:\\d{2}"))) {
                        times.add(timeString)
                    }
                }
            }
        }
        
        // If no timing found, try to parse from frequency
        if (times.isEmpty()) {
            parseTimesFromFrequency(medication.frequency, times)
        }
        
        // Default to morning if still empty
        if (times.isEmpty()) {
            times.add("08:00")
        }
        
        return times.sorted()
    }
    
    /**
     * Parse times from frequency string
     */
    private fun parseTimesFromFrequency(frequency: String, times: MutableList<String>) {
        val frequencyLower = frequency.lowercase()
        
        when {
            frequencyLower.contains("morning") -> times.add("08:00")
            frequencyLower.contains("afternoon") -> times.add("14:00")
            frequencyLower.contains("evening") -> times.add("18:00")
            frequencyLower.contains("night") -> times.add("20:00")
            frequencyLower.contains("twice") -> {
                times.add("08:00")
                times.add("20:00")
            }
            frequencyLower.contains("thrice") || frequencyLower.contains("three") -> {
                times.add("08:00")
                times.add("14:00")
                times.add("20:00")
            }
        }
    }
    
    /**
     * Calculate tablets per day based on total tablets and duration
     */
    private fun calculateTabletsPerDay(medication: Medication, totalDays: Int): Int {
        return when {
            medication.totalTablets > 0 -> {
                // Use total tablets if specified
                medication.totalTablets / totalDays
            }
            medication.dosage.isNotEmpty() -> {
                // Try to extract number from dosage
                val dosageNumber = extractNumber(medication.dosage) ?: 1
                val frequencyMultiplier = when {
                    medication.frequency.lowercase().contains("twice") -> 2
                    medication.frequency.lowercase().contains("thrice") || medication.frequency.lowercase().contains("three") -> 3
                    medication.frequency.lowercase().contains("four") -> 4
                    else -> 1
                }
                dosageNumber * frequencyMultiplier
            }
            else -> 1 // Default to 1 tablet per day
        }
    }
    
    /**
     * Distribute tablets across daily times
     */
    private fun distributeTabletsAcrossTimes(tabletsPerDay: Int, timeCount: Int): List<Int> {
        if (timeCount == 0) return emptyList()
        
        val baseTabletsPerTime = tabletsPerDay / timeCount
        val remainder = tabletsPerDay % timeCount
        
        return (0 until timeCount).map { index ->
            baseTabletsPerTime + if (index < remainder) 1 else 0
        }
    }
    
    /**
     * Get time label for display
     */
    private fun getTimeLabel(time: String): String {
        return when (time) {
            "08:00" -> "Morning"
            "14:00" -> "Afternoon"
            "18:00" -> "Evening"
            "20:00" -> "Night"
            else -> "Custom"
        }
    }
    
    /**
     * Validate schedule for conflicts or issues
     */
    fun validateSchedule(schedule: List<ScheduleEntry>): List<String> {
        val issues = mutableListOf<String>()
        
        // Check for duplicate times on same day
        val dayGroups = schedule.groupBy { it.date }
        dayGroups.forEach { (date, entries) ->
            val timeGroups = entries.groupBy { it.time }
            timeGroups.forEach { (time, timeEntries) ->
                if (timeEntries.size > 1) {
                    issues.add("Multiple entries for $date at $time")
                }
            }
        }
        
        // Check for past dates
        val today = dateFormat.format(Date())
        schedule.forEach { entry ->
            if (entry.date < today) {
                issues.add("Schedule entry for past date: ${entry.date}")
            }
        }
        
        return issues
    }
    
    /**
     * Get schedule summary for display
     */
    fun getScheduleSummary(medication: Medication): String {
        val schedule = calculateSchedule(medication)
        val totalEntries = schedule.size
        val totalTablets = schedule.sumOf { it.tabletCount }
        val startDate = schedule.minByOrNull { it.date }?.date ?: "N/A"
        val endDate = schedule.maxByOrNull { it.date }?.date ?: "N/A"
        
        return "Schedule: $totalEntries entries, $totalTablets tablets total\n" +
                "Period: $startDate to $endDate"
    }
    
    /**
     * Check if medicine is currently active
     */
    fun isMedicineActive(medication: Medication): Boolean {
        try {
            // First check the isActive field
            if (!medication.isActive) {
                android.util.Log.d("MedicineScheduleCalculator", "Medicine ${medication.name} is marked as inactive")
                return false
            }
            
            // Check if medicine has timing information
            if (medication.timing.isEmpty()) {
                android.util.Log.d("MedicineScheduleCalculator", "Medicine ${medication.name} has no timing information")
                return false
            }
            
            // Check date range
            val today = dateFormat.format(Date())
            val startDate = parseStartDate(medication)
            val endDate = parseEndDate(medication, startDate)
            val todayDate = dateFormat.parse(today) ?: Date()
            
            val isInDateRange = todayDate >= startDate && todayDate <= endDate
            
            android.util.Log.d("MedicineScheduleCalculator", 
                "Medicine ${medication.name}: isActive=${medication.isActive}, " +
                "startDate=${dateFormat.format(startDate)}, endDate=${dateFormat.format(endDate)}, " +
                "today=$today, isInDateRange=$isInDateRange"
            )
            
            return isInDateRange
            
        } catch (e: Exception) {
            android.util.Log.e("MedicineScheduleCalculator", "Error checking if medicine ${medication.name} is active: ${e.message}", e)
            return false
        }
    }
    
    /**
     * Get remaining days for medicine
     */
    fun getRemainingDays(medication: Medication): Int {
        val today = dateFormat.format(Date())
        val endDate = parseEndDate(medication, parseStartDate(medication))
        
        val todayDate = dateFormat.parse(today) ?: Date()
        val diffInMillis = endDate.time - todayDate.time
        
        return maxOf(0, (diffInMillis / (24 * 60 * 60 * 1000)).toInt())
    }
}
