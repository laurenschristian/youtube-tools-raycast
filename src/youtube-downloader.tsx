import { ActionPanel, Action, Form, showToast, Toast, closeMainWindow, PopToRootType, Clipboard } from "@raycast/api";
import { useState, useEffect, useRef } from "react";
import { execa } from "execa";
import path from "path";
import os from "os";

// Function to find the path of a command
const findCommandPath = async (command: string): Promise<string | null> => {
  try {
    // Try 'which' first - if it succeeds, the command itself is the path (it's in PATH)
    // and execa will find it.
    await execa("which", [command]);
    return command; // Return the command name itself, execa will resolve it via PATH
  } catch {
    // 'which' failed, try known Homebrew paths
    const knownPaths: string[] = [];
    if (os.arch() === "arm64") {
      knownPaths.push(`/opt/homebrew/bin/${command}`);
    }
    knownPaths.push(`/usr/local/bin/${command}`);

    for (const p of knownPaths) {
      try {
        const testArgs = command === "ffmpeg" ? ["-version"] : ["--version"];
        await execa(p, testArgs);
        return p; // Return the full path
      } catch {
        // Continue to next path
      }
    }
    return null; // Not found
  }
};

export default function Command() {
  const [url, setUrl] = useState("");
  const [downloadType, setDownloadType] = useState("mp4_video_audio");
  const [videoQuality, setVideoQuality] = useState("best");
  const [mp3Quality, setMp3Quality] = useState("5");
  const [compressionLevel, setCompressionLevel] = useState("none");
  const [compressionCrf, setCompressionCrf] = useState("23");
  const [outputPath, setOutputPath] = useState(path.join(os.homedir(), "Downloads"));
  const [estimatedSize, setEstimatedSize] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<{
    duration?: number;
    title?: string;
    filesize?: number;
  } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [urlError, setUrlError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [ytDlpPath, setYtDlpPath] = useState<string | null>(null);
  const [ffmpegPath, setFfmpegPath] = useState<string | null>(null);
  const activeProcessRef = useRef<ReturnType<typeof execa> | null>(null);

  const downloadsPath = path.join(os.homedir(), "Downloads");

  // Regex for basic YouTube URL validation (used for clipboard check)
  const basicYoutubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i;

  // Preset configurations
  const presets = {
    "high-quality": {
      name: "🎬 High Quality",
      description: "4K/2K with light compression - Best for viewing",
      downloadType: "mp4_video_audio",
      videoQuality: "best",
      compressionLevel: "light",
      compressionCrf: "20",
      mp3Quality: "0",
    },
    "mobile-friendly": {
      name: "📱 Mobile Friendly",
      description: "720p with high compression - Great for phones",
      downloadType: "mp4_video_audio",
      videoQuality: "720p",
      compressionLevel: "high",
      compressionCrf: "28",
      mp3Quality: "5",
    },
    "storage-saver": {
      name: "💾 Storage Saver",
      description: "480p with maximum compression - Minimal space",
      downloadType: "mp4_video_audio",
      videoQuality: "480p",
      compressionLevel: "high",
      compressionCrf: "30",
      mp3Quality: "5",
    },
    "audio-only": {
      name: "🎵 Audio Only",
      description: "High quality MP3 - Just the sound",
      downloadType: "mp3_audio",
      videoQuality: "best",
      compressionLevel: "none",
      compressionCrf: "23",
      mp3Quality: "0",
    },
    balanced: {
      name: "⚖️ Balanced",
      description: "1080p with medium compression - Good all-around",
      downloadType: "mp4_video_audio",
      videoQuality: "1080p",
      compressionLevel: "medium",
      compressionCrf: "23",
      mp3Quality: "2",
    },
    custom: {
      name: "🔧 Custom",
      description: "Manual settings",
      downloadType: "mp4_video_audio",
      videoQuality: "best",
      compressionLevel: "none",
      compressionCrf: "23",
      mp3Quality: "5",
    },
  };

  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      const [foundYtDlpPath, foundFfmpegPath, clipboardText] = await Promise.all([
        findCommandPath("yt-dlp"),
        findCommandPath("ffmpeg"),
        Clipboard.readText(),
      ]);

      setYtDlpPath(foundYtDlpPath);
      setFfmpegPath(foundFfmpegPath);

      if (clipboardText && basicYoutubeRegex.test(clipboardText)) {
        // Further validation will happen onBlur or onSubmit, but this pre-fills.
        setUrl(clipboardText.trim());
      }

      if (!foundYtDlpPath) {
        await showToast(
          Toast.Style.Failure,
          "yt-dlp Not Found",
          "Please install yt-dlp (e.g., brew install yt-dlp) and ensure it's in your PATH or standard Homebrew locations.",
        );
      }
      if (!foundFfmpegPath) {
        await showToast(
          Toast.Style.Failure,
          "FFmpeg Not Found",
          "Please install ffmpeg (e.g., brew install ffmpeg) and ensure it's in your PATH or standard Homebrew locations.",
        );
      }
      setIsLoading(false);
    }
    initialize();
  }, []);

  // Update file size estimation when relevant parameters change
  useEffect(() => {
    if (url && ytDlpPath && validateUrl(url)) {
      getVideoInfoAndEstimate(url);
    }
  }, [url, downloadType, videoQuality, compressionLevel, compressionCrf, mp3Quality, ytDlpPath]);

  // Apply preset configuration
  const applyPreset = (presetKey: string) => {
    if (presetKey === "custom") {
      setSelectedPreset("custom");
      return;
    }

    const preset = presets[presetKey as keyof typeof presets];
    if (preset) {
      setSelectedPreset(presetKey);
      setDownloadType(preset.downloadType);
      setVideoQuality(preset.videoQuality);
      setCompressionLevel(preset.compressionLevel);
      setCompressionCrf(preset.compressionCrf);
      setMp3Quality(preset.mp3Quality);
    }
  };

  // Detect if current settings match a preset
  useEffect(() => {
    const currentSettings = {
      downloadType,
      videoQuality,
      compressionLevel,
      compressionCrf,
      mp3Quality,
    };

    for (const [key, preset] of Object.entries(presets)) {
      if (key === "custom") continue;

      if (
        preset.downloadType === currentSettings.downloadType &&
        preset.videoQuality === currentSettings.videoQuality &&
        preset.compressionLevel === currentSettings.compressionLevel &&
        preset.compressionCrf === currentSettings.compressionCrf &&
        preset.mp3Quality === currentSettings.mp3Quality
      ) {
        setSelectedPreset(key);
        return;
      }
    }
    setSelectedPreset("custom");
  }, [downloadType, videoQuality, compressionLevel, compressionCrf, mp3Quality]);

  const validateUrl = (value: string): boolean => {
    if (!value) {
      setUrlError("URL cannot be empty. Please enter a YouTube video URL.");
      return false;
    }
    // Stricter regex for form validation
    const strictYoutubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+(\S+)?$/;
    if (!strictYoutubeRegex.test(value)) {
      setUrlError("Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...).");
      return false;
    }
    setUrlError(undefined);
    return true;
  };

  // Function to get video info and estimate file size
  const getVideoInfoAndEstimate = async (videoUrl: string) => {
    if (!ytDlpPath || !videoUrl || !validateUrl(videoUrl)) {
      setVideoInfo(null);
      setEstimatedSize("");
      return;
    }

    try {
      const infoArgs = [videoUrl, "--dump-json", "--no-playlist"];
      const result = await execa(ytDlpPath, infoArgs, { timeout: 30000 });
      const info = JSON.parse(result.stdout);
      setVideoInfo(info);

      // Calculate estimated file size
      const duration = info.duration || 0; // in seconds
      let estimatedMB = 0;

      if (downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") {
        // Video bitrate estimation based on quality
        let videoBitrate = 0; // kbps
        if (videoQuality === "best" || videoQuality === "2160p") {
          videoBitrate = 8000; // 4K typically ~8Mbps
        } else if (videoQuality === "1440p") {
          videoBitrate = 4000; // 2K typically ~4Mbps
        } else if (videoQuality === "1080p") {
          videoBitrate = 2000; // 1080p typically ~2Mbps
        } else if (videoQuality === "720p") {
          videoBitrate = 1000; // 720p typically ~1Mbps
        } else if (videoQuality === "480p") {
          videoBitrate = 500; // 480p typically ~500kbps
        }

        // Apply compression factor
        if (compressionLevel !== "none") {
          let compressionFactor = 1;
          switch (compressionLevel) {
            case "light":
              compressionFactor = 0.8; // 20% reduction
              break;
            case "medium":
              compressionFactor = 0.6; // 40% reduction
              break;
            case "high":
              compressionFactor = 0.4; // 60% reduction
              break;
            case "custom": {
              const crf = parseInt(compressionCrf);
              // CRF to compression factor approximation
              compressionFactor = Math.max(0.3, 1 - (crf - 18) * 0.04);
              break;
            }
          }
          videoBitrate *= compressionFactor;
        }

        estimatedMB = (videoBitrate * duration) / (8 * 1024); // Convert kbps to MB

        // Add audio size for video+audio
        if (downloadType === "mp4_video_audio") {
          const audioBitrate = compressionLevel !== "none" ? 128 : 256; // kbps
          estimatedMB += (audioBitrate * duration) / (8 * 1024);
        }
      } else if (downloadType === "mp3_audio") {
        // MP3 audio estimation
        let audioBitrate = 128; // default
        switch (mp3Quality) {
          case "0":
            audioBitrate = 245;
            break;
          case "2":
            audioBitrate = 190;
            break;
          case "5":
            audioBitrate = 130;
            break;
          case "320K":
            audioBitrate = 320;
            break;
        }
        estimatedMB = (audioBitrate * duration) / (8 * 1024);
      } else if (downloadType === "m4a_audio") {
        // M4A typically ~256kbps
        estimatedMB = (256 * duration) / (8 * 1024);
      }

      // Format the estimated size
      if (estimatedMB < 1) {
        setEstimatedSize(`~${Math.round(estimatedMB * 1024)} KB`);
      } else if (estimatedMB < 1024) {
        setEstimatedSize(`~${Math.round(estimatedMB)} MB`);
      } else {
        setEstimatedSize(`~${(estimatedMB / 1024).toFixed(1)} GB`);
      }
    } catch (error) {
      console.error("Error getting video info:", error);
      setVideoInfo(null);
      setEstimatedSize("");
    }
  };

  let fullOutput = "";
  const progressRegex = /\[download\]\s+(?<percentage>\d+\.\d+)%/;
  const sizeRegex = /\[download\]\s+(?<downloaded>[\d.]+\w+)\s+of\s+(?<total>[\d.]+\w+)\s+at\s+(?<speed>[\d.]+\w+\/s)/;
  let toast: Toast;

  const parseSize = (sizeStr: string): number => {
    const match = sizeStr.match(/([\d.]+)(\w+)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "kb":
      case "kib":
        return value / 1024;
      case "mb":
      case "mib":
        return value;
      case "gb":
      case "gib":
        return value * 1024;
      default:
        return value / 1024 / 1024; // assume bytes
    }
  };

  const parseSpeed = (speedStr: string): number => {
    const match = speedStr.match(/([\d.]+)(\w+)\/s/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "kb":
      case "kib":
        return value / 1024;
      case "mb":
      case "mib":
        return value;
      case "gb":
      case "gib":
        return value * 1024;
      default:
        return value / 1024 / 1024; // assume bytes
    }
  };

  const streamOutput = (chunk: Buffer | string) => {
    const data = chunk.toString();
    fullOutput += data;

    const progressMatch = progressRegex.exec(data);
    const sizeMatch = sizeRegex.exec(data);

    if (progressMatch && progressMatch.groups?.percentage) {
      const percentage = parseFloat(progressMatch.groups.percentage);

      // Extract size and speed information if available
      let downloadedMB = 0;
      let totalMB = 0;
      let speedMBps = 0;
      let etaSeconds = 0;

      if (sizeMatch && sizeMatch.groups) {
        downloadedMB = parseSize(sizeMatch.groups.downloaded);
        totalMB = parseSize(sizeMatch.groups.total);
        speedMBps = parseSpeed(sizeMatch.groups.speed);

        // Calculate ETA
        const remainingMB = totalMB - downloadedMB;
        etaSeconds = speedMBps > 0 ? remainingMB / speedMBps : 0;
      }

      // Update progress state
      if (toast) {
        let progressMsg = `Downloading... ${percentage.toFixed(1)}%`;

        if (speedMBps > 0) {
          progressMsg += ` | ${speedMBps.toFixed(1)} MB/s`;
        }

        if (etaSeconds > 0 && etaSeconds < 3600) {
          // Only show ETA if less than 1 hour
          const minutes = Math.floor(etaSeconds / 60);
          const seconds = Math.floor(etaSeconds % 60);
          progressMsg += ` | ETA ${minutes}:${seconds.toString().padStart(2, "0")}`;
        }

        if (downloadedMB > 0 && totalMB > 0) {
          progressMsg += ` | ${downloadedMB.toFixed(1)}/${totalMB.toFixed(1)} MB`;
        }

        toast.message = progressMsg;
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) return;
    if (!ytDlpPath || !ffmpegPath) {
      await showToast(Toast.Style.Failure, "Missing Dependencies", "yt-dlp or ffmpeg not found.");
      return;
    }

    setIsLoading(true);
    fullOutput = ""; // Reset for each submission

    // Function to handle cancellation
    const cancelDownload = () => {
      if (activeProcessRef.current) {
        activeProcessRef.current.kill(); // Use kill instead of cancel
        // Toast update for cancellation is handled in the main catch block via error.isCanceled
      }
    };

    toast = await showToast({
      style: Toast.Style.Animated,
      title: "Starting Download...",
      message: `Preparing to download ${url}`,
      primaryAction: {
        title: "Cancel Download",
        onAction: cancelDownload,
      },
    });

    try {
      const args = [];
      const outputTemplate = path.join(outputPath, "%(title)s.%(ext)s");
      let finalExtension = "";

      if (downloadType === "mp4_video_audio") {
        finalExtension = "mp4";
        let formatString;
        if (videoQuality !== "best") {
          const height = videoQuality.replace("p", "");
          // More flexible format selection with multiple fallbacks
          formatString = [
            `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]`,
            `bestvideo[height<=${height}][ext=mp4]+bestaudio`,
            `bestvideo[height<=${height}]+bestaudio[ext=m4a]`,
            `bestvideo[height<=${height}]+bestaudio`,
            `best[height<=${height}][ext=mp4]`,
            `best[height<=${height}]`,
            `best[ext=mp4]`,
            `best`,
          ].join("/");
        } else {
          // More flexible format selection for best quality
          formatString = [
            `bestvideo[ext=mp4]+bestaudio[ext=m4a]`,
            `bestvideo[ext=mp4]+bestaudio`,
            `bestvideo+bestaudio[ext=m4a]`,
            `bestvideo+bestaudio`,
            `best[ext=mp4]`,
            `best`,
          ].join("/");
        }
        args.push("-f", formatString);
        // Always try to merge to mp4 if possible
        args.push("--merge-output-format", "mp4");
        if (ffmpegPath && ffmpegPath !== "ffmpeg") {
          args.push("--ffmpeg-location", ffmpegPath);
        }

        // Add compression settings for video+audio
        if (compressionLevel !== "none") {
          let crfValue = "23"; // default
          switch (compressionLevel) {
            case "light":
              crfValue = "20";
              break;
            case "medium":
              crfValue = "23";
              break;
            case "high":
              crfValue = "28";
              break;
            case "custom":
              crfValue = compressionCrf;
              break;
          }
          args.push("--postprocessor-args", `ffmpeg:-c:v libx264 -crf ${crfValue} -c:a aac -b:a 128k`);
        }
      } else if (downloadType === "mp4_video_only") {
        finalExtension = "mp4";
        let formatString;
        if (videoQuality !== "best") {
          const height = videoQuality.replace("p", "");
          formatString = [
            `bestvideo[height<=${height}][ext=mp4]`,
            `bestvideo[height<=${height}]`,
            `best[height<=${height}][ext=mp4]`,
            `best[height<=${height}]`,
          ].join("/");
        } else {
          formatString = [`bestvideo[ext=mp4]`, `bestvideo`, `best[ext=mp4]`, `best`].join("/");
        }
        args.push("-f", formatString);
        args.push("--merge-output-format", "mp4");
        if (ffmpegPath && ffmpegPath !== "ffmpeg") {
          args.push("--ffmpeg-location", ffmpegPath);
        }

        // Add compression settings for video only
        if (compressionLevel !== "none") {
          let crfValue = "23"; // default
          switch (compressionLevel) {
            case "light":
              crfValue = "20";
              break;
            case "medium":
              crfValue = "23";
              break;
            case "high":
              crfValue = "28";
              break;
            case "custom":
              crfValue = compressionCrf;
              break;
          }
          args.push("--postprocessor-args", `ffmpeg:-c:v libx264 -crf ${crfValue}`);
        }
      } else if (downloadType === "mp3_audio") {
        finalExtension = "mp3";
        args.push("-x", "--audio-format", "mp3", "--audio-quality", mp3Quality);
        if (ffmpegPath && ffmpegPath !== "ffmpeg") args.push("--ffmpeg-location", ffmpegPath);
      } else if (downloadType === "m4a_audio") {
        finalExtension = "m4a";
        args.push("-x", "--audio-format", "m4a");
        if (ffmpegPath && ffmpegPath !== "ffmpeg") args.push("--ffmpeg-location", ffmpegPath);
      }

      args.push(url, "-o", outputTemplate, "--no-playlist", "--progress");

      // Add additional arguments to handle YouTube's recent changes
      args.push("--extractor-retries", "3");
      args.push("--fragment-retries", "3");
      args.push("--retry-sleep", "1");
      // Use different clients to avoid nsig issues
      args.push("--extractor-args", "youtube:player_client=android,web");

      activeProcessRef.current = execa(ytDlpPath, args, { timeout: 900000 });
      activeProcessRef.current.stdout?.on("data", streamOutput);
      activeProcessRef.current.stderr?.on("data", streamOutput);

      await activeProcessRef.current;
      activeProcessRef.current = null; // Clear after successful completion

      toast.style = Toast.Style.Success;
      toast.title = "Download Complete!";
      let downloadedFileName = "your file";
      const destMatch = fullOutput.match(/\[(?:download|ExtractAudio)\] Destination: (.*)/i);
      if (destMatch && destMatch[1]) {
        downloadedFileName = path.basename(destMatch[1].trim());
      } else {
        const titleMatch = fullOutput.match(/\[info\] (.*?)\[/s);
        if (titleMatch && titleMatch[1]) {
          downloadedFileName = titleMatch[1].trim().split("\n")[0] + "." + finalExtension;
        } else {
          downloadedFileName = "Downloaded_File." + finalExtension;
        }
      }
      toast.message = `${downloadedFileName} saved to ${path.basename(outputPath)}.`;
      toast.primaryAction = undefined; // Remove cancel action on success

      await new Promise((resolve) => setTimeout(resolve, 300));
      await closeMainWindow({ popToRootType: PopToRootType.Immediate });
    } catch (error: unknown) {
      const err = error as {
        isCanceled?: boolean;
        code?: string;
        command?: string;
        isTimeout?: boolean;
        durationMs?: number;
        stderr?: string;
        stdout?: string;
        shortMessage?: string;
        message?: string;
      };
      if (!err.isCanceled) {
        // Don't log an error if it was a user cancellation
        console.error("Download error:", error);
      }
      activeProcessRef.current = null; // Clear on error/cancellation
      if (toast) {
        toast.style = err.isCanceled ? Toast.Style.Success : Toast.Style.Failure; // Or .Default for cancelled
        toast.title = err.isCanceled ? "Download Cancelled" : "Download Failed";
        let userMessage = "Failed to download video.";
        let errorDetailsForClipboard = `Error: ${err.message || "Unknown error"}`;
        if (fullOutput && !err.isCanceled) {
          // Don't include full output for cancellation message
          errorDetailsForClipboard += `\n\nOutput:\n${fullOutput}`;
        }

        if (err.isCanceled) {
          userMessage = "Download was cancelled by the user.";
          errorDetailsForClipboard = userMessage;
        } else if (err.code === "ENOENT") {
          userMessage = `Failed to execute ${err.command?.split(" ")[0]}. Path: ${ytDlpPath}`;
          errorDetailsForClipboard = `ENOENT: Command not found. Tried to run '${err.command?.split(" ")[0]}' at path '${ytDlpPath}'. Ensure it is correctly installed and accessible.`;
        } else if (err.isTimeout) {
          userMessage = "Download timed out.";
          errorDetailsForClipboard = `Timeout: The command '${err.command}' timed out after ${err.durationMs}ms.`;
        } else if (fullOutput || err.stderr || err.stdout) {
          const out = fullOutput || err.stderr || err.stdout;
          if (out && out.includes("Unsupported URL")) userMessage = "Unsupported URL.";
          else if (out && out.includes("Video unavailable")) userMessage = "Video unavailable.";
          else if (out && out.includes("Requested format is not available")) {
            userMessage = "Video format not available. Try a different quality setting.";
          } else if (out && out.includes("nsig extraction failed")) {
            userMessage = "YouTube playback issue detected. The video was likely still downloaded successfully.";
          } else if (out && out.includes("Some formats may be missing")) {
            userMessage = "Some video qualities unavailable, but download should still work.";
          } else if (out && out.includes("HTTP Error 403")) {
            userMessage = "Access denied by YouTube. Try again in a few minutes.";
          } else if (out && out.includes("Private video")) {
            userMessage = "This video is private and cannot be downloaded.";
          } else if (out && out.includes("This live event has ended")) {
            userMessage = "This live stream has ended and may not be available for download.";
          } else if (out) {
            const errorLine = out.split("\n").find((l: string) => l.toLowerCase().startsWith("error:"));
            userMessage = errorLine || "An error occurred. Check console.";
          }
        } else if (err.shortMessage) {
          userMessage = err.shortMessage;
        }
        toast.message = userMessage.substring(0, 250);

        if (err.isCanceled) {
          toast.primaryAction = undefined; // No actions if cancelled by user
        } else {
          toast.primaryAction = {
            title: "Copy Error Details",
            onAction: async () => {
              await Clipboard.copy(errorDetailsForClipboard);
              await showToast(Toast.Style.Success, "Error details copied to clipboard.");
            },
          };
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && (!ytDlpPath || !ffmpegPath)) return <Form isLoading={true} />;
  if (!ytDlpPath || !ffmpegPath) {
    return (
      <Form
        actions={
          <ActionPanel>
            {!ytDlpPath && (
              <Action.OpenInBrowser title="Install Yt-Dlp" url="https://formulae.brew.sh/formula/yt-dlp" />
            )}
            {!ffmpegPath && (
              <Action.OpenInBrowser title="Install Ffmpeg" url="https://formulae.brew.sh/formula/ffmpeg" />
            )}
          </ActionPanel>
        }
      >
        <Form.Description text="⚠️ Prerequisites Missing" />
        {!ytDlpPath && <Form.Description text="• yt-dlp not found. Install and restart." />}
        {!ffmpegPath && <Form.Description text="• ffmpeg not found. Install and restart." />}
      </Form>
    );
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Download Video" onSubmit={handleSubmit} />
          <Action
            title="Select Output Folder"
            onAction={async () => {
              try {
                const result = await execa("osascript", [
                  "-e",
                  'tell application "System Events" to choose folder with prompt "Select download folder:"',
                ]);
                const selectedPath = result.stdout.replace("alias ", "").replace(/:/g, "/").replace("Macintosh HD", "");
                setOutputPath(selectedPath);
              } catch {
                // User cancelled or error occurred
                console.log("Folder selection cancelled");
              }
            }}
          />
          <Action title="Reset to Downloads Folder" onAction={() => setOutputPath(downloadsPath)} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="url"
        title="YouTube URL"
        placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        value={url}
        error={urlError}
        onChange={setUrl}
        onBlur={(e) => validateUrl(e.target.value || "")}
      />
      <Form.Dropdown id="preset" title="Quick Presets" value={selectedPreset} onChange={applyPreset}>
        {Object.entries(presets).map(([key, preset]) => (
          <Form.Dropdown.Item key={key} value={key} title={preset.name} />
        ))}
      </Form.Dropdown>
      {selectedPreset !== "custom" && (
        <Form.Description text={`${presets[selectedPreset as keyof typeof presets].description}`} />
      )}
      <Form.Dropdown id="downloadType" title="Download Type" value={downloadType} onChange={setDownloadType}>
        <Form.Dropdown.Item value="mp4_video_audio" title="MP4 (Video + Audio)" />
        <Form.Dropdown.Item value="mp4_video_only" title="MP4 (Video Only)" />
        <Form.Dropdown.Item value="mp3_audio" title="MP3 Audio" />
        <Form.Dropdown.Item value="m4a_audio" title="M4A Audio (Original Quality)" />
      </Form.Dropdown>
      {(downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") && (
        <Form.Dropdown id="videoQuality" title="Video Quality" value={videoQuality} onChange={setVideoQuality}>
          <Form.Dropdown.Item value="best" title="Best Available" />
          <Form.Dropdown.Item value="2160p" title="2160p (4K)" />
          <Form.Dropdown.Item value="1440p" title="1440p (2K)" />
          <Form.Dropdown.Item value="1080p" title="1080p (Full HD)" />
          <Form.Dropdown.Item value="720p" title="720p (HD)" />
          <Form.Dropdown.Item value="480p" title="480p (SD)" />
        </Form.Dropdown>
      )}
      {(downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") && (
        <Form.Dropdown
          id="compressionLevel"
          title="Compression Level"
          value={compressionLevel}
          onChange={setCompressionLevel}
        >
          <Form.Dropdown.Item value="none" title="No Compression (Original)" />
          <Form.Dropdown.Item value="light" title="Light Compression (High Quality)" />
          <Form.Dropdown.Item value="medium" title="Medium Compression (Balanced)" />
          <Form.Dropdown.Item value="high" title="High Compression (Smaller Files)" />
          <Form.Dropdown.Item value="custom" title="Custom CRF Value" />
        </Form.Dropdown>
      )}
      {(downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") && compressionLevel === "custom" && (
        <Form.Dropdown
          id="compressionCrf"
          title="CRF Value (Lower = Better Quality)"
          value={compressionCrf}
          onChange={setCompressionCrf}
        >
          <Form.Dropdown.Item value="18" title="18 (Visually Lossless)" />
          <Form.Dropdown.Item value="20" title="20 (Excellent Quality)" />
          <Form.Dropdown.Item value="23" title="23 (High Quality - Default)" />
          <Form.Dropdown.Item value="25" title="25 (Good Quality)" />
          <Form.Dropdown.Item value="28" title="28 (Medium Quality)" />
          <Form.Dropdown.Item value="30" title="30 (Lower Quality)" />
        </Form.Dropdown>
      )}
      {downloadType === "mp3_audio" && (
        <Form.Dropdown id="mp3Quality" title="MP3 Audio Quality" value={mp3Quality} onChange={setMp3Quality}>
          <Form.Dropdown.Item value="5" title="VBR ~130 kbps (Standard)" />
          <Form.Dropdown.Item value="0" title="VBR ~245 kbps (Best)" />
          <Form.Dropdown.Item value="2" title="VBR ~190 kbps (High)" />
          <Form.Dropdown.Item value="320K" title="CBR 320 kbps" />
        </Form.Dropdown>
      )}
      <Form.Separator />
      <Form.TextField
        id="outputPath"
        title="Output Folder"
        placeholder="e.g., /Users/username/Downloads"
        value={outputPath}
        onChange={setOutputPath}
      />
      {estimatedSize && <Form.Description text={`📊 Estimated file size: ${estimatedSize}`} />}
      {videoInfo && videoInfo.duration && (
        <Form.Description
          text={`🎬 Duration: ${Math.floor(videoInfo.duration / 60)}:${(videoInfo.duration % 60).toString().padStart(2, "0")} | Title: ${videoInfo.title?.substring(0, 50)}${(videoInfo.title?.length || 0) > 50 ? "..." : ""}`}
        />
      )}
      <Form.Description text={`Files will be saved to: ${outputPath}`} />
      {(downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") && compressionLevel !== "none" && (
        <Form.Description text="💡 Compression will reduce file size but may take longer to process." />
      )}
      {(downloadType === "mp4_video_audio" || downloadType === "mp4_video_only") &&
        (videoQuality === "2160p" || videoQuality === "1440p") && (
          <Form.Description text="⚠️ High-resolution videos (2K/4K) may not be available for all videos and will result in larger file sizes." />
        )}
      {isLoading && <Form.Description text="Download in progress... this may take a few moments." />}
    </Form>
  );
}
