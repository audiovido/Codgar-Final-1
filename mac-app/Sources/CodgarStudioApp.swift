import SwiftUI
import AVFoundation

@main
struct CodgarStudioApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .windowStyle(.hiddenTitleBar)
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.activate(ignoringOtherApps: true)

        // درخواست دسترسی میکروفون سیستم‌عامل مک برای ویس
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
