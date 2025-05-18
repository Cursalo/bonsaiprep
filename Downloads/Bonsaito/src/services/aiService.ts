// src/services/aiService.ts

// Define the structure for a generated question
export interface GeneratedQuestion {
  id: string;
  text: string;         // The question itself
  topic: string;        // The topic the question relates to (e.g., Algebra, Grammar)
  difficulty?: string;  // Optional: e.g., Easy, Medium, Hard
  options?: string[];   // Optional: For multiple-choice questions
  answer?: string;      // Optional: The correct answer
  explanation?: string; // Optional: Explanation for the answer
}

// Interface for parsed SAT test data
interface SATTestData {
  sections: {
    [key: string]: {
      correct: number;
      incorrect: number;
      total: number;
      incorrectQuestions: Array<{
        questionNumber: string;
        correctAnswer: string;
        yourAnswer: string;
      }>;
    }
  };
  totalCorrect: number;
  totalIncorrect: number;
  totalQuestions: number;
}

// Get Gemini API key from environment variables
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Gemini API endpoint
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Parse SAT report text to extract information about incorrect answers
 */
const parseSATReport = (reportText: string): SATTestData => {
  const lines = reportText.split('\n');
  
  // Initialize data structure
  const data: SATTestData = {
    sections: {
      'Reading and Writing': {
        correct: 0,
        incorrect: 0,
        total: 0,
        incorrectQuestions: []
      },
      'Math': {
        correct: 0,
        incorrect: 0,
        total: 0,
        incorrectQuestions: []
      }
    },
    totalCorrect: 0,
    totalIncorrect: 0,
    totalQuestions: 0
  };
  
  // Extract test data
  for (const line of lines) {
    // Match pattern: questionNumber, section, correctAnswer, yourAnswer, status
    const questionMatch = line.match(/^\s*(\d+)\s+(Reading and Writing|Math)\s+([A-D0-9/\.]+)\s+([A-D0-9/\.]+);\s*(Correct|Incorrect)/);
    
    if (questionMatch) {
      const [_, questionNumber, section, correctAnswer, yourAnswer, status] = questionMatch;
      
      if (section in data.sections) {
        data.sections[section].total += 1;
        
        if (status === 'Correct') {
          data.sections[section].correct += 1;
        } else {
          data.sections[section].incorrect += 1;
          data.sections[section].incorrectQuestions.push({
            questionNumber,
            correctAnswer,
            yourAnswer
          });
        }
      }
    }
  }
  
  // Calculate totals
  data.totalCorrect = Object.values(data.sections).reduce((sum, section) => sum + section.correct, 0);
  data.totalIncorrect = Object.values(data.sections).reduce((sum, section) => sum + section.incorrect, 0);
  data.totalQuestions = data.totalCorrect + data.totalIncorrect;
  
  return data;
};

/**
 * Determines the main topics for each section based on mistakes
 */
const determineTopics = (section: string): string[] => {
  if (section === 'Reading and Writing') {
    return ['Information and Ideas', 'Expression of Ideas', 'Craft and Structure', 'Standard English Conventions'];
  } else if (section === 'Math') {
    return ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'];
  }
  return ['General Knowledge'];
};

/**
 * Makes an API call to Gemini to generate questions
 * @param prompt The prompt to send to Gemini
 * @returns Generated content from Gemini
 */
const callGeminiAPI = async (prompt: string): Promise<any> => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please set REACT_APP_GEMINI_API_KEY in your environment variables.");
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

/**
 * Creates a prompt for Gemini to generate SAT practice questions
 */
