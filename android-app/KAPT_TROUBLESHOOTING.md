# KAPT Error Troubleshooting Guide

## Understanding `java.lang.reflect.InvocationTargetException` in KAPT

The `java.lang.reflect.InvocationTargetException (no error message)` during the `:app:kaptDebugKotlin` task is a common issue when using annotation processors like Dagger Hilt. This error often indicates a problem within the annotation processing itself, rather than a direct Kotlin compilation error.

## Common Causes and Solutions

### 1. Issues in Dagger/Hilt Setup

#### Missing Annotations
- Ensure all necessary Hilt annotations are correctly placed:
  - `@HiltAndroidApp` in Application class
  - `@AndroidEntryPoint` in Activities/Fragments
  - `@Module` and `@InstallIn` in dependency modules
  - `@Provides` in module methods
  - `@Inject` in constructors

#### Incorrect Scoping
- Double-check that your component scopes are correctly defined
- Ensure dependencies are provided in the appropriate scopes
- Verify `@Singleton` usage is correct

#### Circular Dependencies
- KAPT can struggle with circular dependencies
- Try to identify and break any cycles in your dependency graph
- Use `@Lazy` or `@Provider` for circular dependencies

#### Type Mismatches
- Ensure that the types you're trying to inject match the types being provided
- Check generic type parameters
- Verify return types in `@Provides` methods

### 2. Issues in Room Setup (if using Room)

#### Incorrect Entity/DAO/Database Annotations
- Verify that `@Entity`, `@Dao`, `@Database`, `@PrimaryKey`, `@ColumnInfo`, etc., are used correctly
- Check that all required fields are properly annotated

#### Type Converters
- If using custom type converters, ensure they are correctly implemented
- Register type converters with your database using `@TypeConverters`

#### Query Syntax Errors
- Check SQL queries within `@Query` annotations for syntax errors
- Ensure parameter placeholders are correct

### 3. Generated Code Conflicts or Errors

#### Clean and Rebuild
```bash
./gradlew clean
./gradlew assembleDebug
```

#### Invalidate Caches
- In Android Studio: File > Invalidate Caches / Restart
- Select "Invalidate and Restart"

### 4. Outdated Libraries

Ensure your versions are compatible:
- Kotlin version: 1.9.20
- Hilt version: 2.48
- Android Gradle Plugin: 8.1.4
- Gradle: 8.4

### 5. Build Cache Issues

#### Clear Build Cache
```bash
./gradlew clean build --no-build-cache
```

#### Clear Gradle Cache
```bash
rm -rf ~/.gradle/caches/
```

## Troubleshooting Steps

### 1. Run with Stacktrace
```bash
./gradlew :app:kaptDebugKotlin --stacktrace
```

### 2. Run with Verbose Output
```bash
./gradlew :app:kaptDebugKotlin --stacktrace --info
```

### 3. Use the Troubleshooting Script
```bash
./troubleshoot-kapt.sh
```

### 4. Examine the Full Stack Trace
Look carefully at the output. The actual error message that caused the `InvocationTargetException` will likely be buried within the stack trace.

### 5. Check the "Build" Output Tab
In Android Studio, after a failed build, switch to the "Build" output tab and scroll up to find KAPT-related errors.

### 6. Isolate the Problem
- If you've recently added new code or dependencies, try commenting them out temporarily
- If using Hilt, try removing modules one by one to see if a specific module is causing the issue

## Current Project Configuration

### KAPT Configuration
```gradle
kapt {
    correctErrorTypes true
    useBuildCache = true
    mapDiagnosticLocations = true
    showProcessorStats = true
    includeCompileClasspath = false
    arguments {
        arg("dagger.fastInit", "enabled")
        arg("dagger.formatGeneratedSource", "disabled")
        arg("dagger.hilt.android.internal.disableAndroidSuperclassValidation", "true")
    }
    javacOptions {
        option("-Xmaxerrs", 500)
        option("-Xlint:unchecked", "disabled")
        option("-Xlint:deprecation", "disabled")
    }
}
```

### JVM Settings
```properties
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8 -XX:+UseParallelGC -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.configuration-cache=true
```

## Hilt Setup Verification

### Application Class
```kotlin
@HiltAndroidApp
class MedAlertApplication : Application() {
    // ...
}
```

### Activity
```kotlin
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    // ...
}
```

### Module
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideApiService(): ApiService {
        // ...
    }
}
```

### Repository
```kotlin
@Singleton
class PatientRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    // ...
}
```

## Prevention Measures

1. **Regular Clean Builds**: Run `./gradlew clean` periodically
2. **Monitor Dependencies**: Keep Hilt and Kotlin versions updated and compatible
3. **Avoid Circular Dependencies**: Design your dependency graph carefully
4. **Use Proper Scoping**: Apply appropriate scopes to your dependencies
5. **Test Incrementally**: Add new dependencies and modules gradually

## Quick Fix Commands

```bash
# Complete reset
./gradlew --stop
rm -rf ~/.gradle/caches/
rm -rf app/build/
./gradlew clean assembleDebug

# KAPT-specific troubleshooting
./gradlew kaptDebugKotlin --stacktrace --info --no-build-cache

# Use the automated script
./troubleshoot-kapt.sh
```

## When to Seek Help

If the error persists after trying all the above solutions:

1. Share the complete stacktrace from `--stacktrace --info`
2. Indicate which annotation processors you're using (Hilt, Room, etc.)
3. Share relevant parts of your Gradle files
4. Describe any recent code changes that might have triggered the issue

The stacktrace will contain the actual underlying error that caused the `InvocationTargetException`, which is the key to solving the problem.
