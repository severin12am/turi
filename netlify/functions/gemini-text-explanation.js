// netlify/functions/gemini-text-explanation.js
// Serverless function to handle Gemini AI text explanation requests
// This keeps the API key secure on the server side

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { modelName, requestBody } = JSON.parse(event.body);
    
    // Get API key from environment variable
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      throw new Error('API key not configured');
    }

    // Make request to Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    // Get response data
    const data = await response.json();

    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in gemini-text-explanation function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: error.message || 'Failed to generate explanation'
      })
    };
  }
}

