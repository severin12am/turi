// Netlify Function: Proxy for Groq AI API
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
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GROQ_API_KEY environment variable');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Missing Groq API key' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    
    if (!requestBody.model || !requestBody.messages) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing model or messages in request' })
      };
    }
    
    console.log('[Groq] Making request with model:', requestBody.model);
    
    // Forward the request to Groq API
    // Groq uses OpenAI-compatible API format
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Groq] API error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Groq API error',
          details: errorText 
        })
      };
    }

    // Return the generated content
    const data = await response.json();
    console.log('[Groq] Success:', data.choices?.[0]?.message?.content?.substring(0, 100));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[Groq] Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

