# YouTube Downloader for Raycast

A powerful Raycast extension for downloading YouTube videos and audio with robust format selection and error handling.

## Features

- 🎥 **Multiple Download Formats**: MP4 (video+audio), MP4 (video only), MP3 audio, M4A audio
- 🎯 **Quality Selection**: Choose from Best, 1080p, 720p, 480p for video downloads
- 🎵 **Audio Quality Options**: Multiple MP3 quality settings (VBR and CBR)
- 🔄 **Robust Format Selection**: Automatic fallback to available formats
- ⚡ **Smart Error Handling**: Handles YouTube's recent format restrictions and nsig issues
- 📋 **Clipboard Integration**: Automatically detects YouTube URLs from clipboard
- 📁 **Downloads Folder**: Saves files directly to your Downloads folder
- 🚫 **Cancellable Downloads**: Cancel downloads in progress with a simple action

## Prerequisites

This extension requires the following tools to be installed:

- **yt-dlp**: `brew install yt-dlp`
- **ffmpeg**: `brew install ffmpeg`

The extension will automatically detect these tools and guide you through installation if they're missing.

## Installation

1. Install the required dependencies:
   ```bash
   brew install yt-dlp ffmpeg
   ```

2. Install the extension from the Raycast Store or build from source.

## Usage

1. Open Raycast and search for "Download YouTube Video"
2. Paste or enter a YouTube URL
3. Select your preferred download type and quality
4. Press Enter to start the download
5. Files will be saved to your Downloads folder

### Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- URLs with additional parameters are also supported

## Download Options

### Video Formats
- **MP4 (Video + Audio)**: Complete video with audio track
- **MP4 (Video Only)**: Video without audio track

### Audio Formats
- **MP3 Audio**: Compressed audio with quality options
- **M4A Audio**: Original quality audio format

### Quality Settings
- **Best Available**: Highest quality available
- **1080p, 720p, 480p**: Specific resolution limits

## Recent Fixes

This extension includes fixes for YouTube's recent changes:

- ✅ Updated yt-dlp to latest version (2025.5.22)
- ✅ Improved format selection with multiple fallbacks
- ✅ Enhanced error handling for nsig extraction issues
- ✅ Better compatibility with YouTube's new restrictions
- ✅ Added retry mechanisms and alternative player clients

## Troubleshooting

### Common Issues

1. **"yt-dlp Not Found"**: Install yt-dlp using `brew install yt-dlp`
2. **"FFmpeg Not Found"**: Install ffmpeg using `brew install ffmpeg`
3. **"Video format not available"**: Try a different quality setting
4. **Download fails**: The extension will automatically retry with fallback formats

### Error Messages

The extension provides helpful error messages for common issues:
- Format availability problems
- Network connectivity issues
- Private or unavailable videos
- YouTube playback restrictions

## Development

To build and run the extension locally:

```bash
npm install
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.