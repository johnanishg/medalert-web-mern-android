# Offline Storage Implementation

## Overview
This document describes the implementation of SQLite local storage with offline support for the MedAlert Android app.

## Features Implemented

### 1. Network Connectivity Management
- **NetworkConnectivityManager** (`util/NetworkConnectivityManager.kt`):
  - Checks internet connectivity status
  - Provides observable Flow for connectivity changes
  - Validates that device has actual internet access (not just network connection)

### 2. Local Database with Room
- **PatientDatabase** (`data/local/PatientDatabase.kt`):
  - SQLite database using Room persistence library
  - Stores patient data, medications, notifications, visits, and caretaker approvals
  - Entity classes with JSON serialization for complex nested data
  - DAO interfaces for all data types

### 3. Offline Support in Repository
- **PatientRepository** updates:
  - **Data Sync**: Automatically syncs all patient data to local database after successful login and on data fetch
  - **Offline Reads**: Falls back to local database when network requests fail
  - **Connectivity Checks**: All update operations require internet connection
  - **Error Handling**: Gracefully handles offline scenarios

### 4. Update Protection
All data modification operations check for connectivity before proceeding:
- `updatePatientProfile()` - Updates patient information
- `addMedicine()` - Adds new medication
- `updateMedicine()` - Updates existing medication
- `updateMedicineTiming()` - Updates medication timing
- `deleteMedicine()` - Deletes medication
- `setMedicineTimings()` - Sets notification timings
- `recordAdherence()` - Records dose adherence
- `assignCaretaker()` - Assigns caretaker

## How It Works

### Login Flow
1. User logs in with credentials
2. Authentication token saved to UserPreferences
3. User data saved to UserPreferences
4. On first data fetch, all data is synced to local SQLite database

### Data Fetching
1. App attempts to fetch from network
2. If successful:
   - Data displayed to user
   - Data synced to local database
3. If network fails:
   - Falls back to local database
   - Data displayed from cache
   - User warned if data is stale

### Data Updates
1. User attempts update action (e.g., add medicine)
2. Connectivity checked
3. If online:
   - API call made
   - Server updated
   - Local database updated if applicable
   - Success message shown
4. If offline:
   - Error message: "No internet connection. Please connect to the internet to make updates."
   - Operation blocked

## Database Schema

### Tables
1. **patients**: Core patient information
2. **medications**: Patient medications with all details
3. **medicine_notifications**: Notification settings
4. **visits**: Visit history
5. **caretaker_approvals**: Caretaker management
6. **adherence_records**: Dose tracking (optional, future use)
7. **schedule_entries**: Detailed scheduling (optional, future use)

### Data Storage Strategy
- Complex nested objects stored as JSON strings
- Primary keys use composite keys where appropriate
- All data flattened for efficient SQLite queries
- Converter methods between entities and domain models

## Dependencies Added
No new dependencies required - uses existing:
- Room Database (already in build.gradle)
- Gson (already in build.gradle)
- Kotlin Coroutines Flow (already in build.gradle)

## Testing Recommendations

### Manual Testing
1. **Offline Read Test**:
   - Log in with internet
   - View medications/dashboard
   - Turn off internet
   - Reload app - should show cached data

2. **Offline Update Test**:
   - Turn off internet
   - Try to add/update medicine
   - Should show connectivity error

3. **Sync Test**:
   - Log in
   - Check database file exists
   - Log out and back in
   - Verify data syncs correctly

### Unit Testing
- Test `NetworkConnectivityManager` connectivity detection
- Test `syncPatientDataToLocal()` data persistence
- Test `getLocalPatientData()` data retrieval
- Test `requireConnectivity()` blocking behavior

## Future Enhancements

### Optional Improvements
1. **Sync Queue**: Queue update operations when offline
2. **Conflict Resolution**: Handle data conflicts on sync
3. **Incremental Sync**: Only fetch changed data
4. **Background Sync**: Periodic background sync
5. **Data Expiry**: Mark stale data in UI
6. **Offline Indicators**: Show UI when offline

## Benefits
1. **Fast Data Access**: Local reads are instant
2. **Offline Functionality**: View data without internet
3. **Better UX**: No loading delays for cached data
4. **Data Integrity**: Updates only when connectivity verified
5. **Reduced API Calls**: Fewer redundant network requests

## User Experience
- **Online**: Seamless experience with automatic sync
- **Offline**: Can view data, cannot make changes
- **Transition**: Graceful fallback when connection lost
- **Recovery**: Automatic sync when connection restored

## Files Modified
1. Created: `util/NetworkConnectivityManager.kt`
2. Created: `data/local/PatientDatabase.kt`
3. Modified: `data/repository/PatientRepository.kt`
4. Modified: `di/NetworkModule.kt`

## Permissions Required
Already included in AndroidManifest.xml:
- `INTERNET`
- `ACCESS_NETWORK_STATE`
