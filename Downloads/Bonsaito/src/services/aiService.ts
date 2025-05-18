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

// Interface for topic difficulty information
interface TopicInfo {
  percentage: number;
  difficulty: string;
}

// Interface for section information
interface SectionTopicsInfo {
  [topic: string]: TopicInfo;
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
  sectionInfo?: {
    [section: string]: SectionTopicsInfo;
  };
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
  
  // First look for the summary data if available
  const totalQuestionsMatch = reportText.match(/(\d+)\s*Total Questions/);
  const correctAnswersMatch = reportText.match(/(\d+)\s*Correct Answers/);
  const incorrectAnswersMatch = reportText.match(/(\d+)\s*Incorrect Answers/);
  
  if (totalQuestionsMatch) {
    data.totalQuestions = parseInt(totalQuestionsMatch[1]);
  }
  
  if (correctAnswersMatch) {
    data.totalCorrect = parseInt(correctAnswersMatch[1]);
  }
  
  if (incorrectAnswersMatch) {
    data.totalIncorrect = parseInt(incorrectAnswersMatch[1]);
  }
  
  // Try to extract information about each section's difficulty level
  const sectionInfoRegex = /(Information and Ideas|Expression of Ideas|Craft and Structure|Standard English Conventions|Algebra|Advanced Math|Problem-Solving and Data Analysis|Geometry and Trigonometry)\s*\((\d+)%[^)]*\)(?:[^)]*Diﬃculty level: (Easy|Medium|Hard))?/g;
  let sectionMatch;
  
  while ((sectionMatch = sectionInfoRegex.exec(reportText)) !== null) {
    const topic = sectionMatch[1];
    const percentage = parseInt(sectionMatch[2]);
    const difficulty = sectionMatch[3] || "Medium";
    
    // Map topics to main sections
    let mainSection = '';
    if (['Information and Ideas', 'Expression of Ideas', 'Craft and Structure', 'Standard English Conventions'].includes(topic)) {
      mainSection = 'Reading and Writing';
    } else {
      mainSection = 'Math';
    }
    
    // Store this information for potential use in question generation
    if (!data.sectionInfo) {
      data.sectionInfo = {};
    }
    
    if (!data.sectionInfo[mainSection]) {
      data.sectionInfo[mainSection] = {};
    }
    
    data.sectionInfo[mainSection][topic] = {
      percentage,
      difficulty
    };
  }
  
  // Extract test data row by row from the questions table
  const questionRegex = /^\s*(\d+)\s+(Reading and Writing|Math)\s+([A-D0-9/\., ]+)\s+([A-D0-9/\., ]+);?\s*(Correct|Incorrect)/;
  
  for (const line of lines) {
    const questionMatch = line.match(questionRegex);
    
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
            correctAnswer: correctAnswer.trim(),
            yourAnswer: yourAnswer.trim()
          });
        }
      }
    }
  }
  
  // If we couldn't parse the summary data directly, calculate from question data
  if (data.totalQuestions === 0) {
    data.totalCorrect = Object.values(data.sections).reduce((sum, section) => sum + section.correct, 0);
    data.totalIncorrect = Object.values(data.sections).reduce((sum, section) => sum + section.incorrect, 0);
    data.totalQuestions = data.totalCorrect + data.totalIncorrect;
  }
  
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
  
  let prompt = `As an expert SAT tutor, create 10 unique SAT practice questions tailored to this student's specific performance on a recent SAT practice test.

STUDENT'S SAT REPORT SUMMARY:
- Reading and Writing section: ${satData.sections['Reading and Writing'].correct} correct, ${satData.sections['Reading and Writing'].incorrect} incorrect
- Math section: ${satData.sections['Math'].correct} correct, ${satData.sections['Math'].incorrect} incorrect
- Total score: ${satData.totalCorrect} out of ${satData.totalQuestions}
`;

  // Add details about section difficulty levels if available
  if (satData.sectionInfo) {
    prompt += `\nSECTION DIFFICULTY INFORMATION:\n`;
    
    for (const [section, topics] of Object.entries(satData.sectionInfo)) {
      prompt += `${section}:\n`;
      for (const [topic, info] of Object.entries(topics)) {
        prompt += `- ${topic}: ${info.difficulty} difficulty (${info.percentage}% of section)\n`;
      }
    }
  }

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

  // Analyze weak areas
  let readingWeakTopics: string[] = [];
  let mathWeakTopics: string[] = [];
  
  if (satData.sectionInfo) {
    // For Reading and Writing, find topics with Hard difficulty
    if (satData.sectionInfo['Reading and Writing']) {
      readingWeakTopics = Object.entries(satData.sectionInfo['Reading and Writing'])
        .filter(([_, info]) => info.difficulty === 'Hard' || incorrectRWCount > 5)
        .map(([topic, _]) => topic);
    }
    
    // For Math, find topics with Hard difficulty
    if (satData.sectionInfo['Math']) {
      mathWeakTopics = Object.entries(satData.sectionInfo['Math'])
        .filter(([_, info]) => info.difficulty === 'Hard' || incorrectMathCount > 5)
        .map(([topic, _]) => topic);
    }
  }
  
  // If we couldn't determine weak topics from section info, use default distribution
  if (readingWeakTopics.length === 0) {
    readingWeakTopics = ['Information and Ideas', 'Expression of Ideas', 'Craft and Structure', 'Standard English Conventions'];
  }
  
  if (mathWeakTopics.length === 0) {
    mathWeakTopics = ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'];
  }

  // Distribution of questions based on where student needs more practice
  const rwQuestions = incorrectRWCount > 0 ? Math.ceil((incorrectRWCount / (incorrectRWCount + incorrectMathCount)) * 10) : 0;
  const mathQuestions = 10 - rwQuestions;

  prompt += `\nBased on the student's performance, please create:
${rwQuestions > 0 ? `- ${rwQuestions} Reading and Writing questions focusing on: ${readingWeakTopics.join(', ')}` : ''}
${rwQuestions > 0 && mathQuestions > 0 ? '\n' : ''}${mathQuestions > 0 ? `- ${mathQuestions} Math questions focusing on: ${mathWeakTopics.join(', ')}` : ''}

For Reading and Writing questions, cover these difficult topic areas:
- Information and Ideas (comprehending texts, locating information)
- Expression of Ideas (development, organization, effective language use)
- Craft and Structure (word choice, text structure, point of view)
- Standard English Conventions (grammar, usage, mechanics)

For Math questions, cover these topic areas:
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
1. Focus on the student's weak areas identified in the SAT report.
2. For Reading questions: Create multiple-choice questions similar to those in SAT Reading.
3. For Math questions: Create both multiple-choice and student-produced response questions (grid-ins).
4. All questions should be original and at appropriate SAT difficulty level.
5. Include high-quality explanations that teach the concept.
6. Ensure questions reflect real SAT format and content.
7. ENSURE THE RESPONSE IS VALID JSON that can be parsed with JSON.parse().

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
  // Create varied questions for each topic based on the index
  if (section === 'Reading and Writing') {
    if (topic === 'Information and Ideas') {
      // Information and Ideas question variants
      const questions = [
        {
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
        },
        {
          id: `rw-info-${Date.now()}-${index}`,
          text: "Which detail from the passage best supports the author's claim about climate impacts?",
          topic: "Information and Ideas",
          difficulty: "Hard",
          options: [
            "The statistical analysis of temperature changes over fifty years",
            "The quotation from the environmental scientist in paragraph 3",
            "The comparison between different energy production methods",
            "The reference to the international climate agreement"
          ],
          answer: "B",
          explanation: "The quotation from the environmental scientist provides specific evidence that directly supports the author's central claim about climate impacts."
        },
        {
          id: `rw-info-${Date.now()}-${index}`,
          text: "Based on the passage, what can be inferred about the relationship between technology and sustainability?",
          topic: "Information and Ideas",
          difficulty: "Medium",
          options: [
            "Technological advancement always leads to environmental degradation",
            "Sustainability goals can be achieved without technological innovation",
            "Technology can be harnessed to address environmental challenges",
            "Environmental concerns are secondary to technological progress"
          ],
          answer: "C",
          explanation: "The passage implies that properly directed technological innovation can help address environmental challenges rather than exacerbate them."
        },
        {
          id: `rw-info-${Date.now()}-${index}`,
          text: "What conclusion about renewable energy is best supported by the data presented in the passage?",
          topic: "Information and Ideas",
          difficulty: "Medium",
          options: [
            "It is more cost-effective than fossil fuels in all contexts",
            "Its adoption is growing faster in developing countries than in industrialized nations",
            "It has the potential to significantly reduce carbon emissions",
            "It will completely replace traditional energy sources within a decade"
          ],
          answer: "C",
          explanation: "The data in the passage directly supports the conclusion that renewable energy can significantly reduce carbon emissions, without making unsupported claims about cost-effectiveness, adoption rates, or timeline predictions."
        }
      ];
      return questions[index % questions.length];
    } else if (topic === 'Expression of Ideas') {
      // Expression of Ideas question variants
      const questions = [
        {
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
        },
        {
          id: `rw-expr-${Date.now()}-${index}`,
          text: "Which revision most effectively combines these two sentences?\n'The museum opened a new exhibit. The exhibit features artifacts from ancient Egypt.'",
          topic: "Expression of Ideas",
          difficulty: "Easy",
          options: [
            "The museum opened a new exhibit and features artifacts from ancient Egypt.",
            "The museum opened a new exhibit, it features artifacts from ancient Egypt.",
            "The museum opened a new exhibit that features artifacts from ancient Egypt.",
            "The museum, opening a new exhibit, features artifacts from ancient Egypt."
          ],
          answer: "C",
          explanation: "This revision most effectively combines the sentences using a relative clause that clearly shows the relationship between the exhibit and the artifacts."
        },
        {
          id: `rw-expr-${Date.now()}-${index}`,
          text: "Which transition would best connect the ideas in these two paragraphs?",
          topic: "Expression of Ideas",
          difficulty: "Medium",
          options: [
            "Furthermore",
            "Nevertheless",
            "For example",
            "In conclusion"
          ],
          answer: "B",
          explanation: "Since the second paragraph presents a contrasting perspective to the first, 'Nevertheless' is the most appropriate transition to indicate this shift."
        },
        {
          id: `rw-expr-${Date.now()}-${index}`,
          text: "Where should this sentence be placed to best support the paragraph's main argument?\n'Recent studies have confirmed this trend across multiple demographics.'",
          topic: "Expression of Ideas",
          difficulty: "Medium",
          options: [
            "Before the topic sentence to foreshadow the argument",
            "After the first supporting point as additional evidence",
            "After the counterargument to strengthen the rebuttal",
            "At the end of the paragraph as a concluding thought"
          ],
          answer: "B",
          explanation: "Placing this sentence after the first supporting point provides additional evidence that strengthens the initial claim, creating a more compelling argument."
        }
      ];
      return questions[index % questions.length];
    } else if (topic === 'Craft and Structure') {
      // Craft and Structure question variants
      const questions = [
        {
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
        },
        {
          id: `rw-craft-${Date.now()}-${index}`,
          text: "How does the author's use of technical language in paragraph 3 affect the passage?",
          topic: "Craft and Structure",
          difficulty: "Medium",
          options: [
            "It creates distance between the reader and the subject matter",
            "It emphasizes the complexity and importance of the scientific concepts",
            "It undermines the credibility of competing theories",
            "It shifts the tone from objective to persuasive"
          ],
          answer: "B",
          explanation: "The technical language emphasizes the complexity and scientific significance of the concepts being discussed, adding depth to the author's explanation."
        },
        {
          id: `rw-craft-${Date.now()}-${index}`,
          text: "In the context of the passage, the word 'paradigm' most nearly means:",
          topic: "Craft and Structure",
          difficulty: "Medium",
          options: [
            "A contradiction or paradox",
            "An established model or pattern",
            "A temporary solution",
            "An unexpected discovery"
          ],
          answer: "B",
          explanation: "In this context, 'paradigm' refers to an established model or pattern of thinking that shapes how a field approaches problems."
        },
        {
          id: `rw-craft-${Date.now()}-${index}`,
          text: "How does the structure of the passage develop the author's argument?",
          topic: "Craft and Structure",
          difficulty: "Hard",
          options: [
            "By presenting a chronological narrative of events",
            "By comparing and contrasting different perspectives",
            "By stating a problem and then proposing solutions",
            "By making a claim and supporting it with increasingly specific evidence"
          ],
          answer: "D",
          explanation: "The passage begins with a general claim and then develops it by providing increasingly specific evidence, creating a logical progression that strengthens the argument."
        }
      ];
      return questions[index % questions.length];
    } else {
      // Standard English Conventions question variants
      const questions = [
        {
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
        },
        {
          id: `rw-conv-${Date.now()}-${index}`,
          text: "Which revision corrects the punctuation error in this sentence?\n'The committee reviewed the proposal however they requested additional information.'",
          topic: "Standard English Conventions",
          difficulty: "Medium",
          options: [
            "The committee reviewed the proposal, however they requested additional information.",
            "The committee reviewed the proposal; however, they requested additional information.",
            "The committee reviewed the proposal, however, they requested additional information.",
            "The committee reviewed the proposal however, they requested additional information."
          ],
          answer: "B",
          explanation: "When 'however' joins two independent clauses, it should be preceded by a semicolon and followed by a comma to properly separate the clauses."
        },
        {
          id: `rw-conv-${Date.now()}-${index}`,
          text: "Which choice correctly uses the apostrophe?",
          topic: "Standard English Conventions",
          difficulty: "Easy",
          options: [
            "The dog wagged it's tail excitedly.",
            "The companies' new policy affected all employees.",
            "The children's toys were scattered across the floor's.",
            "The building's' entrance was being renovated."
          ],
          answer: "B",
          explanation: "This option correctly uses the apostrophe after 'companies' to show possession by multiple companies (plural possessive)."
        },
        {
          id: `rw-conv-${Date.now()}-${index}`,
          text: "Which sentence uses parallel structure correctly?",
          topic: "Standard English Conventions",
          difficulty: "Medium",
          options: [
            "She enjoys swimming, hiking, and to ride bicycles.",
            "The candidate promised to lower taxes, creating jobs, and improving education.",
            "The professor asked students to read the chapter, take notes, and submit a summary.",
            "We can either finish the project today or waiting until tomorrow."
          ],
          answer: "C",
          explanation: "This sentence correctly maintains parallel structure by using the same verb form (infinitive) for all three actions: 'to read,' 'take,' and 'submit.'"
        }
      ];
      return questions[index % questions.length];
    }
  } else {
    if (topic === 'Algebra') {
      // Algebra question variants
      const questions = [
        {
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
        },
        {
          id: `math-alg-${Date.now()}-${index}`,
          text: "Solve for x: 2x - 5 = 3x + 7",
          topic: "Algebra",
          difficulty: "Easy",
          options: [
            "x = -12",
            "x = -1",
            "x = 2",
            "x = 12"
          ],
          answer: "A",
          explanation: "2x - 5 = 3x + 7\n2x - 3x = 7 + 5\n-x = 12\nx = -12"
        },
        {
          id: `math-alg-${Date.now()}-${index}`,
          text: "Which of the following is equivalent to (x + 3)(x - 2)?",
          topic: "Algebra",
          difficulty: "Medium",
          options: [
            "x² + x - 6",
            "x² + x + 6",
            "x² + 5x - 6",
            "x² - 5x - 6"
          ],
          answer: "A",
          explanation: "(x + 3)(x - 2) = x² - 2x + 3x - 6 = x² + x - 6"
        },
        {
          id: `math-alg-${Date.now()}-${index}`,
          text: "If 3(2x - 4) = 18, what is the value of x?",
          topic: "Algebra",
          difficulty: "Easy",
          options: [
            "1",
            "3", 
            "4",
            "5"
          ],
          answer: "D",
          explanation: "3(2x - 4) = 18\n6x - 12 = 18\n6x = 30\nx = 5"
        }
      ];
      return questions[index % questions.length];
    } else if (topic === 'Advanced Math') {
      // Advanced Math question variants
      const questions = [
        {
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
        },
        {
          id: `math-adv-${Date.now()}-${index}`,
          text: "If log₃(x) = 4, what is the value of x?",
          topic: "Advanced Math",
          difficulty: "Medium",
          options: [
            "12",
            "64",
            "81",
            "243"
          ],
          answer: "C",
          explanation: "If log₃(x) = 4, then 3⁴ = x. So x = 3⁴ = 81."
        },
        {
          id: `math-adv-${Date.now()}-${index}`,
          text: "Which of the following is equivalent to sin²(θ) + cos²(θ)?",
          topic: "Advanced Math",
          difficulty: "Medium",
          options: [
            "0",
            "1",
            "tan²(θ)",
            "2sin(θ)cos(θ)"
          ],
          answer: "B",
          explanation: "By the Pythagorean identity, sin²(θ) + cos²(θ) = 1 for all values of θ."
        },
        {
          id: `math-adv-${Date.now()}-${index}`,
          text: "What is the solution to the equation e^(2x) = 10?",
          topic: "Advanced Math",
          difficulty: "Hard",
          options: [
            "x = ln(5)",
            "x = ln(10)/2",
            "x = 2ln(10)",
            "x = ln(√10)"
          ],
          answer: "B",
          explanation: "e^(2x) = 10\n2x = ln(10)\nx = ln(10)/2"
        }
      ];
      return questions[index % questions.length];
    } else if (topic === 'Problem-Solving and Data Analysis') {
      // Problem-Solving question variants
      const questions = [
        {
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
        },
        {
          id: `math-data-${Date.now()}-${index}`,
          text: "A coffee shop sells medium coffees for $3.50 and large coffees for $4.25. If the shop sold a total of 150 coffees and collected $573.75, how many large coffees were sold?",
          topic: "Problem-Solving and Data Analysis",
          difficulty: "Medium",
          options: [
            "55",
            "75",
            "85",
            "95"
          ],
          answer: "B",
          explanation: "Let x = number of large coffees and 150 - x = number of medium coffees.\n4.25x + 3.50(150 - x) = 573.75\n4.25x + 525 - 3.50x = 573.75\n0.75x = 48.75\nx = 65"
        },
        {
          id: `math-data-${Date.now()}-${index}`,
          text: "The scatterplot shows the relationship between study time and test scores for 20 students. Based on the line of best fit, what is the predicted test score for a student who studies for 3 hours?",
          topic: "Problem-Solving and Data Analysis",
          difficulty: "Medium",
          options: [
            "72",
            "78",
            "84",
            "90"
          ],
          answer: "C",
          explanation: "Using the equation of the line of best fit, y = 6x + 66, where x is hours studied and y is the test score: y = 6(3) + 66 = 18 + 66 = 84."
        },
        {
          id: `math-data-${Date.now()}-${index}`,
          text: "If the mean of a data set is 15 and the standard deviation is 3, approximately what percentage of the data falls within one standard deviation of the mean, assuming the data is normally distributed?",
          topic: "Problem-Solving and Data Analysis",
          difficulty: "Hard",
          options: [
            "50%",
            "68%",
            "95%",
            "99.7%"
          ],
          answer: "B",
          explanation: "According to the empirical rule for normal distributions, approximately 68% of the data falls within one standard deviation of the mean (between 12 and 18 in this case)."
        }
      ];
      return questions[index % questions.length];
    } else {
      // Geometry question variants
      const questions = [
        {
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
        },
        {
          id: `math-geo-${Date.now()}-${index}`,
          text: "What is the area of a circle with radius 6 cm?",
          topic: "Geometry and Trigonometry",
          difficulty: "Medium",
          options: [
            "12π cm²",
            "36π cm²",
            "72π cm²",
            "144π cm²"
          ],
          answer: "B",
          explanation: "The area of a circle is A = πr². With r = 6 cm, the area is A = π(6)² = 36π cm²."
        },
        {
          id: `math-geo-${Date.now()}-${index}`,
          text: "If sin(θ) = 3/5, what is the value of cos(θ)?",
          topic: "Geometry and Trigonometry",
          difficulty: "Medium",
          options: [
            "3/5",
            "4/5",
            "5/3",
            "5/4"
          ],
          answer: "B",
          explanation: "Using the Pythagorean identity sin²(θ) + cos²(θ) = 1:\ncos²(θ) = 1 - sin²(θ) = 1 - (3/5)² = 1 - 9/25 = 16/25\ncos(θ) = √(16/25) = 4/5 (positive, assuming θ is in the first quadrant)"
        },
        {
          id: `math-geo-${Date.now()}-${index}`,
          text: "A rectangular prism has dimensions 3 cm × 4 cm × 5 cm. What is its volume?",
          topic: "Geometry and Trigonometry",
          difficulty: "Easy",
          options: [
            "12 cm³",
            "47 cm³",
            "60 cm³",
            "120 cm³"
          ],
          answer: "C",
          explanation: "The volume of a rectangular prism is V = l × w × h. With l = 3 cm, w = 4 cm, and h = 5 cm, the volume is V = 3 × 4 × 5 = 60 cm³."
        }
      ];
      return questions[index % questions.length];
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