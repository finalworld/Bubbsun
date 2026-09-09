import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
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
        versionCode = 700
        versionName = "0.700"
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            if (releaseKeystore.exists()) {
                signingConfig = signingConfigs.getByName("bubbsunRelease")
            }
        }
    }

    buildFeatures { buildConfig = true }

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
    sourceSets.getByName("main").java.setSrcDirs(listOf("src/twa/java"))
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
