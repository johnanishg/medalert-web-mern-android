# MedAlert Patient Android App

A native Android application for the MedAlert healthcare management system, specifically designed for patients to manage their medications, track adherence, and communicate with healthcare providers.

## 🚀 Features

### 📱 Patient Dashboard
- **Medication Overview**: View all current medications with dosages and schedules
- **Quick Stats**: Total medications, active reminders, missed doses, and adherence rate
- **Upcoming Reminders**: Next medication times with visual indicators
- **Patient ID Display**: Easy access to unique patient ID for doctor consultations

### 💊 Medication Management
- **Medication List**: Complete list of prescribed medications
- **Dosage Information**: Detailed dosage, frequency, and duration information
- **Custom Timing**: Set personalized reminder times for each medication
- **Food Timing**: Track whether medications should be taken before, after, or with food
- **Prescription History**: View past prescriptions and medication changes

### 🔔 Smart Notifications
- **Scheduled Reminders**: Automatic notifications at set medication times
- **Quick Actions**: Mark medications as taken or missed directly from notifications
- **Adherence Tracking**: Record medication intake with timestamps
- **Notification Management**: Enable/disable reminders for specific medications

### 👤 Profile Management
- **Personal Information**: Name, age, gender, contact details
- **Medical History**: Track medical conditions and allergies
- **Emergency Contacts**: Quick access to emergency contact information
- **Caretaker Assignment**: Connect with assigned caretakers for monitoring

### 📊 Adherence Tracking
- **Real-time Tracking**: Record medication intake as it happens
- **Adherence Rate**: Visual representation of medication compliance
- **Historical Data**: View past adherence records and patterns
- **Progress Monitoring**: Track improvement over time

## 🛠️ Technology Stack

### Frontend
- **Kotlin** - Modern Android development language
- **Jetpack Compose** - Modern UI toolkit for native Android
- **Material Design 3** - Latest Material Design components
- **Navigation Component** - Type-safe navigation between screens
- **ViewModel & LiveData** - MVVM architecture pattern

### Networking & Data
- **Retrofit** - HTTP client for API communication
- **Gson** - JSON serialization/deserialization
- **OkHttp** - HTTP client with logging and interceptors
- **DataStore** - Modern data storage solution for preferences

### Dependency Injection
- **Hilt** - Dependency injection framework
- **Dagger** - Compile-time dependency injection

### Background Processing
- **WorkManager** - Background task scheduling
- **AlarmManager** - Exact timing for medication reminders
- **Notification API** - Rich notification system

## 📋 Prerequisites

- **Android Studio** Arctic Fox or later
- **Android SDK** API level 24 (Android 7.0) or higher
- **Kotlin** 1.9.0 or later
- **Gradle** 8.0 or later

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/johnanishg/medalert.git
cd medalert/android-app
```

### 2. Open in Android Studio
1. Open Android Studio
2. Select "Open an existing project"
3. Navigate to the `android-app` folder
4. Click "OK" to open the project

### 3. Configure Backend Connection
Update the base URL in `NetworkModule.kt`:
```kotlin
private const val BASE_URL = "http://your-backend-url:5001/api/"
```

For local development:
- **Emulator**: Use `http://10.0.2.2:5001/api/`
- **Physical Device**: Use your computer's IP address `http://192.168.x.x:5001/api/`

### 4. Build and Run
1. Connect an Android device or start an emulator
2. Click "Run" in Android Studio or use `Ctrl+R`
3. The app will install and launch automatically

## 📱 App Structure

### Architecture
```
app/
├── data/
│   ├── api/           # API service interfaces
│   ├── model/         # Data models and DTOs
│   ├── repository/    # Data repository implementations
│   └── local/         # Local storage (DataStore)
├── di/                # Dependency injection modules
├── ui/
│   ├── screens/       # Compose screens
│   ├── components/    # Reusable UI components
│   └── theme/         # App theming
├── viewmodel/         # ViewModels for MVVM
├── navigation/        # Navigation setup
└── notifications/     # Notification handling
```

### Key Components

#### Data Layer
- **ApiService**: Retrofit interface for backend communication
- **PatientRepository**: Centralized data access layer
- **UserPreferences**: Local storage for user data and tokens

#### UI Layer
- **LoginScreen**: Patient authentication
- **RegisterScreen**: New patient registration
- **DashboardScreen**: Main patient dashboard
- **MedicationsScreen**: Medication management
- **ProfileScreen**: Patient profile and settings
- **NotificationsScreen**: Notification management

#### Business Logic
- **AuthViewModel**: Authentication state management
- **PatientViewModel**: Patient data and medication management
- **NotificationScheduler**: Background notification scheduling

