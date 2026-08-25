import { authFetch } from '../utils/authFetch';

/**
 * Save a tailored resume to the database
 * @param {string} userId - User ID
 * @param {string} tailoredResumeText - The tailored resume text
 * @param {string} jobDescription - The job description used
 * @param {string} jobTitle - Optional job title/company name
 * @param {string} originalResumeText - Original resume text
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function saveTailoredResume(userId, tailoredResumeText, jobDescription, jobTitle = null, originalResumeText = null) {
  try {
    const response = await authFetch('/api/save-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        tailoredResumeText,
        jobDescription,
        jobTitle,
        originalResumeText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      return {
        success: false,
        error: message,
        errorCode: errorData.error,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving resume:', error);
    return {
      success: false,
      error: error.message || 'Failed to save resume'
    };
  }
}

/**
 * Get all saved resumes for the signed-in user (identity comes from the auth token;
 * callers may still pass a userId argument, it's simply ignored)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getSavedResumes() {
  try {
    const response = await authFetch('/api/saved-resumes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch resumes'
    };
  }
}

/**
 * Get a single saved resume by ID (must belong to the signed-in user;
 * callers may still pass a userId argument, it's simply ignored)
 * @param {string} resumeId - Resume ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getSavedResumeById(resumeId) {
  try {
    const response = await authFetch(`/api/saved-resumes?resumeId=${encodeURIComponent(resumeId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching resume:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch resume'
    };
  }
}

/**
 * Delete a saved resume (must belong to the signed-in user;
 * callers may still pass a userId argument, it's simply ignored)
 * @param {string} resumeId - Resume ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteSavedResume(resumeId) {
  try {
    const response = await authFetch(`/api/saved-resumes?resumeId=${encodeURIComponent(resumeId)}`, {
      method: 'DELETE',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting resume:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Update a saved resume (must belong to the signed-in user)
 * @param {string} resumeId - Resume ID
 * @param {string} _userId - Unused; kept for call-site compatibility
 * @param {object} updates - Fields to update (tailoredResumeText, jobDescription, jobTitle, originalResumeText)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateSavedResume(resumeId, _userId, updates) {
  try {
    const response = await authFetch(`/api/saved-resumes?resumeId=${encodeURIComponent(resumeId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tailored_resume_text: updates.tailoredResumeText ?? updates.tailored_resume_text,
        job_description: updates.jobDescription ?? updates.job_description,
        job_title: updates.jobTitle ?? updates.job_title,
        original_resume_text: updates.originalResumeText ?? updates.original_resume_text,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`
      };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error updating resume:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

