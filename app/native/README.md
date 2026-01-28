# Meta Wearables Native Module Setup

This guide explains how to set up the native Meta Wearables SDK integration.

## Prerequisites

1. Register as a Meta Wearables developer at https://developers.meta.com/wearables/
2. Create an app in the developer portal
3. Download the SDK packages

## iOS Setup

### 1. Add CocoaPods Dependency

Add to your `ios/Podfile`:

```ruby
pod 'MetaWearablesSDK', :git => 'https://github.com/facebook/meta-wearables-dat-ios.git'
```

### 2. Create Native Module Bridge

Create `ios/MetaGlassesModule.swift`:

```swift
import Foundation
import MetaWearablesSDK

@objc(MetaGlassesModule)
class MetaGlassesModule: RCTEventEmitter {

    private var session: WearablesSession?

    override func supportedEvents() -> [String]! {
        return [
            "onConnectionStatusChanged",
            "onDeviceConnected",
            "onDeviceDisconnected",
            "onBatteryLevelChanged",
            "onVoiceTrigger",
            "onError"
        ]
    }

    @objc func searchForDevices(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        WearablesManager.shared.scanForDevices { devices in
            let deviceList = devices.map { device in
                [
                    "id": device.identifier,
                    "name": device.name,
                    "model": self.mapModel(device.model),
                    "batteryLevel": device.batteryLevel
                ]
            }
            resolve(deviceList)
        }
    }

    @objc func connect(_ deviceId: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        WearablesManager.shared.connect(to: deviceId) { result in
            switch result {
            case .success(let session):
                self.session = session
                self.sendEvent(withName: "onDeviceConnected", body: [
                    "id": deviceId,
                    "name": session.deviceName
                ])
                resolve(true)
            case .failure(let error):
                reject("CONNECT_ERROR", error.localizedDescription, error)
            }
        }
    }

    @objc func capturePhoto(_ options: NSDictionary,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let session = session else {
            reject("NO_SESSION", "No active session", nil)
            return
        }

        session.capturePhoto(format: .jpeg) { result in
            switch result {
            case .success(let imageData):
                let base64 = imageData.base64EncodedString()
                resolve("data:image/jpeg;base64,\(base64)")
            case .failure(let error):
                reject("CAPTURE_ERROR", error.localizedDescription, error)
            }
        }
    }

    private func mapModel(_ model: WearablesDeviceModel) -> String {
        switch model {
        case .rayBanMetaGen1: return "rayban-meta-gen1"
        case .rayBanMetaGen2: return "rayban-meta-gen2"
        case .oakleyHSTN: return "oakley-hstn"
        default: return "unknown"
        }
    }
}
```

### 3. Create Objective-C Bridge

Create `ios/MetaGlassesModule.m`:

```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(MetaGlassesModule, RCTEventEmitter)

RCT_EXTERN_METHOD(searchForDevices:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(connect:(NSString *)deviceId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnect:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(capturePhoto:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(enableVoiceTrigger:(NSArray *)phrases
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disableVoiceTrigger:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getBatteryLevel:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

## Android Setup

### 1. Add Gradle Dependency

Add to your `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.meta.wearables:device-access-toolkit:0.3.0'
}
```

### 2. Create Native Module

Create `android/app/src/main/java/com/dutysnap/MetaGlassesModule.kt`:

```kotlin
package com.dutysnap

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.meta.wearables.sdk.*

class MetaGlassesModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var session: WearablesSession? = null

    override fun getName() = "MetaGlassesModule"

    @ReactMethod
    fun searchForDevices(promise: Promise) {
        WearablesManager.getInstance().scanForDevices { devices ->
            val deviceArray = Arguments.createArray()
            devices.forEach { device ->
                val deviceMap = Arguments.createMap().apply {
                    putString("id", device.id)
                    putString("name", device.name)
                    putString("model", mapModel(device.model))
                    putInt("batteryLevel", device.batteryLevel)
                }
                deviceArray.pushMap(deviceMap)
            }
            promise.resolve(deviceArray)
        }
    }

    @ReactMethod
    fun connect(deviceId: String, promise: Promise) {
        WearablesManager.getInstance().connect(deviceId) { result ->
            when (result) {
                is Result.Success -> {
                    session = result.value
                    sendEvent("onDeviceConnected", Arguments.createMap().apply {
                        putString("id", deviceId)
                    })
                    promise.resolve(true)
                }
                is Result.Failure -> {
                    promise.reject("CONNECT_ERROR", result.error.message)
                }
            }
        }
    }

    @ReactMethod
    fun capturePhoto(options: ReadableMap, promise: Promise) {
        val session = this.session
        if (session == null) {
            promise.reject("NO_SESSION", "No active session")
            return
        }

        session.capturePhoto(PhotoFormat.JPEG) { result ->
            when (result) {
                is Result.Success -> {
                    val base64 = android.util.Base64.encodeToString(
                        result.value,
                        android.util.Base64.NO_WRAP
                    )
                    promise.resolve("data:image/jpeg;base64,$base64")
                }
                is Result.Failure -> {
                    promise.reject("CAPTURE_ERROR", result.error.message)
                }
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun mapModel(model: WearablesDeviceModel): String {
        return when (model) {
            WearablesDeviceModel.RAY_BAN_META_GEN1 -> "rayban-meta-gen1"
            WearablesDeviceModel.RAY_BAN_META_GEN2 -> "rayban-meta-gen2"
            WearablesDeviceModel.OAKLEY_HSTN -> "oakley-hstn"
            else -> "unknown"
        }
    }
}
```

### 3. Register the Module

Create `android/app/src/main/java/com/dutysnap/MetaGlassesPackage.kt`:

```kotlin
package com.dutysnap

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class MetaGlassesPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(MetaGlassesModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

Add to `MainApplication.java`:

```java
packages.add(new MetaGlassesPackage());
```

## Testing Without Hardware

The app includes mock mode that activates when:
1. No native module is available (dev builds without SDK)
2. Or when connecting to the "Mock" device

Mock mode allows testing the full UI flow without real glasses.

## Permissions

### iOS (Info.plist)
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>DutySnap uses Bluetooth to connect to your Ray-Ban Meta glasses.</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>DutySnap uses Bluetooth to connect to your Ray-Ban Meta glasses.</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
```
