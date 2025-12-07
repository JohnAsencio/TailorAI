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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate content');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

/**
 * Generate ATS check content using OpenAI via serverless API endpoint
 */
export async function generateATSContent(prompt) {
  try {
    const response = await fetch('/api/ats-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check ATS compatibility');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error calling ATS API:', error);
    throw error;
  }
}
