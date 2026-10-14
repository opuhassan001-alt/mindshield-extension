package com.mindshield.mobile.service

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import com.mindshield.mobile.R

/**
 * MindShield Accessibility Service for Android
 * Monitors Instagram Reels, YouTube Shorts, TikTok, and Facebook Reels.
 * Enforces dual threshold: 10 reels watched OR 15 minutes of active watch time.
 * Zero-Secret Architecture: All puzzles generated locally without API keys.
 */
class MindShieldAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "MindShieldService"
        private const val REEL_LIMIT = 10
        private const val TIME_LIMIT_MINUTES = 15L
        private const val DEBOUNCE_MILLIS = 2000L

        private val TARGET_PACKAGES = setOf(
            "com.instagram.android",
            "com.google.android.youtube",
            "com.zhiliaoapp.musically",      // TikTok
            "com.facebook.katana"            // Facebook
        )
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var isOverlayShowing = false

    private var currentPackage: String? = null
    private var reelCount = 0
    private var sessionStartTime = 0L
    private var lastScrollTimestamp = 0L

    private val mainHandler = Handler(Looper.getMainLooper())
    private val timeCheckRunnable = object : Runnable {
        override fun run() {
            checkTimeThreshold()
            if (!isOverlayShowing) {
                mainHandler.postDelayed(this, 5000L) // Check every 5 seconds
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        Log.i(TAG, "MindShield Accessibility Service successfully connected.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val pkgName = event.packageName?.toString() ?: return

        // 1. Detect App Foreground Transition
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (TARGET_PACKAGES.contains(pkgName)) {
                if (currentPackage != pkgName) {
                    currentPackage = pkgName
                    sessionStartTime = System.currentTimeMillis()
                    mainHandler.post(timeCheckRunnable)
                    Log.i(TAG, "Entered target short-form app: $pkgName. Timer started.")
                }
            } else {
                if (currentPackage != null) {
                    Log.i(TAG, "Exited target short-form app: $currentPackage")
                    currentPackage = null
                    mainHandler.removeCallbacks(timeCheckRunnable)
                }
            }
        }

        // 2. Detect Vertical Scroll Gestures inside Reels / Shorts
        if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED && TARGET_PACKAGES.contains(pkgName)) {
            val now = System.currentTimeMillis()
            if (now - lastScrollTimestamp > DEBOUNCE_MILLIS) {
                lastScrollTimestamp = now
                reelCount++
                Log.i(TAG, "Reel counted: $reelCount / $REEL_LIMIT (Package: $pkgName)")

                if (reelCount >= REEL_LIMIT) {
                    triggerLockOverlay(reason = "Reel Limit Reached (10 Reels)")
                }
            }
        }
    }

    private fun checkTimeThreshold() {
        if (currentPackage == null || sessionStartTime == 0L || isOverlayShowing) return

        val elapsedMinutes = (System.currentTimeMillis() - sessionStartTime) / (1000 * 60)
        if (elapsedMinutes >= TIME_LIMIT_MINUTES) {
            triggerLockOverlay(reason = "Time Limit Reached (15 Minutes)")
        }
    }

    /**
     * Display the full-screen non-dismissible cognitive intervention overlay
     */
    private fun triggerLockOverlay(reason: String) {
        if (isOverlayShowing) return
        isOverlayShowing = true
        Log.w(TAG, "Triggering MindShield intervention overlay: $reason")

        mainHandler.post {
            val layoutParams = WindowManager.LayoutParams().apply {
                type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }
                flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                format = PixelFormat.TRANSLUCENT
                width = WindowManager.LayoutParams.MATCH_PARENT
                height = WindowManager.LayoutParams.MATCH_PARENT
                gravity = Gravity.CENTER
            }

            // Inflate full-screen UI
            val inflater = LayoutInflater.from(this)
            val view = inflater.inflate(R.layout.overlay_cognitive_challenge, null)
            overlayView = view

            // Bind UI & local IBA / BCS questions
            val titleView = view.findViewById<TextView>(R.id.tv_challenge_title)
            val questionView = view.findViewById<TextView>(R.id.tv_question_text)
            val optionsGroup = view.findViewById<RadioGroup>(R.id.rg_options)
            val submitBtn = view.findViewById<Button>(R.id.btn_submit_challenge)

            titleView.text = "🛡️ MindShield: $reason"
            questionView.text = "IBA Standard: Worker A finishes a task in 10 days, Worker B in 15 days. Together, how many days will they take?"
            
            // Local options
            val options = listOf("6 days", "5 days", "12 days", "8 days")
            val correctAns = "6 days"

            optionsGroup.removeAllViews()
            options.forEach { opt ->
                val rb = RadioButton(this).apply {
                    text = opt
                    id = View.generateViewId()
                }
                optionsGroup.addView(rb)
            }

            submitBtn.setOnClickListener {
                val selectedId = optionsGroup.checkedRadioButtonId
                if (selectedId != -1) {
                    val selectedRb = view.findViewById<RadioButton>(selectedId)
                    if (selectedRb.text == correctAns) {
                        // Prefrontal cortex unlocked!
                        dismissOverlay()
                    } else {
                        questionView.text = "❌ Incorrect! Executive function test failed. Try again!"
                    }
                }
            }

            windowManager?.addView(view, layoutParams)
        }
    }

    private fun dismissOverlay() {
        if (!isOverlayShowing) return
        overlayView?.let { windowManager?.removeView(it) }
        overlayView = null
        isOverlayShowing = false
        reelCount = 0
        sessionStartTime = System.currentTimeMillis()
        Log.i(TAG, "Challenge passed! Overlay dismissed, session reset.")
    }

    override fun onInterrupt() {
        mainHandler.removeCallbacks(timeCheckRunnable)
        dismissOverlay()
    }

    override fun onDestroy() {
        super.onDestroy()
        dismissOverlay()
    }
}

