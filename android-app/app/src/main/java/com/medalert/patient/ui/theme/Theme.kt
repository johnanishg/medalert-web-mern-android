package com.medalert.patient.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = MedAlertPrimaryLight,
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = MedAlertPrimaryDark,
    onPrimaryContainer = Color(0xFFFFFFFF),
    secondary = MedAlertSecondaryLight,
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = MedAlertSecondaryDark,
    onSecondaryContainer = Color(0xFFFFFFFF),
    tertiary = MedAlertSuccess,
    onTertiary = Color(0xFFFFFFFF),
    error = MedAlertError,
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFF690005),
    onErrorContainer = Color(0xFFFFDAD6),
    background = BackgroundDark,
    onBackground = Color(0xFFE6E1E5),
    surface = SurfaceDark,
    onSurface = Color(0xFFE6E1E5),
    surfaceVariant = Color(0xFF49454F),
    onSurfaceVariant = Color(0xFFCAC4D0),
    outline = Color(0xFF938F99),
    outlineVariant = Color(0xFF49454F),
    scrim = Color(0xFF000000),
    inverseSurface = Color(0xFFE6E1E5),
    inverseOnSurface = Color(0xFF313033),
    inversePrimary = MedAlertPrimary
)

private val LightColorScheme = lightColorScheme(
    primary = MedAlertPrimary,
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = MedAlertPrimaryLight,
    onPrimaryContainer = Color(0xFF2B0A00),
    secondary = MedAlertSecondary,
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = MedAlertSecondaryLight,
    onSecondaryContainer = Color(0xFF001C35),
    tertiary = MedAlertSuccess,
    onTertiary = Color(0xFFFFFFFF),
    error = MedAlertError,
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    background = BackgroundLight,
    onBackground = Color(0xFF1C1B1F),
    surface = SurfaceLight,
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFE7E0EC),
    onSurfaceVariant = Color(0xFF49454F),
    outline = Color(0xFF79747E),
    outlineVariant = Color(0xFFCAC4D0),
    scrim = Color(0xFF000000),
    inverseSurface = Color(0xFF313033),
    inverseOnSurface = Color(0xFFF4EFF4),
    inversePrimary = MedAlertPrimaryLight
)

@Composable
fun MedAlertTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Disabled for consistent branding
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}