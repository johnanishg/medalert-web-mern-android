package com.medalert.patient.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun RefreshButtonTest(
    modifier: Modifier = Modifier
) {
    var isLoading by remember { mutableStateOf(false) }
    var refreshCount by remember { mutableStateOf(0) }
    var lastRefreshTime by remember { mutableStateOf("Never") }
    
    val simulateRefresh: () -> Unit = {
        isLoading = true
        refreshCount++
        lastRefreshTime = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
            .format(java.util.Date())
        
        // Simulate network delay
        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
            delay(2000) // 2 second delay
            isLoading = false
        }
    }
    
    Column(
        modifier = modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Refresh Button Test",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "This test demonstrates different types of refresh buttons:",
            style = MaterialTheme.typography.bodyMedium
        )
        
        // Status Card
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Refresh Status",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Refresh Count: $refreshCount",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "Last Refresh: $lastRefreshTime",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "Status: ${if (isLoading) "Loading..." else "Ready"}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
        
        // Refresh Button Examples
        Card {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Refresh Button Types",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Standard Refresh Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Standard Refresh Button:")
                    RefreshButton(
                        onClick = simulateRefresh
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Refresh Button with Loading
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Refresh Button with Loading:")
                    RefreshButtonWithLoading(
                        onClick = simulateRefresh,
                        isLoading = isLoading
                    )
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Floating Action Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Floating Action Button:")
                    RefreshFloatingActionButton(
                        onClick = simulateRefresh
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Floating Action Button with Loading
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("FAB with Loading:")
                    RefreshFloatingActionButtonWithLoading(
                        onClick = simulateRefresh,
                        isLoading = isLoading
                    )
                }
            }
        }
        
        // Usage Instructions
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Usage Instructions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "• Standard Refresh Button: Simple refresh with icon",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• Refresh with Loading: Shows loading indicator during refresh",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• Floating Action Button: Prominent refresh button",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "• FAB with Loading: FAB with loading state",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
