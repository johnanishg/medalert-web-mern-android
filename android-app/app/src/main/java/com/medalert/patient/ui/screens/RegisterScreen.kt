package com.medalert.patient.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medalert.patient.viewmodel.AuthViewModel
import com.medalert.patient.viewmodel.LanguageViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToDashboard: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    languageViewModel: LanguageViewModel = hiltViewModel()
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var dateOfBirth by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }
    var phoneNumber by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmPasswordVisible by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    var genderExpanded by remember { mutableStateOf(false) }
    
    val uiState by authViewModel.uiState.collectAsState()
    val currentUser by authViewModel.currentUser.collectAsState()
    
    // Translations
    val lang by languageViewModel.language.collectAsState()
    var uiTranslations by remember(lang) { mutableStateOf<Map<String, String>>(emptyMap()) }
    LaunchedEffect(lang) {
        val keys = listOf(
            "Create Patient Account",
            "First Name",
            "Last Name",
            "Email",
            "Phone Number",
            "Date of Birth",
            "YYYY-MM-DD",
            "Age (Auto-calculated)",
            "Gender",
            "male", "female", "other",
            "Password",
            "Hide password",
            "Show password",
            "Confirm Password",
            "Hide password",
            "Show password",
            "Create Account",
            "Already have an account? ",
            "Sign In",
            "MedAlert Logo",
            "Date of Birth"
        )
        val translated = languageViewModel.translateBatch(keys, lang)
        uiTranslations = keys.mapIndexed { i, k -> k to (translated.getOrNull(i) ?: k) }.toMap()
    }
    fun t(key: String): String = uiTranslations[key] ?: key

    // Navigate to dashboard if logged in
    LaunchedEffect(currentUser) {
        if (currentUser != null) {
            onNavigateToDashboard()
        }
    }
    
    // Calculate age when date of birth changes
    LaunchedEffect(dateOfBirth) {
        if (dateOfBirth.isNotEmpty()) {
            try {
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val birthDate = sdf.parse(dateOfBirth)
                if (birthDate != null) {
                    val today = Calendar.getInstance()
                    val birth = Calendar.getInstance().apply { time = birthDate }
                    var calculatedAge = today.get(Calendar.YEAR) - birth.get(Calendar.YEAR)
                    
                    if (today.get(Calendar.DAY_OF_YEAR) < birth.get(Calendar.DAY_OF_YEAR)) {
                        calculatedAge--
                    }
                    
                    age = calculatedAge.toString()
                }
            } catch (e: Exception) {
                // Handle date parsing error
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))
        
        // App Logo and Title
        Icon(
            imageVector = Icons.Default.LocalPharmacy,
            contentDescription = t("MedAlert Logo"),
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = t("Create Patient Account"),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Registration Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Name Fields
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = firstName,
                        onValueChange = { firstName = it },
                        label = { Text(t("First Name")) },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = t("First Name")) },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    
                    OutlinedTextField(
                        value = lastName,
                        onValueChange = { lastName = it },
                        label = { Text(t("Last Name")) },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = t("Last Name")) },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }
                
                // Email Field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text(t("Email")) },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = t("Email")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Phone Number Field
                OutlinedTextField(
                    value = phoneNumber,
                    onValueChange = { phoneNumber = it },
                    label = { Text(t("Phone Number")) },
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = t("Phone Number")) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Date of Birth Field
                OutlinedTextField(
                    value = dateOfBirth,
                    onValueChange = { dateOfBirth = it },
                    label = { Text(t("Date of Birth")) },
                    leadingIcon = { Icon(Icons.Default.DateRange, contentDescription = t("Date of Birth")) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text(t("YYYY-MM-DD")) }
                )
                
                // Age Field (Auto-calculated)
                OutlinedTextField(
                    value = age,
                    onValueChange = { },
                    label = { Text(t("Age (Auto-calculated)")) },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = t("Age (Auto-calculated)")) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false,
                    singleLine = true
                )
                
                // Gender Field
                ExposedDropdownMenuBox(
                    expanded = genderExpanded,
                    onExpandedChange = { genderExpanded = !genderExpanded }
                ) {
                    OutlinedTextField(
                        value = gender,
                        onValueChange = { },
                        readOnly = true,
                        label = { Text(t("Gender")) },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = t("Gender")) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = genderExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = genderExpanded,
                        onDismissRequest = { genderExpanded = false }
                    ) {
                        listOf("male", "female", "other").forEach { option ->
                            DropdownMenuItem(
                                text = { Text(t(option)) },
                                onClick = {
                                    gender = option
                                    genderExpanded = false
                                }
                            )
                        }
                    }
                }
                
                // Password Fields
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text(t("Password")) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = t("Password")) },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = if (passwordVisible) t("Hide password") else t("Show password")
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text(t("Confirm Password")) },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = t("Confirm Password")) },
                    trailingIcon = {
                        IconButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                            Icon(
                                imageVector = if (confirmPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = if (confirmPasswordVisible) t("Hide password") else t("Show password")
                            )
                        }
                    },
                    visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Error Message
                uiState.error?.let { error ->
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                
                // Register Button
                Button(
                    onClick = {
                        if (validateForm(firstName, lastName, email, password, confirmPassword, dateOfBirth, gender, phoneNumber)) {
                            authViewModel.register(
                                firstName = firstName,
                                lastName = lastName,
                                email = email,
                                password = password,
                                confirmPassword = confirmPassword,
                                dateOfBirth = dateOfBirth,
                                age = age.toIntOrNull() ?: 0,
                                gender = gender,
                                phoneNumber = phoneNumber
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isLoading
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(t("Create Account"))
                }
                
                // Login Link
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(t("Already have an account? "))
                    TextButton(onClick = onNavigateToLogin) {
                        Text(t("Sign In"))
                    }
                }
            }
        }
    }
}

private fun validateForm(
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    confirmPassword: String,
    dateOfBirth: String,
    gender: String,
    phoneNumber: String
): Boolean {
    return firstName.isNotBlank() &&
            lastName.isNotBlank() &&
            email.isNotBlank() &&
            password.isNotBlank() &&
            confirmPassword.isNotBlank() &&
            dateOfBirth.isNotBlank() &&
            gender.isNotBlank() &&
            phoneNumber.isNotBlank() &&
            password == confirmPassword &&
            password.length >= 6
}