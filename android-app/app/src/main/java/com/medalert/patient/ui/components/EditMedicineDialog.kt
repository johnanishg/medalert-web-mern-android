package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.medalert.patient.data.model.Medication

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditMedicineDialog(
    medication: Medication?,
    onDismiss: () -> Unit,
    onSave: (Medication) -> Unit
) {
    var name by remember { mutableStateOf(medication?.name ?: "") }
    var dosage by remember { mutableStateOf(medication?.dosage ?: "") }
    var frequency by remember { mutableStateOf(medication?.frequency ?: "") }
    var duration by remember { mutableStateOf(medication?.duration ?: "") }
    var instructions by remember { mutableStateOf(medication?.instructions ?: "") }
    var foodTiming by remember { mutableStateOf(medication?.foodTiming ?: "") }
    var prescribedBy by remember { mutableStateOf(medication?.prescribedBy ?: "") }
    
    val isNewMedicine = medication == null
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (isNewMedicine) "Add New Medicine" else "Edit Medicine",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Medicine Name
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Medicine Name") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.MedicalServices, contentDescription = "Medicine")
                    },
                    isError = name.isBlank()
                )
                
                // Dosage
                OutlinedTextField(
                    value = dosage,
                    onValueChange = { dosage = it },
                    label = { Text("Dosage") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Science, contentDescription = "Dosage")
                    },
                    placeholder = { Text("e.g., 500mg") },
                    isError = dosage.isBlank()
                )
                
                // Frequency
                OutlinedTextField(
                    value = frequency,
                    onValueChange = { frequency = it },
                    label = { Text("Frequency") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Schedule, contentDescription = "Frequency")
                    },
                    placeholder = { Text("e.g., Twice daily") },
                    isError = frequency.isBlank()
                )
                
                // Duration
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it },
                    label = { Text("Duration") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.CalendarToday, contentDescription = "Duration")
                    },
                    placeholder = { Text("e.g., 7 days, As prescribed") }
                )
                
                // Food Timing
                var expanded by remember { mutableStateOf(false) }
                val foodTimingOptions = listOf("", "Before food", "After food", "With food", "Empty stomach")
                
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = foodTiming,
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Food Timing") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        leadingIcon = {
                            Icon(Icons.Default.Restaurant, contentDescription = "Food Timing")
                        },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                        }
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        foodTimingOptions.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(if (option.isEmpty()) "Select timing" else option) },
                                onClick = {
                                    foodTiming = option
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                
                // Instructions
                OutlinedTextField(
                    value = instructions,
                    onValueChange = { instructions = it },
                    label = { Text("Instructions") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Info, contentDescription = "Instructions")
                    },
                    placeholder = { Text("Special instructions for taking this medicine") },
                    minLines = 2,
                    maxLines = 4
                )
                
                // Prescribed By
                OutlinedTextField(
                    value = prescribedBy,
                    onValueChange = { prescribedBy = it },
                    label = { Text("Prescribed By") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = "Doctor")
                    },
                    placeholder = { Text("e.g., Dr. Smith") }
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val updatedMedication = Medication(
                        name = name.trim(),
                        dosage = dosage.trim(),
                        frequency = frequency.trim(),
                        duration = duration.trim(),
                        instructions = instructions.trim(),
                        foodTiming = foodTiming.trim(),
                        prescribedBy = prescribedBy.trim(),
                        timing = medication?.timing ?: emptyList(),
                        adherence = medication?.adherence ?: emptyList(),
                        prescribedDate = medication?.prescribedDate ?: java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
                    )
                    onSave(updatedMedication)
                },
                enabled = name.isNotBlank() && dosage.isNotBlank() && frequency.isNotBlank()
            ) {
                Icon(
                    if (isNewMedicine) Icons.Default.Add else Icons.Default.Save,
                    contentDescription = if (isNewMedicine) "Add" else "Save"
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(if (isNewMedicine) "Add Medicine" else "Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