const createGeminiPrompt = (satData: SATTestData): string => {
  const incorrectRWCount = satData.sections['Reading and Writing']?.incorrect || 0;
  const incorrectMathCount = satData.sections['Math']?.incorrect || 0;
  
  let prompt = `As an expert SAT tutor, create ${incorrectRWCount > 0 && incorrectMathCount > 0 ? '10' : '10'} unique SAT practice questions.

STUDENT'S SAT REPORT SUMMARY:
- Reading and Writing section: ${satData.sections['Reading and Writing'].correct} correct, ${satData.sections['Reading and Writing'].incorrect} incorrect
- Math section: ${satData.sections['Math'].correct} correct, ${satData.sections['Math'].incorrect} incorrect
- Total score: ${satData.totalCorrect} out of ${satData.totalQuestions}

`;

  // Add details about incorrect questions
  if (incorrectRWCount > 0) {
    prompt += `\nREADING AND WRITING MISTAKES:\n`;
    satData.sections['Reading and Writing'].incorrectQuestions.forEach(q => {
      prompt += `- Question ${q.questionNumber}: Student answered "${q.yourAnswer}" but correct answer was "${q.correctAnswer}"\n`;
    });
  }
  
  if (incorrectMathCount > 0) {
    prompt += `\nMATH MISTAKES:\n`;
    satData.sections['Math'].incorrectQuestions.forEach(q => {
      prompt += `- Question ${q.questionNumber}: Student answered "${q.yourAnswer}" but correct answer was "${q.correctAnswer}"\n`;
    });
  }

  // Distribution of questions based on where student needs more practice
  const rwQuestions = incorrectRWCount > 0 ? Math.ceil((incorrectRWCount / (incorrectRWCount + incorrectMathCount)) * 10) : 0;
  const mathQuestions = 10 - rwQuestions;

  prompt += `\nBased on the student's performance, please create:
${rwQuestions > 0 ? `- ${rwQuestions} Reading and Writing questions` : ''}
${rwQuestions > 0 && mathQuestions > 0 ? '\n' : ''}${mathQuestions > 0 ? `- ${mathQuestions} Math questions` : ''}

For Reading and Writing questions, focus on these topic areas:
- Information and Ideas (comprehending texts, locating information)
- Expression of Ideas (development, organization, effective language use)
- Craft and Structure (word choice, text structure, point of view)
- Standard English Conventions (grammar, usage, mechanics)

For Math questions, focus on these topic areas:
- Algebra (linear equations, systems, functions)
- Advanced Math (quadratics, exponents, polynomials)
- Problem-Solving and Data Analysis (ratios, percentages, statistics)
- Geometry and Trigonometry (shapes, angles, triangles)

FORMAT INSTRUCTIONS:
Return your response as a JSON array containing exactly 10 question objects with these fields:
- id: A unique string identifier (e.g., "rw-info-1")
- text: The question text
- topic: The specific topic area (e.g., "Algebra", "Information and Ideas")
- difficulty: "Easy", "Medium", or "Hard"
- options: Array of 4 answer choices for multiple-choice questions
- answer: The correct answer (letter A-D for multiple choice or exact answer for grid-ins)
- explanation: Detailed explanation of the correct answer

IMPORTANT REQUIREMENTS:
1. For Reading questions: Create multiple-choice questions similar to those in SAT Reading.
2. For Math questions: Create both multiple-choice and student-produced response questions (grid-ins).
3. All questions should be original and at appropriate SAT difficulty level.
4. Include high-quality explanations that teach the concept.
5. Ensure questions reflect real SAT format and content.
6. ENSURE THE RESPONSE IS VALID JSON that can be parsed with JSON.parse().

Example format for ONE question (you'll provide 10):
{
  "id": "math-alg-1",
  "text": "If f(x) = 3x² - 4x + 2, what is the value of f(2)?",
  "topic": "Algebra",
  "difficulty": "Medium",
  "options": ["6", "8", "10", "12"],
  "answer": "C",
  "explanation": "f(2) = 3(2)² - 4(2) + 2 = 3(4) - 8 + 2 = 12 - 8 + 2 = 6 + 2 = 10"
}`;

  return prompt;
};

/**
 * Extracts and formats questions from Gemini's response
 */
const extractQuestionsFromGeminiResponse = (responseData: any): GeneratedQuestion[] => {
  try {
    // Extract the text content from Gemini's response
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("Unexpected Gemini API response format: no content found");
    }

    // Find JSON array in the response (model might include other text before or after)
    let jsonContent = content;
    
    // If the response contains markdown code blocks, extract just the JSON part
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonContent = jsonMatch[1];
    }
    
    // Sometimes the model may wrap JSON in an object instead of returning an array directly
    // Check if we have a JSON object with a questions array
    const objectMatch = jsonContent.match(/\{\s*"questions"\s*:\s*(\[[\s\S]*?\])\s*\}/);
    if (objectMatch && objectMatch[1]) {
      jsonContent = objectMatch[1];
    }
    
    // Clean up any non-JSON content that might exist
    jsonContent = jsonContent.trim();
    if (!jsonContent.startsWith('[')) {
      const startPos = jsonContent.indexOf('[');
      if (startPos >= 0) {
        jsonContent = jsonContent.substring(startPos);
      }
    }
    if (!jsonContent.endsWith(']')) {
      const endPos = jsonContent.lastIndexOf(']');
      if (endPos >= 0) {
        jsonContent = jsonContent.substring(0, endPos + 1);
      }
    }
    
    // Parse the JSON content
    const questions = JSON.parse(jsonContent);
    
    // Validate that we have an array of questions with required properties
    if (!Array.isArray(questions)) {
      throw new Error("Parsed content is not an array");
    }
    
    // Ensure each question has required fields
    return questions.map((q, index) => ({
      id: q.id || `question-${Date.now()}-${index}`,
      text: q.text || 'Question text unavailable',
      topic: q.topic || 'General',
      difficulty: q.difficulty,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation
    }));
  } catch (error: any) {
    console.error("Error parsing Gemini response:", error, "Raw response:", responseData);
    throw new Error(`Failed to parse questions from AI response: ${error.message}`);
  }
};

