#!/bin/bash

echo "🔧 MedAlert KAPT Troubleshooting Script"
echo "========================================"

echo "1. Stopping Gradle daemon..."
./gradlew --stop

echo "2. Cleaning project..."
./gradlew clean

echo "3. Clearing Gradle cache..."
rm -rf ~/.gradle/caches/

echo "4. Clearing build directory..."
rm -rf app/build/

echo "5. Clearing KAPT generated files..."
rm -rf app/build/generated/source/kapt/

echo "6. Running KAPT task with verbose output..."
./gradlew kaptDebugKotlin --stacktrace --info --no-build-cache

echo "7. If KAPT succeeds, running full build..."
if [ $? -eq 0 ]; then
    echo "✅ KAPT successful, running full build..."
    ./gradlew assembleDebug
else
    echo "❌ KAPT failed. Check the output above for details."
    echo ""
    echo "Common KAPT issues and solutions:"
    echo ""
    echo "🔍 DAGGER/HILT ISSUES:"
    echo "- Missing @HiltAndroidApp in Application class"
    echo "- Missing @AndroidEntryPoint in Activities/Fragments"
    echo "- Incorrect @Module and @InstallIn annotations"
    echo "- Circular dependencies in dependency graph"
    echo "- Type mismatches in @Provides methods"
    echo ""
    echo "🔍 ROOM ISSUES (if using Room):"
    echo "- Incorrect @Entity, @Dao, @Database annotations"
    echo "- Type converter implementation issues"
    echo "- SQL query syntax errors in @Query"
    echo ""
    echo "🔍 GENERAL ISSUES:"
    echo "- Memory issues: Increase JVM heap size in gradle.properties"
    echo "- Annotation conflicts: Check for duplicate annotations"
    echo "- Missing dependencies: Ensure all annotation processor dependencies"
    echo "- Version conflicts: Check Hilt/Kotlin/Gradle compatibility"
    echo "- Generated code conflicts: Clean and rebuild"
    echo ""
    echo "🔧 NEXT STEPS:"
    echo "1. Check the stacktrace above for specific error details"
    echo "2. Look for 'Caused by:' in the output for root cause"
    echo "3. Verify all Hilt annotations are correctly placed"
    echo "4. Check for circular dependencies"
    echo "5. Ensure all required dependencies are included"
fi
