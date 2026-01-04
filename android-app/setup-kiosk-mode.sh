#!/bin/bash
# MedAlert Kiosk Mode Setup Script for Linux/Mac
# This script configures the Android device for kiosk mode

echo "========================================"
echo "MedAlert Kiosk Mode Setup"
echo "========================================"
echo ""

# Check if device is connected
echo "[1/8] Checking ADB connection..."
adb devices
if [ $? -ne 0 ]; then
    echo "ERROR: ADB not found or device not connected!"
    echo "Please ensure:"
    echo "1. ADB is installed and in PATH"
    echo "2. USB debugging is enabled on your device"
    echo "3. Device is connected via USB"
    exit 1
fi
echo ""

# Get device model
echo "[2/8] Getting device information..."
adb shell getprop ro.product.model
echo ""

# Set app as home/launcher
echo "[3/8] Setting MedAlert as default launcher..."
echo "NOTE: This may require manual setup if ADB command fails."
adb shell cmd package set-home-activity com.medalert.patient/.MainActivity
if [ $? -ne 0 ]; then
    echo ""
    echo "WARNING: Could not set as launcher via ADB."
    echo "Please manually set MedAlert as default launcher:"
    echo "1. Go to Settings > Apps > Default Apps > Home App"
    echo "2. Select 'MedAlert'"
    echo ""
    echo "Opening settings now..."
    adb shell am start -a android.settings.HOME_SETTINGS
    read -p "Press Enter after setting MedAlert as default launcher..."
else
    echo "Launcher set successfully!"
fi
echo ""

# Grant necessary permissions
echo "[4/8] Granting permissions..."
echo "NOTE: RECEIVE_BOOT_COMPLETED is automatically granted on install."
adb shell pm grant com.medalert.patient android.permission.SYSTEM_ALERT_WINDOW
if [ $? -ne 0 ]; then
    echo "WARNING: Could not grant SYSTEM_ALERT_WINDOW permission."
    echo "You may need to grant it manually in device settings."
fi
echo ""

# Enable auto-start (MIUI specific)
echo "[5/8] Enabling auto-start (MIUI)..."
adb shell pm enable com.medalert.patient
adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d package:com.medalert.patient
echo "Please manually enable 'Autostart' in the settings that opened, then press Enter to continue..."
read
echo ""

# Set device owner (requires factory reset - optional)
echo "[6/8] Device Owner Setup (Optional - requires factory reset)"
echo ""
echo "NOTE: To enable FULL kiosk mode (disable home button), you need to set the app as Device Owner."
echo "This requires the device to be factory reset OR unprovisioned."
echo ""
echo -n "Do you want to try setting Device Owner? (y/n): "
read setOwner
if [ "$setOwner" = "y" ] || [ "$setOwner" = "Y" ]; then
    echo "Attempting to set device owner..."
    adb shell dpm set-device-owner com.medalert.patient/.DeviceAdminReceiver
    if [ $? -eq 0 ]; then
        echo "Device Owner set successfully!"
    else
        echo "Device Owner setup failed. This is normal if device is already provisioned."
        echo "You can still use kiosk mode, but home button may not be fully disabled."
    fi
else
    echo "Skipping Device Owner setup."
fi
echo ""

# Start the app in lock task mode
echo "[7/8] Starting MedAlert app in kiosk mode..."
echo "The app will automatically enable lock task mode when it starts."
adb shell am start -n com.medalert.patient/.MainActivity
sleep 3
echo ""
echo "NOTE: Lock task mode is enabled automatically by the app."
echo "If the app is set as the default launcher, it will stay in kiosk mode."
echo ""

# Additional MIUI optimizations
echo "[8/8] Applying MIUI optimizations..."
adb shell settings put global policy_control immersive.full=*
echo ""

echo "========================================"
echo "Kiosk Mode Setup Complete!"
echo "========================================"
echo ""
echo "The device should now:"
echo "- Open MedAlert app on boot"
echo "- Keep MedAlert running in lock task mode"
echo "- Back button works within the app"
echo ""
echo "IMPORTANT NOTES:"
echo "1. To fully disable home button, you need Device Owner mode (requires factory reset)"
echo "2. Settings can still be accessed via notification bar"
echo "3. To disable kiosk mode, run: adb shell am stop-activity com.medalert.patient/.MainActivity"
echo ""