/**
 * Generates practice questions based on extracted text from an SAT report.
 * 
 * @param extractedMistakesText The text extracted from the SAT report.
 * @returns A promise that resolves to an array of GeneratedQuestion objects.
 */
export const generateQuestionsFromMistakes = async (
  extractedMistakesText: string
): Promise<GeneratedQuestion[]> => {
  console.log("Attempting to generate questions for text:", extractedMistakesText.substring(0, 300) + "...");

  if (!extractedMistakesText || extractedMistakesText.trim() === "") {
    console.warn("No text provided for question generation.");
    return [];
  }

  try {
    // 1. Parse the SAT report to understand mistakes
    const satData = parseSATReport(extractedMistakesText);
    console.log("Parsed SAT data:", satData);
    
    // 2. Generate questions based on the report
    try {
      // 2a. First try to use the Gemini API if the key is available
      if (GEMINI_API_KEY) {
        console.log("Generating questions using Gemini API");
        const prompt = createGeminiPrompt(satData);
        const geminiResponse = await callGeminiAPI(prompt);
        const generatedQuestions = extractQuestionsFromGeminiResponse(geminiResponse);
        
        // Ensure we have exactly 10 questions
        if (generatedQuestions.length < 10) {
          const remainingQuestions = generateFallbackQuestions(extractedMistakesText, 10 - generatedQuestions.length);
          return [...generatedQuestions, ...remainingQuestions];
        } else if (generatedQuestions.length > 10) {
          return generatedQuestions.slice(0, 10);
        }
        
        return generatedQuestions;
      } else {
        console.warn("No Gemini API key found. Using fallback question generation.");
        throw new Error("Gemini API key not configured");
      }
    } catch (apiError) {
      console.error("Error using Gemini API:", apiError);
      
      // 2b. If API call fails, fall back to the template-based approach
      console.log("Falling back to template-based question generation");
      
      const questions: GeneratedQuestion[] = [];
      
      // Get sections where mistakes were made
      const sectionsWithMistakes = Object.entries(satData.sections)
        .filter(([_, data]) => data.incorrect > 0)
        .sort((a, b) => b[1].incorrect - a[1].incorrect);
      
      // If we have sections with mistakes, generate questions for those
      if (sectionsWithMistakes.length > 0) {
        // Determine how many questions per section
        const totalSections = sectionsWithMistakes.length;
        const questionsPerSection = Math.ceil(10 / totalSections);
        
        // Generate questions for each section
        for (const [section, data] of sectionsWithMistakes) {
          const topics = determineTopics(section);
          
          for (let i = 0; i < Math.min(questionsPerSection, data.incorrect, 10); i++) {
            const topic = topics[Math.floor(Math.random() * topics.length)];
            
            questions.push(generateQuestionForTopic(section, topic, i));
            
            if (questions.length >= 10) break;
          }
          
          if (questions.length >= 10) break;
        }
      }
      
      // If we still don't have 10 questions, add more generic ones
      while (questions.length < 10) {
        const section = Object.keys(satData.sections)[Math.floor(Math.random() * Object.keys(satData.sections).length)];
        const topics = determineTopics(section);
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        questions.push(generateQuestionForTopic(section, topic, questions.length));
      }
      
      console.log("Generated questions:", questions);
      return questions;
    }
  } catch (error) {
    console.error("Error parsing SAT report:", error);
    return generateFallbackQuestions(extractedMistakesText, 10);
  }
};

/**
 * Generates a question for a specific topic
 */
