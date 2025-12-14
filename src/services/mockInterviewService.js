/**
 * Service for mock interview functionality
 */

export async function sendInterviewMessage(messages, resumeText, jobDescription, jobTitle, interviewerPersona, interviewStage) {
  try {
    const response = await fetch('/api/mock-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        resumeText,
        jobDescription,
        jobTitle,
        interviewerPersona,
        interviewStage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('Error sending interview message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
}

