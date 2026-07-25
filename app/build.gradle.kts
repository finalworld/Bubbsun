import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    val releaseKeystore = file("bubbsun-release.jks")
    val signingProperties = Properties().apply {
        val signingFile = file("signing.properties")
        if (signingFile.exists()) signingFile.inputStream().use { load(it) }
    }
    signingConfigs {
        if (releaseKeystore.exists()) {
            create("bubbsunRelease") {
                storeFile = releaseKeystore
                storePassword = providers.gradleProperty("BUBBSUN_STORE_PASSWORD").orNull ?: signingProperties.getProperty("storePassword")
                keyAlias = providers.gradleProperty("BUBBSUN_KEY_ALIAS").orNull ?: signingProperties.getProperty("keyAlias", "bubbsun")
                keyPassword = providers.gradleProperty("BUBBSUN_KEY_PASSWORD").orNull ?: signingProperties.getProperty("keyPassword")
            }
        }
    }
    namespace = "se.bubbsun.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "se.bubbsun.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 471
        versionName = "0.471"
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            if (releaseKeystore.exists()) {
                signingConfig = signingConfigs.getByName("bubbsunRelease")
            }
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