const generateQuestionForTopic = (section: string, topic: string, index: number): GeneratedQuestion => {
  if (section === 'Reading and Writing') {
    if (topic === 'Information and Ideas') {
      return {
        id: `rw-info-${Date.now()}-${index}`,
        text: "Which statement best summarizes the main idea of the passage?",
        topic: "Information and Ideas",
        difficulty: "Medium",
        options: [
          "The economic impact of renewable energy on global markets",
          "The scientific advancements that enable modern solar technology",
          "The historical development of energy technology across cultures",
          "The environmental benefits of transitioning to renewable energy sources"
        ],
        answer: "D",
        explanation: "The passage primarily discusses the environmental benefits of renewable energy rather than focusing on economic, scientific, or historical aspects."
      };
    } else if (topic === 'Expression of Ideas') {
      return {
        id: `rw-expr-${Date.now()}-${index}`,
        text: "Which sentence would most effectively establish the main idea of the paragraph?",
        topic: "Expression of Ideas",
        difficulty: "Medium",
        options: [
          "The author's opinion represents only one perspective on the issue.",
          "Research indicates that several factors contribute to this phenomenon.",
          "Traditional approaches to solving this problem have proven ineffective.",
          "Personal biases often influence how people interpret complex data."
        ],
        answer: "C",
        explanation: "This option establishes context and signals that the paragraph will explore new approaches, creating a clear focus."
      };
    } else if (topic === 'Craft and Structure') {
      return {
        id: `rw-craft-${Date.now()}-${index}`,
        text: "What purpose does the author's reference to historical events serve in the passage?",
        topic: "Craft and Structure",
        difficulty: "Hard",
        options: [
          "To establish credibility through detailed knowledge",
          "To provide context for a contemporary issue",
          "To challenge conventional interpretations of history",
          "To appeal to readers' sense of nostalgia"
        ],
        answer: "B",
        explanation: "The historical references function primarily to provide context that helps readers understand the current situation being discussed."
      };
    } else {
      return {
        id: `rw-conv-${Date.now()}-${index}`,
        text: "Which revision corrects the grammatical error in the sentence?\n'Neither the students nor the teacher were able to attend the conference.'",
        topic: "Standard English Conventions",
        difficulty: "Medium",
        options: [
          "Neither the students nor the teacher was able to attend the conference.",
          "Neither the students nor the teacher being able to attend the conference.",
          "Neither the students nor the teacher have been able to attend the conference.",
          "No correction is needed."
        ],
        answer: "A",
        explanation: "When 'neither/nor' is used, the verb should agree with the noun closer to it (in this case 'teacher'), which requires the singular 'was' rather than 'were'."
      };
    }
  } else {
    if (topic === 'Algebra') {
      return {
        id: `math-alg-${Date.now()}-${index}`,
        text: "If f(x) = 3x² - 4x + 2, what is the value of f(2)?",
        topic: "Algebra",
        difficulty: "Medium",
        options: [
          "6",
          "8",
          "10",
          "12"
        ],
        answer: "C",
        explanation: "f(2) = 3(2)² - 4(2) + 2 = 3(4) - 8 + 2 = 12 - 8 + 2 = 6 + 2 = 10"
      };
    } else if (topic === 'Advanced Math') {
      return {
        id: `math-adv-${Date.now()}-${index}`,
        text: "Which of the following is equivalent to (2x + 5)(x - 3) - (x + 1)(x - 4)?",
        topic: "Advanced Math",
        difficulty: "Hard",
        options: [
          "x² - 3x - 17",
          "x² - 5x - 19",
          "x² + 3x - 17",
          "x² + 5x - 19"
        ],
        answer: "B",
        explanation: "(2x + 5)(x - 3) - (x + 1)(x - 4)\n= 2x² - 6x + 5x - 15 - (x² - 4x + x - 4)\n= 2x² - x - 15 - x² + 3x + 4\n= x² - x - 15 + 3x + 4\n= x² + 2x - 11"
      };
    } else if (topic === 'Problem-Solving and Data Analysis') {
      return {
        id: `math-data-${Date.now()}-${index}`,
        text: "The table shows the number of students in different grade levels at a school. If a student is selected at random, what is the probability that the student is in 10th grade?\n\nGrade: 9th, 10th, 11th, 12th\nNumber: 150, 130, 120, 100",
        topic: "Problem-Solving and Data Analysis",
        difficulty: "Medium",
        options: [
          "0.26",
          "0.30",
          "0.35",
          "0.40"
        ],
        answer: "A",
        explanation: "Total number of students = 150 + 130 + 120 + 100 = 500\nProbability = Number in 10th grade / Total = 130/500 = 0.26"
      };
    } else {
      return {
        id: `math-geo-${Date.now()}-${index}`,
        text: "In triangle ABC, if side AB = 6, side BC = 8, and angle B = 90°, what is the length of side AC?",
        topic: "Geometry and Trigonometry",
        difficulty: "Medium",
        options: [
          "8",
          "10",
          "12",
          "14"
        ],
        answer: "B",
        explanation: "Since angle B = 90°, triangle ABC is a right triangle. Using the Pythagorean theorem: AC² = AB² + BC² = 6² + 8² = 36 + 64 = 100\nTherefore, AC = √100 = 10"
      };
    }
  }
};

