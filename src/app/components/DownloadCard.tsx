"use client";
import { useState, useRef } from "react";

const downloadOptions = [
  { label: "HTML Only", value: "html" },
  { label: "HTML + Assets", value: "assets" },
  { label: "Full Site", value: "full" },
];

export default function DownloadCard() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [option, setOption] = useState(downloadOptions[2].value);
  const [downloadLinked, setDownloadLinked] = useState(true);
  const [customHeader, setCustomHeader] = useState("");
  const [zipName, setZipName] = useState("website-download.zip");
  const [showNotification, setShowNotification] = useState(true);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState<number | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setLogs([]);
    setProgress(0);
    setSpeed(0);
    setEta(null);
    pausedRef.current = false;

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          option,
          downloadLinked,
          customHeader: customHeader || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(await response.text());

      // Stream the download and logs in real time
      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get("Content-Length") || 0);
      let receivedLength = 0;
      let chunks: Uint8Array[] = [];
      let lastTime = Date.now();
      let lastReceived = 0;
      let logsBuffer: string[] = [];

      if (reader) {
        while (true) {
          if (pausedRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          // Progress bar percentage
          setProgress(
            contentLength
              ? Math.min((receivedLength / contentLength) * 100, 100)
              : 0
          );

          // Speed & ETA
          const now = Date.now();
          const elapsed = (now - lastTime) / 1000;
          if (elapsed > 0.5) {
            const bytesThisInterval = receivedLength - lastReceived;
            setSpeed(bytesThisInterval / elapsed);
            if (contentLength) {
              const remaining = contentLength - receivedLength;
              setEta(remaining / (bytesThisInterval / elapsed));
            }
            lastTime = now;
            lastReceived = receivedLength;
          }

          // Simulate real-time logs (append a log every 2MB or on progress update)
          if (
            logsBuffer.length === 0 ||
            receivedLength - (logsBuffer.length * 2 * 1024 * 1024) > 2 * 1024 * 1024
          ) {
            logsBuffer.push(
              `Downloaded ${(receivedLength / 1024 / 1024).toFixed(2)} MB (${Math.round(
                (receivedLength / contentLength) * 100
              )}%)`
            );
            setLogs([...logsBuffer]);
          }
        }
      }

      // Finalize download
      const blob = new Blob(chunks);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = zipName || `website-${new URL(url).hostname}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setProgress(100);
      setLogs((prev) => [...prev, "Download complete!"]);
      setSuccess("Download complete!");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Download failed");
      setLogs((prev) => [
        ...prev,
        `Error: ${err instanceof Error ? err.message : "Download failed"}`,
      ]);
    } finally {
      setIsLoading(false);
      setSpeed(0);
      setEta(null);
      controllerRef.current = null;
    }
  };

  // Pause/Resume logic
  const handlePause = () => {
    setIsPaused(true);
    pausedRef.current = true;
  };
  const handleResume = () => {
    setIsPaused(false);
    pausedRef.current = false;
  };
  const handleCancel = () => {
    controllerRef.current?.abort();
    setIsPaused(false);
    pausedRef.current = false;
    setIsLoading(false);
    setProgress(0);
  };

  // Format speed
  const formatSpeed = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(2)} MB/s`
      : `${(bytes / 1024).toFixed(2)} KB/s`;

  // Format ETA
  const formatEta = (seconds: number) =>
    seconds > 60
      ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
      : `${Math.round(seconds)}s`;

  return (
    <div className="max-w-lg w-full mx-auto p-6 sm:p-10 bg-white/70 rounded-2xl shadow-2xl border border-gray-200 transition hover:shadow-3xl relative">
      {showNotification && (
        <div className="mb-4 flex items-center justify-between bg-blue-100 text-blue-800 px-4 py-2 rounded shadow">
          <span>
            Tip: Download the full site structure, all linked pages, and assets.
          </span>
          <button
            className="ml-4 text-blue-600 hover:text-blue-900 font-bold"
            onClick={() => setShowNotification(false)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <h1 className="text-3xl font-extrabold mb-4 text-gray-900 tracking-tight flex items-center gap-2">
        <span role="img" aria-label="download">
          ⬇️
        </span>
        Website Downloader
      </h1>

      <form
        onSubmit={handleDownload}
        className="space-y-4"
        aria-label="Download form"
      >
        <div>
          <label
            className="block mb-2 text-gray-700 font-medium"
            htmlFor="url-input"
          >
            Enter Website URL
          </label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            aria-invalid={!isValidUrl(url)}
            className={`w-full p-3 rounded-xl border ${
              isValidUrl(url) ? "border-gray-300" : "border-red-400"
            } bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
          />
        </div>

        {/* Download options */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">
            Download Options
          </label>
          <select
            value={option}
            onChange={(e) => setOption(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-900"
            aria-label="Select download option"
          >
            {downloadOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Download all linked pages */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="download-linked"
            checked={downloadLinked}
            onChange={(e) => setDownloadLinked(e.target.checked)}
          />
          <label htmlFor="download-linked" className="text-gray-700">
            Download all pages linked from main page
          </label>
        </div>

        <input
          type="text"
          placeholder="Custom Header (e.g. Cookie: ...)"
          value={customHeader}
          onChange={(e) => setCustomHeader(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-900"
        />

        {/* Custom ZIP name */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">
            ZIP File Name
          </label>
          <input
            type="text"
            value={zipName}
            onChange={(e) => setZipName(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-900"
            placeholder="website-download.zip"
            aria-label="Custom ZIP file name"
          />
        </div>

        {/* Download button and pause/resume/cancel */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !isValidUrl(url)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Download as ZIP"
          >
            <svg
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {isLoading ? "Downloading..." : "Download as ZIP"}
          </button>
          {isLoading && (
            <>
              {!isPaused ? (
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-yellow-100 text-yellow-800 font-semibold shadow hover:bg-yellow-200 transition flex items-center justify-center"
                  onClick={handlePause}
                  aria-label="Pause"
                >
                  {/* Pause Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect
                      x="6"
                      y="5"
                      width="4"
                      height="14"
                      rx="1"
                      fill="currentColor"
                    />
                    <rect
                      x="14"
                      y="5"
                      width="4"
                      height="14"
                      rx="1"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-green-100 text-green-800 font-semibold shadow hover:bg-green-200 transition flex items-center justify-center"
                  onClick={handleResume}
                  aria-label="Resume"
                >
                  {/* Play Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="px-3 py-2 rounded-xl bg-red-100 text-red-800 font-semibold shadow hover:bg-red-200 transition flex items-center justify-center"
                onClick={handleCancel}
                aria-label="Cancel"
              >
                {/* X (Cancel) Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <line
                    x1="6"
                    y1="6"
                    x2="18"
                    y2="18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="6"
                    y1="18"
                    x2="18"
                    y2="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Progress bar, speed, ETA */}
        {isLoading && (
          <div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{progress.toFixed(1)}%</span>
              {speed > 0 && (
                <span>
                  {formatSpeed(speed)}
                  {eta && ` • ETA: ${formatEta(eta)}`}
                </span>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Log display at the bottom */}
      <div className="mt-6 border rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-2 font-mono text-sm">
          <div className="font-bold mb-1 flex items-center gap-1 text-gray-700">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2l4-4"
              />
            </svg>
            Download Logs:
          </div>
          <div
            id="log-container"
            className="h-32 overflow-y-auto bg-black text-green-400 p-2 rounded font-mono text-xs"
            aria-live="polite"
          >
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="mb-1 flex items-center gap-1">
                  <span className="text-gray-400">»</span> {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                {isLoading ? "Starting download..." : "Logs will appear here"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error & success messages */}
      {error && (
        <div
          className="mt-4 p-3 bg-red-100 text-red-700 rounded flex items-center gap-2 animate-fade-in"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Error: {error}
        </div>
      )}
      {success && (
        <div
          className="mt-4 p-3 bg-green-100 text-green-700 rounded flex items-center gap-2 animate-fade-in"
          role="status"
        >
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2l4-4"
            />
          </svg>
          {success}
        </div>
      )}
    </div>
  );
}