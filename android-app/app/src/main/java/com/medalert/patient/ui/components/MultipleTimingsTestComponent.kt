package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medalert.patient.data.model.Medication
import com.medalert.patient.services.MedicineSchedulingService
import javax.inject.Inject

@Composable
fun MultipleTimingsTestComponent(
    medicineSchedulingService: MedicineSchedulingService? = null,
    modifier: Modifier = Modifier
) {
    var testMedications by remember { 
        mutableStateOf(createTestMedications())
    }
    
    Column(
        modifier = modifier.padding(16.dp)
    ) {
        // Header
        Text(
            text = "Multiple Timings Test",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Test buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {
                    // Test scheduling all medications
                    testMedications.forEach { medication ->
                        medicineSchedulingService?.scheduleMedicineNotifications(medication)
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Schedule All")
            }
            
            Button(
                onClick = {
                    // Add a new test medication
                    testMedications = testMedications + createRandomTestMedication()
                },
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Add Test")
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Display test medications
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(testMedications) { medication ->
                TestMedicationCard(medication = medication)
            }
        }
    }
}

@Composable
private fun TestMedicationCard(
    medication: Medication,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Medicine name and dosage
            Text(
                text = medication.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = medication.dosage,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Multiple timings display
            MultipleTimingsDisplay(medication = medication)
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Progress indicator
            TimingProgressIndicator(medication = medication)
        }
    }
}

private fun createTestMedications(): List<Medication> {
    return listOf(
        // Medicine with 2 timings
        Medication(
            _id = "test1",
            name = "Paracetamol",
            dosage = "500mg",
            timing = listOf("08:00", "20:00"),
            frequency = "Twice daily",
            instructions = "Take with food",
            foodTiming = "After meals"
        ),
        
        // Medicine with 3 timings
        Medication(
            _id = "test2",
            name = "Amoxicillin",
            dosage = "250mg",
            timing = listOf("08:00", "14:00", "20:00"),
            frequency = "Three times daily",
            instructions = "Take with plenty of water",
            foodTiming = "Before meals"
        ),
        
        // Medicine with 4 timings
        Medication(
            _id = "test3",
            name = "Vitamin D",
            dosage = "1000 IU",
            timing = listOf("06:00", "12:00", "18:00", "22:00"),
            frequency = "Four times daily",
            instructions = "Take with fatty food for better absorption",
            foodTiming = "With meals"
        ),
        
        // Medicine with custom timings
        Medication(
            _id = "test4",
            name = "Insulin",
            dosage = "10 units",
            timing = listOf("07:30", "12:30", "19:30"),
            frequency = "Before meals",
            instructions = "Inject subcutaneously",
            foodTiming = "Before meals"
        )
    )
}

private fun createRandomTestMedication(): Medication {
    val medicineNames = listOf("Aspirin", "Ibuprofen", "Metformin", "Lisinopril", "Atorvastatin")
    val dosages = listOf("100mg", "200mg", "500mg", "10mg", "20mg")
    val timingOptions = listOf(
        listOf("08:00", "20:00"),
        listOf("08:00", "14:00", "20:00"),
        listOf("06:00", "12:00", "18:00", "22:00"),
        listOf("07:00", "13:00", "19:00"),
        listOf("09:00", "15:00", "21:00")
    )
    
    return Medication(
        _id = "test_${System.currentTimeMillis()}",
        name = medicineNames.random(),
        dosage = dosages.random(),
        timing = timingOptions.random(),
        frequency = "Custom schedule",
        instructions = "Take as directed",
        foodTiming = "With or without food"
    )
}
