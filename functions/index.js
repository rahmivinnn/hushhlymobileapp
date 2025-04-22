const functions = require('firebase-functions');
const axios = require('axios');

// OpenAI API Cloud Function
exports.callOpenAI = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is authenticated (optional, remove if you want to allow anonymous access)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError(
    //     'unauthenticated',
    //     'The function must be called while authenticated.'
    //   );
    // }

    // Validate request data
    if (!data.messages || !Array.isArray(data.messages)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with "messages" array.'
      );
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: data.model || 'gpt-3.5-turbo',
        messages: data.messages,
        temperature: data.temperature || 0.7,
        max_tokens: data.max_tokens || 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    // Return the response
    return response.data.choices[0].message;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      'Error calling OpenAI API',
      error.message
    );
  }
});
