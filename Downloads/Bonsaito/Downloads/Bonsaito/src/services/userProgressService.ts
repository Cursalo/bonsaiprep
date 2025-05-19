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
      console.error('No user logged in for getUserProgress');
      return null;
    }
    
    console.log(`Fetching user_progress for user_id: ${user.id}`);
    // Fetch as an array first
    const { data: records, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Supabase fetchError in getUserProgress (array fetch):', JSON.stringify(fetchError, null, 2));
      // Log specific details if available
      if (fetchError.message) console.error('Error Message:', fetchError.message);
      if (fetchError.details) console.error('Error Details:', fetchError.details);
      if (fetchError.hint) console.error('Error Hint:', fetchError.hint);
      throw fetchError; // Re-throw to be caught by the outer catch
    }

    if (!records || records.length === 0) {
      console.log('No user_progress record found (empty array), initializing...');
      return await initializeUserProgress(user.id);
    }

    if (records.length > 1) {
      console.warn(`Expected 1 user_progress record for user ${user.id}, found ${records.length}. Using the first record.`);
      // Potentially, you might want to handle this as an error or implement merging logic
    }
    
    const record = records[0];
    console.log('Successfully fetched user_progress record:', record);
    return {
      correctAnswersCount: record.correct_answers_count || 0,
      completedTests: record.completed_tests || 0,
      lastTestDate: record.last_test_date,
      treeSyncTimestamp: record.tree_sync_timestamp || Date.now()
    };

  } catch (error: any) { // Catch any error, including those re-thrown
    console.error('Error in getUserProgress (outer catch):', JSON.stringify(error, null, 2));
    if (error.message) console.error('Outer Catch - Error Message:', error.message);
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
 * @param correctAnswersInTest Number of correct answers in this specific test
 * @returns The updated user progress data
 */
export const recordCompletedTest = async (correctAnswersInTest: number): Promise<UserProgress | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user logged in');
      return null;
    }
    
    const currentProgress = await getUserProgress();
    
    if (!currentProgress) {
      const initializedProgress = await initializeUserProgress(user.id, correctAnswersInTest);
      if (!initializedProgress) return null; 

      const { data, error } = await supabase
        .from('user_progress')
        .update({
            completed_tests: 1, 
            last_test_date: new Date().toISOString(),
            tree_sync_timestamp: Date.now()
        })
        .eq('user_id', user.id)
        .select()
        .single();
        
        if (error) throw error;
        return {
            correctAnswersCount: data.correct_answers_count || 0,
            completedTests: data.completed_tests || 0,
            lastTestDate: data.last_test_date,
            treeSyncTimestamp: data.tree_sync_timestamp || Date.now()
        };
    }
    
    const newTotalCorrectAnswers = currentProgress.correctAnswersCount + correctAnswersInTest;
    const newCompletedTests = currentProgress.completedTests + 1;

    const { data, error } = await supabase
      .from('user_progress')
      .update({
        correct_answers_count: newTotalCorrectAnswers,
        completed_tests: newCompletedTests,
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
 * Calculates correct answers count directly from practice_questions table.
 * Optionally syncs this count to the user_progress table.
 * @param syncUserProgressTable If true, updates the user_progress table with the calculated count. Defaults to false.
 * @returns The calculated correct answers count from practice_questions.
 */
export const calculateCorrectAnswersFromDatabase = async (syncUserProgressTable: boolean = false): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No user logged in for calculateCorrectAnswersFromDatabase');
      return 0;
    }
    
    const { data, error } = await supabase
      .from('practice_questions')
      .select('id, correct')
      .eq('user_id', user.id)
      .eq('completed', true);
      
    if (error) {
      console.error('Error fetching practice_questions:', error);
      throw error;
    }
    
    const correctAnswers = data ? data.filter(q => q.correct === true).length : 0;
    
    if (syncUserProgressTable) {
      console.log(`Syncing user_progress table with calculated ${correctAnswers} correct answers from practice_questions.`);
      await updateCorrectAnswersCount(correctAnswers); // Use existing function to update
    }
    
    return correctAnswers;
  } catch (error) {
    console.error('Error in calculateCorrectAnswersFromDatabase:', error);
    return 0;
  }
}; 