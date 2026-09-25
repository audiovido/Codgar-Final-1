import Foundation

final class BackendManager {
    static let shared = BackendManager()
    private var process: Process?

    private init() {}

    func startBackend(workingDirectory: String) {
        guard process == nil else { return }

        let p = Process()
        p.currentDirectoryURL = URL(fileURLWithPath: workingDirectory)
        p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        p.arguments = ["npm", "run", "dev"]

        var env = ProcessInfo.processInfo.environment
        env["HOST"] = "127.0.0.1"
        env["PORT"] = "3000"
        p.environment = env

        do {
            try p.run()
            self.process = p
            print("[BackendManager] Backend running on 127.0.0.1:3000")
        } catch {
            print("[BackendManager] Error: \(error.localizedDescription)")
        }
    }

    func stopBackend() {
        guard let p = process, p.isRunning else { return }
        p.terminate()
        p.waitUntilExit()
        process = nil
    }
}
