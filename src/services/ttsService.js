/**
 * Text-to-Speech service
 * Uses external TTS API for high-quality voices, falls back to browser TTS if unavailable
 */

export async function synthesizeSpeech(text, voiceName = null) {
  try {
    // Try external TTS API first
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceName,
        languageCode: 'en-US',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.audioContent) {
      // Convert base64 to audio blob and return
      const audioData = atob(data.audioContent);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      
      return {
        success: true,
        audioUrl,
        format: data.format || 'mp3',
        source: 'api'
      };
    } else {
      // API not configured or failed, fallback to browser TTS
      console.log('TTS API not available, falling back to browser TTS');
      return {
        success: false,
        fallback: true,
        source: 'browser'
      };
    }
  } catch (error) {
    console.error('TTS API error:', error);
    // Fallback to browser TTS on error
    return {
      success: false,
      fallback: true,
      source: 'browser',
      error: error.message
    };
  }
}

/**
 * Play audio from URL using HTMLAudioElement
 * Returns a promise that resolves when playback finishes
 */
export function playAudio(audioUrl) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
<<<<<<< HEAD
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Clean up
      resolve();
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl); // Clean up
      reject(error);
    };
    
    audio.play().catch(reject);
=======
    const opts = arguments.length > 1 ? arguments[1] : undefined;

    try {
      if (opts?.onAudioCreated) opts.onAudioCreated(audio);
    } catch (e) {
      // Don't block playback if a consumer hook fails
      console.warn('playAudio onAudioCreated hook failed:', e);
    }

    const cleanup = () => {
      // Only revoke blob/object URLs
      if (typeof audioUrl === 'string' && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };

    audio.onended = () => {
      try {
        if (opts?.onEnded) opts.onEnded();
      } catch (e) {
        console.warn('playAudio onEnded hook failed:', e);
      } finally {
        cleanup();
        resolve();
      }
    };

    audio.onerror = (error) => {
      try {
        if (opts?.onError) opts.onError(error);
      } catch (e) {
        console.warn('playAudio onError hook failed:', e);
      } finally {
        cleanup();
        reject(error);
      }
    };

    audio.play().catch((error) => {
      try {
        if (opts?.onError) opts.onError(error);
      } catch (e) {
        console.warn('playAudio onError hook failed:', e);
      } finally {
        cleanup();
        reject(error);
      }
    });
>>>>>>> 2de61af (Recovering uncommitted work after local .git deletion)
  });
}

