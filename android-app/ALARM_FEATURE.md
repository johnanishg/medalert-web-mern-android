# Medicine Alarm Feature

This document describes the alarm functionality implemented for medicine time notifications in the MedAlert Android app.

## Overview

The alarm feature provides audible and vibratory alerts when it's time to take medicine, ensuring patients don't miss their medication schedules.

## Components

### 1. MedicineAlarmService
- **Location**: `app/src/main/java/com/medalert/patient/services/MedicineAlarmService.kt`
- **Purpose**: Foreground service that handles alarm sounds, vibrations, and persistent notifications
- **Features**:
  - Plays system alarm sound
  - Vibrates device with custom pattern
  - Shows persistent notification with action buttons
  - Auto-stops after 2 minutes
  - Can be manually stopped via notification actions

### 2. Enhanced MedicationReminderReceiver
- **Location**: `app/src/main/java/com/medalert/patient/notifications/MedicationReminderReceiver.kt`
- **Purpose**: Broadcast receiver that triggers both regular notifications and alarm service
- **Features**:
  - Starts alarm service when medicine time arrives
  - Shows regular notification alongside alarm
  - Passes all medicine details to alarm service

### 3. Updated AdherenceActionReceiver
- **Location**: `app/src/main/java/com/medalert/patient/notifications/AdherenceActionReceiver.kt`
- **Purpose**: Handles user actions (taken/missed) and stops alarm
- **Features**:
  - Stops alarm when user marks medicine as taken or missed
  - Records adherence data
  - Shows confirmation toast

### 4. AlarmTestHelper
- **Location**: `app/src/main/java/com/medalert/patient/utils/AlarmTestHelper.kt`
- **Purpose**: Utility for testing alarm functionality
- **Features**:
  - Test alarm with sample data
  - Stop active alarms
  - Useful for debugging and development

## Permissions

The following permissions have been added to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

## How It Works

1. **Scheduling**: When medicine notifications are scheduled, they use the existing `MedicineSchedulingService`
2. **Triggering**: At the scheduled time, `MedicationReminderReceiver` is triggered
3. **Alarm Start**: The receiver starts `MedicineAlarmService` as a foreground service
4. **Alarm Features**:
   - Plays system alarm sound (looping)
   - Vibrates device with pattern: 1s on, 0.5s off, 1s on, 0.5s off, 1s on
   - Shows persistent notification with "Mark as Taken", "Mark as Missed", and "Stop Alarm" buttons
   - Auto-stops after 2 minutes
5. **User Interaction**: User can:
   - Mark medicine as taken/missed (stops alarm)
   - Stop alarm manually
   - Tap notification to open app

## Testing

### Manual Testing
You can test the alarm functionality using the `AlarmTestHelper`:

```kotlin
// Start test alarm
AlarmTestHelper.testAlarm(context)

// Stop alarm
AlarmTestHelper.stopAlarm(context)
```

### Integration Testing
1. Schedule a medicine notification for a few minutes in the future
2. Wait for the notification time
3. Verify that:
   - Alarm sound plays
   - Device vibrates
   - Persistent notification appears
   - Action buttons work correctly
   - Alarm stops when medicine is marked as taken/missed

## Customization

### Alarm Sound
The service uses the system's default alarm sound. To customize:
1. Modify the `playAlarmSound()` method in `MedicineAlarmService`
2. Use a custom sound file or different system sound type

### Vibration Pattern
To change the vibration pattern, modify the `startVibration()` method:
```kotlin
val vibrationPattern = longArrayOf(0, 1000, 500, 1000, 500, 1000) // Customize this
```

### Auto-stop Duration
To change the auto-stop duration, modify the delay in `startAlarm()`:
```kotlin
android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
    stopAlarm()
}, 120000) // Change 120000 (2 minutes) to desired duration
```

## Troubleshooting

### Common Issues

1. **Alarm not playing**: Check if device is in silent mode or Do Not Disturb
2. **No vibration**: Verify device vibration is enabled
3. **Permission errors**: Ensure all required permissions are granted
4. **Service not starting**: Check if foreground service permissions are granted

### Debug Logs
The service includes comprehensive logging. Check logcat for:
- `MedicineAlarmService`: Alarm service logs
- `MedicationReminderReceiver`: Notification receiver logs
- `AdherenceActionReceiver`: User action logs

## Future Enhancements

Potential improvements for the alarm feature:
1. Custom alarm sounds
2. Snooze functionality
3. Escalating alarm intensity
4. Integration with smart home devices
5. Voice reminders
6. Customizable vibration patterns
7. Alarm scheduling preferences
