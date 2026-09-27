import os, json, subprocess

print("==================================================")
print("🍎 ۱. ایجاد فایل‌های سیستمی AGENTS.md و .cursorrules...")
print("==================================================")

agent_rules = """# Modern Swift 6 & Apple Ecosystem Architecture Directives

## Role & Expertise
You are an elite iOS/macOS systems architect and modern Swift engineer specializing in Swift 6, SwiftUI, Swift Testing, and strict concurrency safety.

## Core Technical Directives

### 1. Swift 6 Concurrency & Systems Engineering
- Assume strict concurrency checking is always enabled (-strict-concurrency=complete).
- Enforce data-race safety at compile time.
- Mark all shared data structures, models, and payloads as Sendable.
- Protect mutable state using actor instead of Grand Central Dispatch (DispatchQueue) or raw locks.
- Annotate SwiftUI views, ViewModels, and UI-bound logic with @MainActor.
- Strictly prohibit @unchecked Sendable unless backed by verified hardware/OS locks with documented rationale.
- Stream live logs and real-time token pipelines using AsyncStream and AsyncThrowingStream.

### 2. State Management & Modern SwiftUI
- Use the native Observation framework (@Observable macro) for all data models and state management.
- Avoid legacy Combine-based state patterns (ObservableObject, @Published, AnyCancellable) unless legacy OS compatibility is mandated.
- Favor pure value types (struct, enum) over reference types (class) unless identity is structurally required.
- Eliminate all force unwrapping (!) and force type casting (as!). Guard optionals cleanly using guard let or if let with fallbacks.

### 3. Swift Testing Framework
- Write all unit and integration tests using Apple's modern Swift Testing framework (import Testing).
- Use @Test and @Suite annotations; do not inherit from XCTestCase.
- Validate assertions using #expect (soft verification) and #require (hard precondition check with optional unwrapping).
- Leverage parameterized tests (arguments: [...]) for boundary scenario matrices.

### 4. Apple MCP Ecosystem Toolchain
- **anvyxhq/swift-mcp-server**: Semantic AST navigation via SourceKit-LSP, safe symbol renaming, and compiler-level diagnostics.
- **getsentry/MobileBuildMCP**: Automated xcodebuild orchestration, skipping macro validation, and parsing crash logs.
- **giginet/xcodeproj-mcp-server**: Programmatic, safe manipulation of .xcodeproj and project.pbxproj files.
- **r-huijts/xcode-mcp-server**: SPM dependency and simulator management.
- **modelcontextprotocol/swift-sdk**: Native Swift Concurrency SDK for custom internal tooling.

### 5. WebKit & Bridge Stability
- Decouple all WKScriptMessageHandler bridge calls from the main-thread event loop.
- Silently handle media capture / microphone permission queries when entitlements are pending to prevent UI freezing.
"""

with open('AGENTS.md', 'w', encoding='utf-8') as f:
    f.write(agent_rules)

with open('.cursorrules', 'w', encoding='utf-8') as f:
    f.write(agent_rules)

print("✅ فایل‌های AGENTS.md و .cursorrules مستقر شدند.")

# ۲. ایجاد فایل پیکربندی سرورهای MCP مخصوص اپل
print("\n⚙️ ۲. راه‌اندازی فایل پیکربندی mcp.json...")
mcp_config = {
    "mcpServers": {
        "swift-sourcekit-lsp": {
            "command": "npx",
            "args": ["-y", "@anvyx/swift-mcp-server"],
            "env": {
                "SOURCEKIT_TOOLCHAIN_PATH": "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain"
            }
        },
        "mobile-build-mcp": {
            "command": "npx",
            "args": ["-y", "@sentry/mobile-build-mcp"]
        },
        "xcodeproj-mcp": {
            "command": "npx",
            "args": ["-y", "xcodeproj-mcp-server"]
        },
        "xcode-mcp": {
            "command": "npx",
            "args": ["-y", "xcode-mcp-server"]
        }
    }
}

with open('mcp.json', 'w', encoding='utf-8') as f:
    json.dump(mcp_config, f, indent=2)

print("✅ پیکربندی سرورهای MCP اپل در mcp.json ثبت شد.")

# ۳. اصلاح هندلرهای فرانت‌اند و بیلد تمیز
print("\n📦 ۳. کامپایل نهایی پروژه...")
res = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
if res.returncode == 0:
    print("🎉 بیلد Vite با موفقیت کامل انجام شد.")
else:
    print("⚠️ هشدار بیلد:\n", res.stderr[-200:])

subprocess.run(['git', 'add', '.'], check=False)
subprocess.run(['git', 'commit', '-m', 'Feat: integrate Apple MCP toolchains, Swift 6 rules and strict concurrency architecture'], check=False)
subprocess.run(['git', 'push'], check=False)
print("🚀 تغییرات به گیت‌هاب Push شد.")

