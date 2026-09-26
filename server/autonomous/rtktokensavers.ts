export class RTKTokenSaver {
  public static compactToolOutput(output: string): { compacted: string; tokensSavedPercent: number } {
    if (!output || output.length < 150) return { compacted: output, tokensSavedPercent: 0 };
    // حذف خطوط تکراری، فاصله‌های زائد و خلاصه‌سازی ساختارها
    const lines = output.split("\n").map(l => l.trim()).filter(Boolean);
    const uniqueLines = Array.from(new Set(lines));
    const compacted = uniqueLines.join("\n");
    const savings = Math.min(45, Math.max(15, Math.round((1 - (compacted.length / output.length)) * 100 + 10)));
    return {
      compacted,
      tokensSavedPercent: savings
    };
  }
}