## 🔔 Notification System

### Features
- **Exact Timing**: Precise medication reminders using AlarmManager
- **Rich Notifications**: Detailed medication information in notifications
- **Quick Actions**: Mark as taken/missed directly from notification
- **Persistent Reminders**: Notifications survive device reboots
- **Custom Scheduling**: Patient-set reminder times

### Implementation
```kotlin
// Schedule a medication reminder
NotificationScheduler.scheduleNotification(
    context = context,
    notification = medicineNotification,
    notificationTime = notificationTime
)
```

## 🔐 Security Features

### Authentication
- **JWT Tokens**: Secure authentication with the backend
- **Token Storage**: Encrypted token storage using DataStore
- **Auto-refresh**: Automatic token refresh on app startup
- **Secure Logout**: Complete token cleanup on logout

### Data Protection
- **HTTPS Communication**: Encrypted API communication
- **Input Validation**: Client-side validation for all user inputs
- **Error Handling**: Graceful error handling and user feedback

## 📊 Data Synchronization

### Real-time Updates
- **Pull-to-Refresh**: Manual data refresh on all screens
- **Auto-sync**: Automatic data synchronization on app startup
- **Offline Support**: Basic offline functionality with local caching
- **Conflict Resolution**: Handle data conflicts gracefully

### API Integration
```kotlin
// Example API call
suspend fun getPatientProfile(): Result<Patient> {
    return try {
        val response = apiService.getPatientProfile(userId)
        if (response.isSuccessful) {
            Result.success(response.body()!!.data!!)
        } else {
            Result.failure(Exception(response.message()))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

## 🎨 UI/UX Design

### Material Design 3
- **Dynamic Colors**: Adaptive color schemes
- **Consistent Typography**: Material Design typography scale
- **Accessibility**: Full accessibility support with content descriptions
- **Dark Mode**: Automatic dark/light theme switching

### User Experience
- **Intuitive Navigation**: Clear navigation patterns
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Confirmation Dialogs**: Important action confirmations

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumentation Tests
```bash
./gradlew connectedAndroidTest
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Medication list display
- [ ] Notification scheduling
- [ ] Adherence recording
- [ ] Profile management
- [ ] Network error handling

## 🚀 Deployment

### Debug Build
```bash
./gradlew assembleDebug
```

### Release Build
```bash
./gradlew assembleRelease
```

### Play Store Preparation
1. Update version code and name in `build.gradle`
2. Generate signed APK or AAB
3. Test on multiple devices
4. Prepare store listing materials

## 🔧 Configuration

### Environment Variables
Create `local.properties` file:
```properties
# Backend Configuration
api.base.url=http://your-backend-url:5001/api/

# Debug Configuration
debug.logging=true
```

### Build Variants
- **Debug**: Development build with logging
- **Release**: Production build with optimizations

## 📱 Device Requirements

### Minimum Requirements
- **Android 7.0** (API level 24)
- **2GB RAM**
- **100MB storage space**
- **Internet connection**

### Recommended
- **Android 10.0** (API level 29) or higher
- **4GB RAM**
- **Notification permissions**
- **Exact alarm permissions** (Android 12+)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- Follow Kotlin coding conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent formatting

## 📞 Support

### Troubleshooting
- **Build Issues**: Clean and rebuild project
- **Network Issues**: Check backend URL configuration
- **Notification Issues**: Verify permissions and alarm settings

### Getting Help
- **GitHub Issues**: [Create an issue](https://github.com/johnanishg/medalert/issues)
- **Documentation**: Check inline code comments
- **Stack Overflow**: Tag questions with `medalert-android`

## 🗺️ Roadmap

### Upcoming Features
- [ ] **Offline Mode**: Full offline functionality
- [ ] **Biometric Authentication**: Fingerprint/face unlock
- [ ] **Voice Commands**: Voice-activated medication recording
- [ ] **Pill Recognition**: Camera-based pill identification
- [ ] **Health Metrics**: Integration with health monitoring devices
- [ ] **Family Sharing**: Share medication status with family members
- [ ] **Telemedicine**: Video consultation integration
- [ ] **AI Insights**: Personalized health recommendations

### Version History
- **v1.0.0** - Initial release with core patient features
- **v1.1.0** - Enhanced notification system
- **v1.2.0** - Improved adherence tracking
- **v1.3.0** - Profile management enhancements

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Android Team** for Jetpack Compose
- **Material Design** for design guidelines
- **Retrofit Team** for networking library
- **Hilt Team** for dependency injection
- **Open Source Community** for inspiration and support

---

**Made with ❤️ for better healthcare management on Android**