// Netlify Function: Proxy for ElevenLabs Text-to-Speech API
// Hides the API key on the server side

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get the API key from environment (server-side only, not exposed to browser)
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.error('Missing ELEVENLABS_API_KEY environment variable');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Missing ElevenLabs API key' })
    };
  }

  try {
    // Parse the request body
    const { text, voiceId, languageCode } = JSON.parse(event.body);
    
    if (!text || !voiceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing text or voiceId in request' })
      };
    }
    
    console.log('[ElevenLabs] Generating speech with voice:', voiceId);
    
    // ElevenLabs API request
    // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2', // Supports 29 languages
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'ElevenLabs API error',
          details: errorText 
        })
      };
    }

    // Get the audio as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 (to match Google TTS format for compatibility)
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log('[ElevenLabs] Success: Generated', audioBuffer.byteLength, 'bytes');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        audioContent: base64Audio
      })
    };

  } catch (error) {
    console.error('[ElevenLabs] Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