/**
 * Generates fallback questions if there's an error parsing the report or calling the API
 * @param text The original text input
 * @param count Number of questions to generate (default: 10)
 */
const generateFallbackQuestions = (text: string, count: number = 10): GeneratedQuestion[] => {
  const questions: GeneratedQuestion[] = [];
  const topics = [
    "Reading Comprehension", "Grammar and Language", "Algebra", "Geometry", 
    "Data Analysis", "Vocabulary in Context", "Advanced Math"
  ];
  
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    
    if (topic === "Reading Comprehension") {
      questions.push({
        id: `fallback-rc-${Date.now()}-${i}`,
        text: "What is the main purpose of the author in this passage?",
        topic: "Reading Comprehension",
        difficulty: "Medium",
        options: [
          "To persuade readers to take action on climate change",
          "To inform readers about recent scientific discoveries",
          "To compare different perspectives on a controversial issue",
          "To analyze the historical context of a current event"
        ],
        answer: "B",
        explanation: "The passage primarily presents information about scientific discoveries without attempting to persuade, compare perspectives, or analyze history."
      });
    } else if (topic === "Grammar and Language") {
      questions.push({
        id: `fallback-gram-${Date.now()}-${i}`,
        text: "Which revision most effectively combines the underlined sentences?\n'The museum acquired a new painting. It was created by a famous artist.'",
        topic: "Grammar and Language",
        difficulty: "Medium",
        options: [
          "The museum acquired a new painting, and it was created by a famous artist.",
          "The museum acquired a new painting that was created by a famous artist.",
          "The museum acquired a new painting; it was created by a famous artist.",
          "The museum acquired a new painting, which, it was created by a famous artist."
        ],
        answer: "B",
        explanation: "This option uses a relative clause to combine the sentences in the most concise and effective way."
      });
    } else if (topic === "Algebra") {
      questions.push({
        id: `fallback-alg-${Date.now()}-${i}`,
        text: "If 3x + 2y = 15 and 2x - y = 5, what is the value of x?",
        topic: "Algebra",
        difficulty: "Medium",
        options: ["3", "4", "5", "6"],
        answer: "B",
        explanation: "From 2x - y = 5, we get y = 2x - 5. Substituting into 3x + 2y = 15:\n3x + 2(2x - 5) = 15\n3x + 4x - 10 = 15\n7x = 25\nx = 25/7 = 4"
      });
    } else if (topic === "Geometry") {
      questions.push({
        id: `fallback-geo-${Date.now()}-${i}`,
        text: "If a circle has a radius of 6, what is its area?",
        topic: "Geometry",
        difficulty: "Medium",
        options: ["36π", "12π", "18π", "24π"],
        answer: "A",
        explanation: "The area of a circle is given by the formula A = πr². With r = 6, A = π(6)² = 36π."
      });
    } else {
      questions.push({
        id: `fallback-gen-${Date.now()}-${i}`,
        text: "Which of the following best interprets the data in the given chart?",
        topic: "Data Analysis",
        difficulty: "Medium",
        options: [
          "The trend shows steady growth over the five-year period",
          "There was a sharp decline followed by a gradual recovery",
          "The highest values occurred in the middle of the time period",
          "The data shows cyclical patterns with regular intervals"
        ],
        answer: "C",
        explanation: "The data in the chart shows peak values in the middle years of the time period, with lower values at the beginning and end."
      });
    }
  }
  
  return questions;
};

// Example of how you might call this (for testing purposes):
/*
(async () => {
  const sampleText = "User made mistakes in Algebra, particularly with quadratic equations. Also struggled with identifying the main idea in a reading passage.";
  try {
    const questions = await generateQuestionsFromMistakes(sampleText);
    console.log("Sample Generated Questions:", questions);
  } catch (error) {
    console.error("Error generating sample questions:", error);
  }
})();
*/ 