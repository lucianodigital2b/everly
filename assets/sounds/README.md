# Sounds Directory

This directory contains audio files used in the CleverNote app.

## Adding Snap Sound

To enable the snap sound feature:

1. Add a `snap.mp3` file to this directory
2. Uncomment the audio loading code in `app/(tabs)/_layout.jsx`
3. The snap sound will play when users tap on tabs or the add button

## Supported Audio Formats

- MP3
- WAV
- M4A
- AAC

## File Requirements

- Keep audio files small (< 100KB recommended)
- Use short duration sounds (< 1 second for UI feedback)
- Ensure proper licensing for any audio files used