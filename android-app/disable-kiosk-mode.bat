@echo off
REM Script to disable kiosk mode

echo Disabling kiosk mode...
adb shell am stop-activity com.medalert.patient/.MainActivity
adb shell am force-stop com.medalert.patient

echo Resetting home activity...
adb shell cmd package set-home-activity com.miui.home/.launcher.Launcher

echo Kiosk mode disabled.
echo You may need to manually change the default launcher in device settings.
pause

