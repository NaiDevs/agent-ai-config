plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val releaseStoreFile = System.getenv("NAI_ANDROID_RELEASE_STORE_FILE")
val releaseStorePassword = System.getenv("NAI_ANDROID_RELEASE_STORE_PASSWORD")
val releaseKeyPassword = System.getenv("NAI_ANDROID_RELEASE_KEY_PASSWORD")
val releaseRequested = gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }
if (releaseRequested && (releaseStoreFile.isNullOrBlank() ||
        releaseStorePassword.isNullOrBlank() || releaseKeyPassword.isNullOrBlank())) {
    throw GradleException("La compilacion release requiere la clave local NAI_ANDROID_RELEASE_*.")
}

android {
    namespace = "tech.naidevs.nai_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "tech.naidevs.nai_mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (!releaseStoreFile.isNullOrBlank() && !releaseStorePassword.isNullOrBlank() &&
            !releaseKeyPassword.isNullOrBlank()) {
            create("naiRelease") {
                keyAlias = "nai-mobile-release"
                keyPassword = releaseKeyPassword
                storeFile = file(releaseStoreFile)
                storePassword = releaseStorePassword
            }
        }
    }

    buildTypes {
        getByName("debug") {
            proguardFiles("proguard-rules.pro")
        }
        release {
            signingConfig = signingConfigs.findByName("naiRelease")
            proguardFiles("proguard-rules.pro")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
