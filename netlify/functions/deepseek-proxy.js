// Netlify Function: Proxy for Deepseek AI API
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
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.error('Missing DEEPSEEK_API_KEY environment variable');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Missing Deepseek API key' })
    };
  }

  try {
    // Parse the request body
    const { modelName, requestBody } = JSON.parse(event.body);

    if (!modelName || !requestBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing modelName or requestBody' })
      };
    }

    console.log('[Deepseek] Making request with model:', modelName);
    
    // Forward the request to Deepseek API
    // Deepseek uses OpenAI-compatible API format
    const response = await fetch(
      'https://api.deepseek.com/v1/chat/completions',
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
      console.error('[Deepseek] API error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Deepseek API error',
          details: errorText 
        })
      };
    }

    // Return the generated content
    const data = await response.json();
    console.log('[Deepseek] Success:', data.choices?.[0]?.message?.content?.substring(0, 100));
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[Deepseek] Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

