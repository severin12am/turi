// Netlify Function: Proxy for Google Gemini Word Explanation
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
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GOOGLE_GEMINI_API_KEY environment variable');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
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
    
    // Forward the request to Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Gemini API error',
          details: errorText 
        })
      };
    }

    // Return the generated content
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

