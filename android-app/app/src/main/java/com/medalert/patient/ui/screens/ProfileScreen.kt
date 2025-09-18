package com.medalert.patient.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.viewmodel.PatientViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    patientViewModel: PatientViewModel = hiltViewModel()
) {
    val patient by patientViewModel.patient.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()
    
    // Load data when screen opens
    LaunchedEffect(Unit) {
        patientViewModel.loadPatientData()
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top App Bar
        TopAppBar(
            title = { Text("My Profile") },
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
                
                IconButton(onClick = { /* Navigate to edit profile */ }) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit Profile")
                }
            }
        )
        
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            patient?.let { patientData ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Patient ID Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = "Your Patient ID",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = patientData.getUserFriendlyId(),
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Share this ID with your doctor for prescriptions",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }
                    
                    // Basic Information
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = "Basic Information",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                ProfileInfoRow("Name", patientData.name)
                                ProfileInfoRow("Email", patientData.email)
                                ProfileInfoRow("Phone", patientData.phoneNumber)
                                ProfileInfoRow("Age", "${patientData.age} years")
                                ProfileInfoRow("Gender", patientData.gender.capitalize())
                                
                                if (patientData.dateOfBirth.isNotEmpty()) {
                                    val displayDate = remember(patientData.dateOfBirth) {
                                        try {
                                            val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                                                .parse(patientData.dateOfBirth)
                                            SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                                                .format(date ?: Date())
                                        } catch (e: Exception) {
                                            patientData.dateOfBirth
                                        }
                                    }
                                    ProfileInfoRow("Date of Birth", displayDate)
                                }
                            }
                        }
                    }
                    
                    // Emergency Contact
                    item {
                        patientData.emergencyContact?.let { contact ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(
                                    modifier = Modifier.padding(16.dp)
                                ) {
                                    Text(
                                        text = "Emergency Contact",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    ProfileInfoRow("Name", contact.name)
                                    ProfileInfoRow("Phone", contact.phone)
                                    ProfileInfoRow("Relationship", contact.relationship)
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    Button(
                                        onClick = { /* Make emergency call */ },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.error
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.Default.Phone, contentDescription = "Call")
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Emergency Call")
                                    }
                                }
                            }
                        }
                    }
                    
                    // Medical Information
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = "Medical Information",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                ProfileInfoRow(
                                    "Allergies", 
                                    if (patientData.allergies.isNotEmpty()) 
                                        patientData.allergies.joinToString(", ") 
                                    else "None listed"
                                )
                                
                                ProfileInfoRow(
                                    "Current Medications", 
                                    "${patientData.currentMedications.size} medication(s)"
                                )
                                
                                ProfileInfoRow(
                                    "Medical History", 
                                    "${patientData.medicalHistory.size} condition(s)"
                                )
                            }
                        }
                    }
                    
                    // Caretaker Information
                    item {
                        patientData.selectedCaretaker?.let { caretaker ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(
                                    modifier = Modifier.padding(16.dp)
                                ) {
                                    Text(
                                        text = "Assigned Caretaker",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    ProfileInfoRow("Name", caretaker.caretakerName)
                                    ProfileInfoRow("Email", caretaker.caretakerEmail)
                                    ProfileInfoRow("ID", caretaker.caretakerUserId)
                                    
                                    val assignedDate = remember(caretaker.assignedAt) {
                                        try {
                                            val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                                                .parse(caretaker.assignedAt)
                                            SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                                                .format(date ?: Date())
                                        } catch (e: Exception) {
                                            caretaker.assignedAt
                                        }
                                    }
                                    ProfileInfoRow("Assigned On", assignedDate)
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Error handling
        uiState.error?.let { error ->
            LaunchedEffect(error) {
                // Show error snackbar
                patientViewModel.clearError()
            }
        }
    }
}

@Composable
private fun ProfileInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(2f)
        )
    }
}