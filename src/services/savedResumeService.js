import { supabase } from '../supabaseClient';

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
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    const { data, error } = await supabase
      .from('saved_resumes')
      .insert([
        {
          user_id: userId,
          tailored_resume_text: tailoredResumeText,
          job_description: jobDescription,
          job_title: jobTitle,
          original_resume_text: originalResumeText,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving resume:', error);
      return {
        success: false,
        error: error.message || 'Failed to save resume'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error saving resume:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get all saved resumes for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getSavedResumes(userId) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    const { data, error } = await supabase
      .from('saved_resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resumes:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch resumes'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get a single saved resume by ID
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getSavedResumeById(resumeId, userId) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    const { data, error } = await supabase
      .from('saved_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching resume:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch resume'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching resume:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Delete a saved resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteSavedResume(resumeId, userId) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    const { error } = await supabase
      .from('saved_resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting resume:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete resume'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting resume:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Update a saved resume
 * @param {string} resumeId - Resume ID
 * @param {string} userId - User ID (for security)
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updateSavedResume(resumeId, userId, updates) {
  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured'
    };
  }

  try {
    const { data, error } = await supabase
      .from('saved_resumes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating resume:', error);
      return {
        success: false,
        error: error.message || 'Failed to update resume'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating resume:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

