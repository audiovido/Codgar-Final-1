import SwiftUI
import AppKit
import AVFoundation

@main
struct CodgarStudioApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)

        // فعال‌سازی قطعی دریافت رویدادهای کیبورد برای پنجره اصلی
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            if let window = NSApp.windows.first {
                window.makeKeyAndOrderFront(nil)
                window.orderFrontRegardless()
            }
        }

        AVCaptureDevice.requestAccess(for: .audio) { granted in
            print("[Permissions] Microphone access: \(granted)")
        }

        let projectFolder = NSHomeDirectory() + "/Codgar-Final-1"
        BackendManager.shared.startBackend(workingDirectory: projectFolder)
    }

    func applicationWillTerminate(_ notification: Notification) {
        BackendManager.shared.stopBackend()
    }
}
