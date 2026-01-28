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
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Clean up
      resolve();
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl); // Clean up
      reject(error);
    };
    
    audio.play().catch(reject);
  });
}

