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
import com.medalert.patient.viewmodel.LanguageViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    patientViewModel: PatientViewModel = hiltViewModel(),
    languageViewModel: LanguageViewModel = hiltViewModel()
) {
    val patient by patientViewModel.patient.collectAsState()
    val uiState by patientViewModel.uiState.collectAsState()
    val lang by languageViewModel.language.collectAsState()
    var langMenu by remember { mutableStateOf(false) }

    // Batch UI translations
    var uiTranslations by remember(lang) { mutableStateOf<Map<String, String>>(emptyMap()) }
    LaunchedEffect(lang) {
        val keys = listOf(
            "My Profile",
            "Back",
            "Refresh",
            "Language",
            "Edit Profile",
            "Your Patient ID",
            "Share this ID with your doctor for prescriptions",
            "Basic Information",
            "Name",
            "Email",
            "Phone",
            "Age",
            "years",
            "Gender",
            "Date of Birth",
            "Emergency Contact",
            "Call",
            "Emergency Call",
            "Medical Information",
            "Allergies",
            "None listed",
            "Current Medications",
            "Medical History",
            "Assigned Caretaker",
            "ID",
            "Assigned On",
            // dynamic values
            "male", "female", "other",
            "medications",
            "conditions"
        )
        val translated = languageViewModel.translateBatch(keys)
        uiTranslations = keys.mapIndexed { index, key -> key to (translated.getOrNull(index) ?: key) }.toMap()
    }
    fun t(key: String): String = uiTranslations[key] ?: key
    
    // Load data when screen opens
    LaunchedEffect(Unit) {
        patientViewModel.loadPatientData()
    }
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top App Bar
        TopAppBar(
            title = { Text(t("My Profile")) },
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
                
                // Language selector
                Box {
                    IconButton(onClick = { langMenu = true }) {
                        Icon(Icons.Default.Translate, contentDescription = t("Language"))
                    }
                    DropdownMenu(expanded = langMenu, onDismissRequest = { langMenu = false }) {
                        DropdownMenuItem(text = { Text("English") }, onClick = { languageViewModel.setLanguage("en"); langMenu = false })
                        DropdownMenuItem(text = { Text("हिन्दी") }, onClick = { languageViewModel.setLanguage("hi"); langMenu = false })
                        DropdownMenuItem(text = { Text("ಕನ್ನಡ") }, onClick = { languageViewModel.setLanguage("kn"); langMenu = false })
                    }
                }

                IconButton(onClick = { /* Navigate to edit profile */ }) {
                    Icon(Icons.Default.Edit, contentDescription = t("Edit Profile"))
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
                                    text = t("Your Patient ID"),
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
                                    text = t("Share this ID with your doctor for prescriptions"),
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
                                    text = t("Basic Information"),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                ProfileInfoRow(t("Name"), patientData.name)
                                ProfileInfoRow(t("Email"), patientData.email)
                                ProfileInfoRow(t("Phone"), patientData.phoneNumber)
                                ProfileInfoRow(t("Age"), "${patientData.age} ${t("years")}")
                                val genderDisplay = remember(patientData.gender, lang) {
                                    val g = patientData.gender.lowercase(Locale.getDefault())
                                    when (g) {
                                        "male" -> t("male")
                                        "female" -> t("female")
                                        "other" -> t("other")
                                        else -> patientData.gender
                                    }
                                }
                                ProfileInfoRow(t("Gender"), genderDisplay)
                                
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
                                    ProfileInfoRow(t("Date of Birth"), displayDate)
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
                                        text = t("Emergency Contact"),
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    ProfileInfoRow(t("Name"), contact.name)
                                    ProfileInfoRow(t("Phone"), contact.phone)
                                    ProfileInfoRow(t("Relationship"), contact.relationship)
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    Button(
                                        onClick = { /* Make emergency call */ },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.error
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.Default.Phone, contentDescription = t("Call"))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(t("Emergency Call"))
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
                                    text = t("Medical Information"),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                ProfileInfoRow(
                                    t("Allergies"), 
                                    if (patientData.allergies.isNotEmpty()) 
                                        patientData.allergies.joinToString(", ") 
                                    else t("None listed")
                                )
                                
                                ProfileInfoRow(
                                    t("Current Medications"), 
                                    "${patientData.currentMedications.size} ${t("medications")}"
                                )
                                
                                ProfileInfoRow(
                                    t("Medical History"), 
                                    "${patientData.medicalHistory.size} ${t("conditions")}"
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
                                        text = t("Assigned Caretaker"),
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    ProfileInfoRow(t("Name"), caretaker.caretakerName)
                                    ProfileInfoRow(t("Email"), caretaker.caretakerEmail)
                                    ProfileInfoRow(t("ID"), caretaker.caretakerUserId)
                                    
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
                                    ProfileInfoRow(t("Assigned On"), assignedDate)
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