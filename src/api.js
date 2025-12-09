/**
 * Generate content using OpenAI via serverless API endpoint
 * This ensures the API key stays secure on the server
 */
export async function generateContent(prompt) {
  try {
    const response = await fetch('/api/tailor-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      // Try to get error message, but handle empty responses
      let errorMessage = 'Failed to generate content';
      try {
        const text = await response.text();
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Check if response has content before parsing
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server');
    }

    const data = JSON.parse(text);
    return data.content;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

