"use client";

import { useState } from "react";
import ProgressBar from "./ProgressBar";
import { signIn } from "next-auth/react"; 

export default function DownloadCard() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setProgress(0);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get("Content-Length") || 0);
      let receivedLength = 0;
      let chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // Handle cases where contentLength is 0 or invalid
          const calculatedProgress =
            contentLength > 0 ? (receivedLength / contentLength) * 100 : 0; // Fallback to 0 if we can't calculate properly

          setProgress(Math.min(calculatedProgress, 100)); // Never exceed 100%
        }
      }

      const blob = new Blob(chunks);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `website-source-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess("Download completed successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download website"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative max-w-md mx-auto bg-white/70 dark:bg-gray-900/60 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 pt-16 backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-3xl"
      style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
    >
      <h2 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
        Download Website
      </h2>

      <form onSubmit={handleDownload} className="space-y-6">
        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300 font-medium">
            Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/70 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        <button
          type="button"
          onClick={() => signIn("github")}
          className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-gray-600 bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold shadow hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          Sign in with GitHub
        </button>
        {isLoading && <ProgressBar value={progress} />}
        <div className="min-h-[24px]">
          {error && <div className="text-red-500 animate-fade-in">{error}</div>}
          {success && (
            <div className="text-green-500 animate-fade-in">{success}</div>
          )}
        </div>
      </form>
      
    </div>
  );
}
