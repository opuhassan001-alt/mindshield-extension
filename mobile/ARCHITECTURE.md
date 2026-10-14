# 📱 MindShield Mobile Architecture Blueprint (Android & iOS)

MindShield Mobile extends the dopamine-interception paradigm from desktop browsers directly into native mobile operating systems. Because mobile apps (Instagram, YouTube, TikTok, Facebook) operate inside isolated native sandboxes, browser extensions cannot monitor them directly. This document details the production-grade engineering architecture to achieve **10 Reels OR 15-Minute** intervention on mobile devices.

---

## 🏗️ 1. Architecture Overview

```
                      +---------------------------------------+
                      |       User Opens Mobile App           |
                      |  (Instagram, YouTube, TikTok, FB)     |
                      +-------------------+-------------------+
                                          |
                                          v
      +-----------------------------------+-----------------------------------+
      |                                                                       |
      v (Android Pipeline)                                                    v (iOS Pipeline)
+-----------------------------------+               +-----------------------------------+
|     AccessibilityService          |               |       Screen Time API             |
| - Intercepts TYPE_VIEW_SCROLLED   |               | - DeviceActivityMonitor           |
| - Inspects UI Node Hierarchy      |               | - FamilyControls Authorization    |
| - Measures active foreground time |               | - 15-minute Schedule Threshold    |
+-----------------+-----------------+               +-----------------+-----------------+
                  |                                                   |
                  v                                                   v
+-----------------------------------+               +-----------------------------------+
|      Dual Criteria Evaluator      |               |       System Shield Action        |
| - Reached 10 vertical scrolls?    |               | - Triggers ManagedSettings.shield |
| - Reached 15 mins foreground time?|               | - Intercepts app launch           |
+-----------------+-----------------+               +-----------------+-----------------+
                  |                                                   |
                  v                                                   v
+-----------------------------------+               +-----------------------------------+
| WindowManager System Alert Overlay|               | Deep Link to MindShield App       |
| - Full-screen TYPE_APPLICATION_   |               | - Full-screen cognitive puzzle    |
|   OVERLAY                         |               | - IBA / BCS Math & Lateral Logic  |
| - Traps touch events              |               | - Prefrontal Cortex activation    |
+-----------------+-----------------+               +-----------------+-----------------+
                  |                                                   |
                  v                                                   v
+-----------------------------------------------------------------------------+
|                     Prefrontal Challenge Engine (Local)                     |
|  - IBA Admission Math / BCS Mental Ability / Brain Cryptography             |
|  - Zero API Key Client Architecture (100% on-device generative algorithms)   |
|  - Cooldown Lockout (30 min) with detailed solution on failure              |
+-----------------------------------------------------------------------------+
```

---

## 🤖 2. Android Implementation Architecture

### 2.1 Core Components
1. **`AccessibilityService` (`MindShieldAccessibilityService`)**:
   - Registered with `android.permission.BIND_ACCESSIBILITY_SERVICE`.
   - Monitors target package names:
     - `com.instagram.android`
     - `com.google.android.youtube`
     - `com.zhiliaoapp.musically` (TikTok)
     - `com.facebook.katana`
   - Listens to `AccessibilityEvent.TYPE_VIEW_SCROLLED` and `AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED`.
   - Inspects `AccessibilityNodeInfo` hierarchy to detect if the user is in the Reels/Shorts tab (e.g., node resource-id matching `reel_viewer`, `shorts_container`).

2. **Dwell Time & Scroll Aggregator (`SessionTracker`)**:
   - Tracks two independent variables:
     1. `scrollCount`: Incremented when vertical scroll velocity > threshold with a 2-second debounce.
     2. `activeDwellMillis`: Foreground timer running via a background Coroutine ticker.
   - Triggers intervention when `scrollCount >= 10` **OR** `activeDwellMinutes >= 15`.

3. **Overlay Service (`WindowManager` + Jetpack Compose)**:
   - Uses `Settings.canDrawOverlays()` and permission `android.permission.SYSTEM_ALERT_WINDOW`.
   - Inflates a full-screen window with flags:
     ```kotlin
     WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
     WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
     WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
     ```
   - Renders the interactive challenge (IBA/BCS math, brain games). Upon passing, removes overlay and resets counters.

---

## 🍏 3. iOS Implementation Architecture

### 3.1 Core Components (iOS 16+ Screen Time API)
Apple strictly prohibits drawing overlays over third-party apps. However, iOS 16 introduced the **Screen Time API**, enabling native, unbypassable system intervention:

1. **`FamilyControls` Framework**:
   - Requests user authorization via `AuthorizationCenter.shared.requestAuthorization(for: .individual)`.
   - Prompts the user to select Instagram, YouTube, and TikTok via `FamilyActivityPicker`.

2. **`DeviceActivityMonitorExtension`**:
   - Defines a `DeviceActivitySchedule` and `DeviceActivityEvent`:
     ```swift
     let event = DeviceActivityEvent(
         applications: selectedApps,
         threshold: DateComponents(minute: 15) // 15-minute threshold
     )
     ```
   - When the user accumulates 15 minutes across short-form apps, `intervalDidStart` / `eventDidReachThreshold` is invoked by iOS in the background.

3. **`ManagedSettingsStore` & `ShieldConfigurationExtension`**:
   - Activates `store.shield.applications = selectedApps`.
   - Immediately replaces Instagram/YouTube with a custom system shield:
     - Title: "MindShield: Focus Limit Reached"
     - Subtitle: "15 minutes or 10 videos completed. Solve your IBA / BCS mental challenge to unlock."
     - Primary Button: "Take Cognitive Challenge" -> Deep-links directly to `mindshield://challenge`.
   - Inside the MindShield app, the user solves the challenge. Once verified, the app removes the shield via `store.shield.applications = nil`.

---

## 🔒 4. Anti-Bot & Zero-Secret Security Architecture

### Why No API Keys Are Stored On Client Devices
1. **Client Decompilation Risk**:
   - In both Android APKs (via `jadx` / `apktool`) and Chrome Extensions, any hardcoded API key (`AI_API_KEY = "sk-..."`) can be extracted in seconds by web scrapers and rogue bots.
2. **MindShield Zero-Secret Paradigm**:
   - All **IBA / BCS entrance math**, **mental ability logic**, and **brain cryptography games** are generated algorithmically on-device using mathematical permutations, algebraic templates, and modular arithmetic.
   - All focus soundscapes (Binaural 40Hz Gamma waves, Pink/Brown noise, Isochronic pulses) are synthesized in real-time on the device DSP (Android `AudioTrack` / Web Audio API / iOS `AVAudioEngine`).
   - **Result**: Zero network dependency, zero API keys required, completely impervious to bot scraping.

### Cloud Integration (If External LLM Evaluation Is Desired)
If future versions optionally query an external model for natural language answers:
```
[Client App] ──(Signed JWT with App Check)──> [Cloudflare Worker / Edge Proxy] ──(Secret Vault)──> [LLM API]
```
- **App Check / Play Integrity API**: Android enforces Google Play Integrity, iOS enforces DeviceCheck to verify requests originate from legitimate, unmodified client apps.
- **Rate Limiting**: Cloudflare Worker enforces strict rate limits (e.g., max 3 requests/minute per device).
- **Zero Secrets on Client**: API keys reside strictly inside server-side environment variables protected by KMS/Vault.

