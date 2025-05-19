import { supabase } from '../supabaseClient';

// Interface for student progress data
export interface UserProgress {
  correctAnswersCount: number;
  completedTests: number;
  lastTestDate: string | null;
  treeSyncTimestamp: number;
}

/**
 * Retrieves the current user's progress data
 * @returns User progress data or null if error
 */
export const getUserProgress = async (): Promise<UserProgress | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user logged in');
      return null;
    }
    
    // Get user progress data
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Code for "no rows returned"
        // Create new progress record if none exists
        return await initializeUserProgress(user.id);
      }
      throw error;
    }
    
    return {
      correctAnswersCount: data.correct_answers_count || 0,
      completedTests: data.completed_tests || 0,
      lastTestDate: data.last_test_date,
      treeSyncTimestamp: data.tree_sync_timestamp || Date.now()
    };
  } catch (error) {
    console.error('Error retrieving user progress:', error);
    return null;
  }
};

/**
 * Updates the user's correct answers count
 * @param count The new count of correct answers
 * @returns The updated user progress data
 */
export const updateCorrectAnswersCount = async (count: number): Promise<UserProgress | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user logged in');
      return null;
    }
    
    // Update the progress record
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        correct_answers_count: count,
        tree_sync_timestamp: Date.now()
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      // If the record doesn't exist, initialize it
      if (error.code === 'PGRST116') {
        return await initializeUserProgress(user.id, count);
      }
      throw error;
    }
    
    return {
      correctAnswersCount: data.correct_answers_count || 0,
      completedTests: data.completed_tests || 0,
      lastTestDate: data.last_test_date,
      treeSyncTimestamp: data.tree_sync_timestamp || Date.now()
    };
  } catch (error) {
    console.error('Error updating correct answers count:', error);
    return null;
  }
};

/**
 * Increments the user's correct answers count
 * @param increment The amount to increment by (default: 1)
 * @returns The updated user progress data
 */
export const incrementCorrectAnswersCount = async (increment: number = 1): Promise<UserProgress | null> => {
  try {
    const currentProgress = await getUserProgress();
    
    if (!currentProgress) {
      return null;
    }
    
    const newCount = currentProgress.correctAnswersCount + increment;
    return await updateCorrectAnswersCount(newCount);
  } catch (error) {
    console.error('Error incrementing correct answers count:', error);
    return null;
  }
};

/**
 * Initializes a new user progress record
 * @param userId The user's ID
 * @param correctAnswersCount Initial correct answers count (optional)
 * @returns The initialized user progress data
 */
export const initializeUserProgress = async (
  userId: string, 
  correctAnswersCount: number = 0
): Promise<UserProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        correct_answers_count: correctAnswersCount,
        completed_tests: 0,
        last_test_date: null,
        tree_sync_timestamp: Date.now()
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      correctAnswersCount: data.correct_answers_count || 0,
      completedTests: data.completed_tests || 0,
      lastTestDate: data.last_test_date,
      treeSyncTimestamp: data.tree_sync_timestamp || Date.now()
    };
  } catch (error) {
    console.error('Error initializing user progress:', error);
    return null;
  }
};

/**
 * Records a completed test and increments the test count
 * @param correctAnswers Number of correct answers in this test
 * @returns The updated user progress data
 */
export const recordCompletedTest = async (correctAnswers: number): Promise<UserProgress | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user logged in');
      return null;
    }
    
    // First get current progress to get the current correct answers count
    const currentProgress = await getUserProgress();
    
    if (!currentProgress) {
      return null;
    }
    
    // Update the record with incremented values
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        correct_answers_count: currentProgress.correctAnswersCount + correctAnswers,
        completed_tests: currentProgress.completedTests + 1,
        last_test_date: new Date().toISOString(),
        tree_sync_timestamp: Date.now()
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      correctAnswersCount: data.correct_answers_count || 0,
      completedTests: data.completed_tests || 0,
      lastTestDate: data.last_test_date,
      treeSyncTimestamp: data.tree_sync_timestamp || Date.now()
    };
  } catch (error) {
    console.error('Error recording completed test:', error);
    return null;
  }
};

/**
 * Calculates correct answers count directly from practice_questions table
 * This should be used to sync the count with actual data
 * @param syncUserProgressTable If true, updates the user_progress table with the calculated count. Defaults to false.
 * @returns The calculated correct answers count
 */
export const calculateCorrectAnswersFromDatabase = async (syncUserProgressTable: boolean = false): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user logged in for calculateCorrectAnswersFromDatabase');
      return 0;
    }
    
    // Get the completed questions for the user
    const { data, error } = await supabase
      .from('practice_questions')
      .select('id, correct') // Only select what's needed
      .eq('user_id', user.id)
      .eq('completed', true);
      
    if (error) {
      console.error('Error fetching practice questions:', error);
      throw error;
    }
    
    // Calculate how many questions were answered correctly
    const correctAnswers = data ? data.filter(q => q.correct === true).length : 0;
    console.log('Calculated correct answers from database:', correctAnswers);
    
    // Update the user progress record to match this calculation if requested
    if (syncUserProgressTable) {
      console.log('Syncing user_progress table with calculated correct answers:', correctAnswers);
      await updateCorrectAnswersCount(correctAnswers);
    }
    
    return correctAnswers;
  } catch (error) {
    console.error('Error calculating correct answers from database:', error);
    return 0;
  }
}; 