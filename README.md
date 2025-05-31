# YouTube Downloader for Raycast

A powerful Raycast extension for downloading YouTube videos and audio with robust format selection, compression options, and error handling.

## Features

- 🎥 **Multiple Download Formats**: MP4 (video+audio), MP4 (video only), MP3 audio, M4A audio
- 🎯 **Quality Selection**: Choose from Best, 4K (2160p), 2K (1440p), Full HD (1080p), HD (720p), SD (480p)
- 🗜️ **Video Compression**: Reduce file sizes with Light, Medium, High, or Custom compression levels
- ⚡ **Quick Presets**: One-click configurations for common use cases
- 📊 **Enhanced Progress Tracking**: Real-time speed, ETA, and file size progress
- 📊 **File Size Estimation**: See estimated file size before downloading
- 📁 **Changeable Output Folder**: Choose any folder for downloads (defaults to Downloads)
- 🎵 **Audio Quality Options**: Multiple MP3 quality settings (VBR and CBR)
- 🔄 **Robust Format Selection**: Automatic fallback to available formats
- ⚡ **Smart Error Handling**: Handles YouTube's recent format restrictions and nsig issues
- 📋 **Clipboard Integration**: Automatically detects YouTube URLs from clipboard
- 🚫 **Cancellable Downloads**: Cancel downloads in progress with a simple action
- 🎬 **Video Information**: Shows video duration and title when available

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
- **2160p (4K)**: Ultra High Definition (when available)
- **1440p (2K)**: Quad HD resolution
- **1080p (Full HD)**: Full High Definition
- **720p (HD)**: High Definition
- **480p (SD)**: Standard Definition

### Compression Options

Compression helps reduce file sizes while maintaining good quality:

- **No Compression (Original)**: Downloads in original quality
- **Light Compression (High Quality)**: CRF 20 - Excellent quality with minimal size reduction
- **Medium Compression (Balanced)**: CRF 23 - Good balance of quality and file size
- **High Compression (Smaller Files)**: CRF 28 - Smaller files with acceptable quality
- **Custom CRF Value**: Choose your own CRF value (18-30)

#### CRF (Constant Rate Factor) Guide
- **Lower CRF = Better Quality, Larger Files**
- **Higher CRF = Lower Quality, Smaller Files**
- CRF 18: Visually lossless (very large files)
- CRF 23: High quality (recommended default)
- CRF 28: Medium quality (good for storage savings)

**Note**: Compression will take additional processing time but can significantly reduce file sizes, especially for high-resolution videos.

### File Size Estimation

The extension automatically estimates file sizes based on:
- Video duration and quality settings
- Compression level selected
- Audio quality (for audio downloads)

Estimations are approximate and may vary depending on video content complexity.

### Output Folder Management

- **Default**: Downloads folder in your home directory
- **Changeable**: Use "Select Output Folder" action to choose any folder
- **Reset**: Use "Reset to Downloads Folder" action to restore default
- **Path Display**: Current output path is always shown in the form

### Quick Presets

Save time with pre-configured download settings:

- **🎬 High Quality**: 4K/2K with light compression - Best for viewing
- **📱 Mobile Friendly**: 720p with high compression - Great for phones  
- **💾 Storage Saver**: 480p with maximum compression - Minimal space usage
- **🎵 Audio Only**: High quality MP3 - Just the sound
- **⚖️ Balanced**: 1080p with medium compression - Good all-around choice
- **🔧 Custom**: Manual settings for advanced users

Presets automatically adjust all relevant settings (quality, compression, format) and are smart enough to detect when your current settings match a preset.

### Enhanced Progress Tracking

Get detailed real-time information during downloads:

- **Progress Percentage**: Exact completion percentage
- **Download Speed**: Current transfer rate in MB/s
- **ETA**: Estimated time remaining (when available)
- **File Size Progress**: Downloaded vs total file size
- **Smart Display**: Only shows relevant information based on what's available

Progress information appears in both the toast notification and the form interface.

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