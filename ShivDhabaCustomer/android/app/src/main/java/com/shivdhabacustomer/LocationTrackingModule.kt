package com.shivdhabacustomer

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class LocationTrackingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {
    
    private val applicationContext: ReactApplicationContext = reactContext
    private var locationReceiver: BroadcastReceiver? = null
    private var errorReceiver: BroadcastReceiver? = null
    
    companion object {
        private const val TAG = "LocationTrackingModule"
        private const val PERMISSION_REQUEST_CODE = 1001
    }

    init {
        reactContext.addActivityEventListener(this)
        setupBroadcastReceivers()
    }
    
    private fun setupBroadcastReceivers() {
        // Location update receiver
        locationReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                intent?.let {
                    val locationData = Arguments.createMap().apply {
                        putDouble("latitude", it.getDoubleExtra("latitude", 0.0))
                        putDouble("longitude", it.getDoubleExtra("longitude", 0.0))
                        putDouble("accuracy", it.getFloatExtra("accuracy", 0f).toDouble())
                        putDouble("speed", it.getDoubleExtra("speed", 0.0))
                        putDouble("heading", it.getDoubleExtra("heading", 0.0))
                        putDouble("timestamp", it.getLongExtra("timestamp", 0).toDouble())
                        it.getStringExtra("orderId")?.let { orderId -> putString("orderId", orderId) }
                        it.getStringExtra("driverId")?.let { driverId -> putString("driverId", driverId) }
                    }
                    sendEvent("locationUpdate", locationData)
                }
            }
        }
        
        // Error receiver
        errorReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                intent?.let {
                    val errorData = Arguments.createMap().apply {
                        putString("error", it.getStringExtra("error") ?: "Unknown error")
                    }
                    sendEvent("locationError", errorData)
                }
            }
        }
        
        // Register receivers
        LocalBroadcastManager.getInstance(applicationContext).registerReceiver(
            locationReceiver!!,
            IntentFilter("LOCATION_UPDATE")
        )
        LocalBroadcastManager.getInstance(applicationContext).registerReceiver(
            errorReceiver!!,
            IntentFilter("LOCATION_ERROR")
        )
    }
    
    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun getName(): String {
        return "LocationTrackingModule"
    }

    @ReactMethod
    fun requestLocationPermissions(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity available")
            return
        }

        val permissions = mutableListOf<String>().apply {
            add(android.Manifest.permission.ACCESS_FINE_LOCATION)
            add(android.Manifest.permission.ACCESS_COARSE_LOCATION)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                add(android.Manifest.permission.ACCESS_BACKGROUND_LOCATION)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(reactApplicationContext, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isEmpty()) {
            promise.resolve(true)
        } else {
            ActivityCompat.requestPermissions(
                activity,
                missingPermissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun checkLocationPermissions(promise: Promise) {
        val fineLocation = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val coarseLocation = ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val backgroundLocation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                android.Manifest.permission.ACCESS_BACKGROUND_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }

        val result = Arguments.createMap().apply {
            putBoolean("fineLocation", fineLocation)
            putBoolean("coarseLocation", coarseLocation)
            putBoolean("backgroundLocation", backgroundLocation)
            putBoolean("allGranted", fineLocation && coarseLocation && backgroundLocation)
        }

        promise.resolve(result)
    }

    @ReactMethod
    fun startLocationTracking(orderId: String?, driverId: String?, promise: Promise) {
        try {
            val serviceIntent = Intent(reactApplicationContext, LocationTrackingService::class.java).apply {
                action = "START_TRACKING"
                putExtra("orderId", orderId)
                putExtra("driverId", driverId)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(serviceIntent)
            } else {
                reactApplicationContext.startService(serviceIntent)
            }

            promise.resolve(true)
            Log.d(TAG, "Location tracking started for order: $orderId")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting location tracking", e)
            promise.reject("START_ERROR", "Failed to start location tracking: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopLocationTracking(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, LocationTrackingService::class.java).apply {
                action = "STOP_TRACKING"
            }
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
            Log.d(TAG, "Location tracking stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping location tracking", e)
            promise.reject("STOP_ERROR", "Failed to stop location tracking: ${e.message}", e)
        }
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        // Not used
    }

    override fun onNewIntent(intent: Intent?) {
        // Not used
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        // Unregister receivers
        locationReceiver?.let {
            LocalBroadcastManager.getInstance(reactApplicationContext).unregisterReceiver(it)
        }
        errorReceiver?.let {
            LocalBroadcastManager.getInstance(reactApplicationContext).unregisterReceiver(it)
        }
    }
}

