# ProGuard rules for Photocopy Plus (Cafe Bazaar & Myket release)
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.photocopy.scanmaster.** { *; }
-dontwarn okio.**
-dontwarn javax.annotation.**
