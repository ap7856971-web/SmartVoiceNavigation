import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";

import * as FileSystem from "expo-file-system/legacy";

let recorder: any = null;

/**
 * Start audio recording
 */
export async function startRecording(): Promise<boolean> {
  try {
    const permission =
      await requestRecordingPermissionsAsync();

    console.log(
      "[audioRecorder] Permission:",
      permission.granted
    );

    if (!permission.granted) {
      console.log(
        "[audioRecorder] Microphone permission denied"
      );

      return false;
    }

    // Stop old recorder if one exists
    if (recorder) {
      try {
        await recorder.stop();
      } catch (_) {}

      recorder = null;
    }

    console.log(
      "[audioRecorder] Creating recorder..."
    );

    recorder = new AudioModule.AudioRecorder(
      RecordingPresets.HIGH_QUALITY
    );

    console.log(
      "[audioRecorder] Recorder created"
    );

    await recorder.prepareToRecordAsync();

    console.log(
      "[audioRecorder] Prepared"
    );

    recorder.record();

    console.log(
      "[audioRecorder] Recording started"
    );

    return true;
  } catch (error) {
    console.error(
      "[audioRecorder] Start error:",
      error
    );

    recorder = null;

    return false;
  }
}

/**
 * Stop recording and return audio URI
 */
export async function stopRecording(): Promise<
  string | null
> {
  try {
    if (!recorder) {
      console.log(
        "[audioRecorder] No recorder instance!"
      );

      return null;
    }

    console.log(
      "[audioRecorder] Stopping..."
    );

    await recorder.stop();

    console.log(
      "[audioRecorder] Stopped"
    );

    const uri = recorder.uri;

    console.log(
      "[audioRecorder] URI:",
      uri
    );

    recorder = null;

    return uri ?? null;
  } catch (error) {
    console.error(
      "[audioRecorder] Stop error:",
      error
    );

    recorder = null;

    return null;
  }
}

/**
 * Delete recorded audio
 */
export async function deleteRecording(
  uri: string
): Promise<void> {
  try {
    if (!uri) {
      return;
    }

    const info =
      await FileSystem.getInfoAsync(uri);

    if (info.exists) {
      await FileSystem.deleteAsync(uri, {
        idempotent: true,
      });

      console.log(
        "[audioRecorder] Recording deleted"
      );
    }
  } catch (error) {
    console.warn(
      "[audioRecorder] Delete error:",
      error
    );
  }
}