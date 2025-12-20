package com.shivdhabacustomer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.location.Location
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.google.android.gms.location.*
import com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY

class LocationTrackingService : Service() {
    private val binder = LocalBinder()
    private var fusedLocationClient: FusedLocationProviderClient? = null
    private var locationCallback: LocationCallback? = null
    private var currentOrderId: String? = null
    private var driverId: String? = null
    
    companion object {
        private const val TAG = "LocationTrackingService"
        private const val CHANNEL_ID = "location_tracking_channel"
        private const val NOTIFICATION_ID = 1001
        private const val LOCATION_UPDATE_INTERVAL = 10000L // 10 seconds
        private const val FASTEST_UPDATE_INTERVAL = 5000L // 5 seconds
        private const val MIN_DISPLACEMENT = 10f // 10 meters
    }

    inner class LocalBinder : Binder() {
        fun getService(): LocationTrackingService = this@LocationTrackingService
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        Log.d(TAG, "LocationTrackingService created")
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "START_TRACKING" -> {
                currentOrderId = intent.getStringExtra("orderId")
                driverId = intent.getStringExtra("driverId")
                startLocationUpdates()
            }
            "STOP_TRACKING" -> {
                stopLocationUpdates()
                stopForeground(true)
                stopSelf()
            }
        }
        return START_STICKY
    }

    fun startTracking(orderId: String?, driverId: String?) {
        this.currentOrderId = orderId
        this.driverId = driverId
        startLocationUpdates()
    }

    fun stopTracking() {
        stopLocationUpdates()
        currentOrderId = null
        driverId = null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks delivery location"
                setShowBadge(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun getNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Sharing Location")
            .setContentText("Your location is being shared with customers")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(PRIORITY_HIGH_ACCURACY, LOCATION_UPDATE_INTERVAL)
            .setMinUpdateIntervalMillis(FASTEST_UPDATE_INTERVAL)
            .setMinUpdateDistanceMeters(MIN_DISPLACEMENT)
            .setMaxUpdateDelayMillis(LOCATION_UPDATE_INTERVAL * 2)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    handleLocationUpdate(location)
                }
            }
        }

        try {
            fusedLocationClient?.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
            startForeground(NOTIFICATION_ID, getNotification())
            Log.d(TAG, "Location updates started")
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission not granted", e)
            sendLocationError("Location permission not granted")
        }
    }

    private fun stopLocationUpdates() {
        locationCallback?.let {
            fusedLocationClient?.removeLocationUpdates(it)
            locationCallback = null
            Log.d(TAG, "Location updates stopped")
        }
    }

    private fun handleLocationUpdate(location: Location) {
        // Send location update via broadcast
        val intent = Intent("LOCATION_UPDATE").apply {
            putExtra("latitude", location.latitude)
            putExtra("longitude", location.longitude)
            putExtra("accuracy", location.accuracy)
            putExtra("speed", location.speed * 3.6) // Convert m/s to km/h
            putExtra("heading", location.bearing.toDouble())
            putExtra("timestamp", location.time)
            currentOrderId?.let { putExtra("orderId", it) }
            driverId?.let { putExtra("driverId", it) }
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
        Log.d(TAG, "Location updated: ${location.latitude}, ${location.longitude}")
    }

    private fun sendLocationError(error: String) {
        val intent = Intent("LOCATION_ERROR").apply {
            putExtra("error", error)
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        Log.d(TAG, "LocationTrackingService destroyed")
    }
}

