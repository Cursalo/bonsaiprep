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

// Use environment variable for API key but rename it to be more generic
const ANALYSIS_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// Update the API URL to use gemini-1.5-flash-latest model to match geminiPdfService
const ANALYSIS_API_URL = process.env.REACT_APP_GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

// Function to simulate processing delay
const addProcessingDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Converts a File object to a base64 string and formats it for the Gemini API.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]); // Get only base64 part
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      mimeType: file.type,
      data: base64EncodedData
    }
  };
};

/**
 * Creates a prompt for the analysis engine to generate SAT practice questions from a PDF file.
 */
const createAnalysisPromptForFile = (): string => {
  return `You are an expert SAT tutor. Please analyze the content of the provided SAT score report PDF.
The SAT has two main sections: Reading and Writing, and Math.
The Reading and Writing section covers these topics: Information and Ideas, Expression of Ideas, Craft and Structure, Standard English Conventions.
The Math section covers these topics: Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry.

Based on your analysis of the student\'s performance in the PDF:
1. Identify the student\'s weak areas (topics where they likely struggled or got questions incorrect, or topics marked as \'Hard\' difficulty).
2. Generate 10 unique SAT practice questions tailored to these identified weak areas. Aim for a mix of topics based on the weaknesses.
3. For each question, provide:
    - The question text itself.
    - The specific SAT topic it relates to (from the lists above).
    - A difficulty level (Easy, Medium, Hard).
    - Four plausible multiple-choice options (labeled A, B, C, D).
    - The correct answer (clearly indicating the letter and the text of the option).
    - A concise explanation for why that answer is correct.

Return the output ONLY as a minified JSON array of objects. Each object in the array should represent a single question and strictly follow this structure:
[
  {
    "id": "unique_id_1", // Generate a unique ID for each question
    "text": "Question text...",
    "topic": "Specific SAT Topic",
    "difficulty": "Medium",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": "A) Option A text",
    "explanation": "Explanation why A is correct..."
  }
  // ... (9 more questions)
]

Do not include any other text, greetings, or apologies in your response. Just the JSON.
The ID for each question should be unique.
`;
};

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
  if (data.totalQuestions === 0 && (data.sections['Reading and Writing'].total > 0 || data.sections['Math'].total > 0) ) {
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
 * Creates a prompt for the analysis engine to generate SAT practice questions
 */
const createAnalysisPrompt = (satData: SATTestData): string => {
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
 * Calls the external API to generate content
 */
const callContentAPI = async (prompt: string): Promise<string> => {
  if (!ANALYSIS_API_KEY) {
    console.error("API key is not configured.");
    throw new Error("API key not configured. Please set REACT_APP_GEMINI_API_KEY.");
  }

  try {
    const response = await fetch(`${ANALYSIS_API_URL}?key=${ANALYSIS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.6, 
          maxOutputTokens: 8192,
        },
        // safetySettings: [ // Optional: Adjust safety settings
        //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        //   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        //   { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        //   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        // ]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Content API request failed:", response.status, errorBody);
      throw new Error(`Content API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      console.error("Prompt was blocked:", data.promptFeedback.blockReason, data.promptFeedback.safetyRatings);
      throw new Error(`Content generation blocked: ${data.promptFeedback.blockReason}. Check safety ratings.`);
    }
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
      console.error("Unexpected API response structure:", data);
      // Attempt to find text in a potentially different location for some models/errors
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].executablePart && data.candidates[0].content.parts[0].executablePart.toolResponse) {
        // This case might occur if the API tries to use a tool and fails.
        // The actual error message or response might be nested.
        const toolResponse = data.candidates[0].content.parts[0].executablePart.toolResponse;
        console.warn("API response suggests a tool usage issue or different structure:", toolResponse);
        // Try to extract something meaningful if possible, or rely on the fallback
      }
      throw new Error("Unexpected response structure from Content API.");
    }
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Content API:", error);
    throw error; 
  }
};

/**
 * Extracts structured question data from the API response
 */
const extractQuestionsFromResponse = (response: string): GeneratedQuestion[] => {
  if (!response || response.trim() === "") {
    console.warn("Empty response string received for question extraction.");
    return [];
  }

  let cleanedResponse = response;
  if (cleanedResponse.startsWith("```json")) {
    cleanedResponse = cleanedResponse.substring(7);
  } else if (cleanedResponse.startsWith("```")) {
    cleanedResponse = cleanedResponse.substring(3);
  }
  if (cleanedResponse.endsWith("```")) {
    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
  }
  cleanedResponse = cleanedResponse.trim();

  try {
    const questions: GeneratedQuestion[] = JSON.parse(cleanedResponse);
    if (!Array.isArray(questions)) {
      console.error("Parsed response is not an array:", questions);
      return []; // Return empty if not an array
    }
    return questions.map((q, index) => ({ // Add basic validation and default ID
      ...q,
      id: q.id || `gen_q_${Date.now()}_${index}`,
      // Ensure essential fields are at least present as empty strings if missing
      text: q.text || "Question text missing",
      topic: q.topic || "Topic missing",
      options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      answer: q.answer || "Answer missing",
      explanation: q.explanation || "Explanation missing",
      difficulty: q.difficulty || "Medium"
    })).filter(q => q.text !== "Question text missing" && q.topic !== "Topic missing"); // Filter out truly empty questions
  } catch (error) {
    console.error("Error parsing JSON response from Content API:", error);
    console.error("Problematic response string (first 500 chars):", cleanedResponse.substring(0, 500));
    return []; // Return empty on parsing error
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
  console.log("Attempting to generate questions for text:", extractedMistakesText.substring(0, 100) + "...");
  
  const randomDelay = Math.random() * 1500 + 2500; // 2.5s to 4s
  await addProcessingDelay(randomDelay);

  if (!ANALYSIS_API_KEY) {
    console.warn("API key not configured. Generating fallback questions.");
    return generateFallbackQuestions(extractedMistakesText);
  }

  if (!extractedMistakesText || extractedMistakesText.trim() === "") {
    console.warn("No text provided for question generation. Generating fallback questions.");
    return generateFallbackQuestions("No report data provided.");
  }

  try {
    console.log("Parsing text report and generating prompt...");
    const satData = parseSATReport(extractedMistakesText);
    const prompt = createAnalysisPrompt(satData);
    
    // console.log("Generated Prompt:", prompt); // For debugging
    const analysisResponseJson = await callContentAPI(prompt);
    // console.log("Raw API JSON Response:", analysisResponseJson); // For debugging

    console.log("Received API response, extracting questions...");
    const questions = extractQuestionsFromResponse(analysisResponseJson);
    
    if (questions.length === 0) {
        console.warn("No questions could be extracted from API response. Generating fallback questions.");
        return generateFallbackQuestions(extractedMistakesText, 10, "Failed to parse questions from analysis response.");
    }
    
    console.log(`Successfully generated ${questions.length} questions via API.`);
    return questions;

  } catch (error) {
    console.error("Error in question generation pipeline:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return generateFallbackQuestions(extractedMistakesText, 10, errorMessage);
  }
};

/**
 * Generates very basic questions as a last resort
 */
const generateBasicQuestions = (): GeneratedQuestion[] => {
  console.log("Generating basic fallback questions");
  
  const questions: GeneratedQuestion[] = [];
  const topics = [
    'Reading Comprehension', 
    'Grammar', 
    'Algebra', 
    'Geometry',
    'Data Analysis'
  ];
  
  for (let i = 0; i < 10; i++) {
    const topic = topics[i % topics.length];
    questions.push({
      id: `basic-question-${Date.now()}-${i}`,
      text: `Sample ${topic} question ${i+1}. This is a placeholder question created because the report analysis couldn't generate specific questions.`,
      topic,
      difficulty: 'Medium',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      explanation: 'This is a placeholder explanation. The actual AI-generated questions would include detailed explanations.'
    });
  }
  
  return questions;
};

/**
 * Generates a question for a specific topic
 */
const generateQuestionForTopic = (section: string, topic: string, index: number): GeneratedQuestion => {
  const uniqueId = `fallback_${topic.replace(/\s+/g, '').toLowerCase()}_${index}_${Date.now()}`;
  let questionText = `This is a sample question for ${topic}.`;
  let options = ["Option A", "Option B", "Option C", "Option D"];
  let answer = "A) Option A";
  let explanation = `This is a placeholder explanation for ${topic}. In a real scenario, this would detail why Option A is correct.`;
  let difficulty = "Medium";

  // Customize based on topic
  if (topic === "Algebra") {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) - 5; 
    const c_val = Math.floor(Math.random() * 10) - 5;
    const x_val = Math.floor(Math.random() * 5) + 1;
    const result = a * (x_val*x_val) + b * x_val + c_val;
    questionText = `If f(x) = ${a}x² ${b === 0 ? '' : (b > 0 ? `+ ${b}x ` : `- ${Math.abs(b)}x `)}${c_val === 0 ? '' : (c_val > 0 ? `+ ${c_val}` : `- ${Math.abs(c_val)}`)}, what is the value of f(${x_val})?`;
    const wrongOptionsAdv = [
        result + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*3)+1),
        result + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*5)+1),
        a * x_val + b + c_val 
    ];
    let tempOptionsAdv = [result, ...wrongOptionsAdv.filter((v, i, self) => self.indexOf(v) === i && v !== result)];
    while(tempOptionsAdv.length < 4) { tempOptionsAdv.push(result + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*10)+6)); tempOptionsAdv = tempOptionsAdv.filter((v, i, self) => self.indexOf(v) === i); }

    options = tempOptionsAdv.slice(0,4).sort((n1,n2) => n1 - n2).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`);
    const correctOptAdv = options.find(opt => parseInt(opt.substring(3)) === result);
    answer = correctOptAdv!;
    explanation = `Substitute x = ${x_val} into the function: f(${x_val}) = ${a}(${x_val})² + ${b}(${x_val}) + ${c_val} = ${a*x_val*x_val} + ${b*x_val} + ${c_val} = ${result}.`;
    difficulty = (a > 5 || Math.abs(x_val) > 10) ? "Hard" : "Medium";
  } else if (topic === "Standard English Conventions") {
    const sentences = [
      { q: "Its time for ___ dinner.", o: ["their", "there", "they're"], correct: "their", expl: "'Their' is a possessive pronoun. 'There' indicates a place. 'They're' is a contraction for 'they are'." },
      { q: "The cat chased ___ tail.", o: ["it's", "it", "its'"], correct: "its", expl: "'Its' is the possessive form of 'it'. 'It's' is a contraction for 'it is'." },
      { q: "___ going to the park later?", o: ["Whose", "Who", "Whom"], correct: "Who's", expl: "'Who's' is a contraction for 'who is' or 'who has'. 'Whose' is possessive." }
    ];
    const selected = sentences[index % sentences.length];
    questionText = `Choose the correct word to complete the sentence: "${selected.q}"`;
    const tempOptions = [selected.correct, ...selected.o];
    options = tempOptions.sort(() => Math.random() - 0.5).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`);
    const correctOpt = options.find(opt => opt.includes(selected.correct));
    answer = correctOpt!;
    explanation = selected.expl;
    difficulty = "Easy";
  } else if (topic === "Information and Ideas") {
    questionText = "Based on a provided passage (not shown here), what is the main idea?";
    options = ["A) Specific detail 1", "B) The overarching theme", "C) A supporting argument", "D) An irrelevant point"].map((opt, i) => `${String.fromCharCode(65+i)}) ${opt.substring(3)}`);
    answer = "B) The overarching theme";
    explanation = "The main idea captures the central point or message of the passage, not just a detail or supporting argument.";
    difficulty = "Medium";
  } else if (topic === "Craft and Structure") {
     questionText = "A hypothetical author uses a specific metaphor in a passage (not shown). What is the most likely purpose of this metaphor?";
     options = ["A) To confuse the reader", "B) To provide literal information", "C) To create a vivid image or comparison", "D) To summarize the plot"].map((opt, i) => `${String.fromCharCode(65+i)}) ${opt.substring(3)}`);
     answer = "C) To create a vivid image or comparison";
     explanation = "Metaphors are figures of speech used to make comparisons and add depth or imagery, not typically for literal information or confusion.";
     difficulty = "Hard";
  } else if (topic === "Expression of Ideas") {
    questionText = "Which of the following sentences most effectively combines two short, choppy sentences (not provided) into one fluent sentence?";
    options = ["A) A poorly combined sentence with redundancy.", "B) A run-on sentence.", "C) A concise and grammatically correct combination.", "D) A sentence that loses original meaning."].map((opt, i) => `${String.fromCharCode(65+i)}) ${opt.substring(3)}`);
    answer = "C) A concise and grammatically correct combination.";
    explanation = "Effective sentence combination improves flow, maintains clarity, and is grammatically sound, avoiding issues like redundancy or run-ons.";
    difficulty = "Medium";
  } else if (topic === "Advanced Math") {
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 10) - 5; 
    const c_val = Math.floor(Math.random() * 10) - 5;
    const x_val = Math.floor(Math.random() * 5) + 1;
    const result = a * (x_val*x_val) + b * x_val + c_val;
    questionText = `If f(x) = ${a}x² ${b === 0 ? '' : (b > 0 ? `+ ${b}x ` : `- ${Math.abs(b)}x `)}${c_val === 0 ? '' : (c_val > 0 ? `+ ${c_val}` : `- ${Math.abs(c_val)}`)}, what is the value of f(${x_val})?`;
    const wrongOptionsAdv = [
        result + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*3)+1),
        result + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*5)+1),
        a * x_val + b + c_val 
    ];
    let tempOptionsAdv = [result, ...wrongOptionsAdv.filter((v, i, self) => self.indexOf(v) === i && v !== result)];
    while(tempOptionsAdv.length < 4) { tempOptionsAdv.push(result + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*10)+6)); tempOptionsAdv = tempOptionsAdv.filter((v, i, self) => self.indexOf(v) === i); }

    options = tempOptionsAdv.slice(0,4).sort((n1,n2) => n1 - n2).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`);
    const correctOptAdv = options.find(opt => parseInt(opt.substring(3)) === result);
    answer = correctOptAdv!;
    explanation = `Substitute x = ${x_val} into the function: f(${x_val}) = ${a}(${x_val})² + ${b}(${x_val}) + ${c_val} = ${a*x_val*x_val} + ${b*x_val} + ${c_val} = ${result}.`;
    difficulty = "Hard";
  } else if (topic === "Problem-Solving and Data Analysis") {
    const dataSet = Array.from({length: 5}, () => Math.floor(Math.random() * 20) + 1);
    const mean = dataSet.reduce((sum, val) => sum + val, 0) / dataSet.length;
    questionText = `What is the mean of the following data set: ${dataSet.join(', ')}?`;
    const wrongOptionsPSA = [
        parseFloat((mean + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*2)+0.5)).toFixed(1)),
        (Math as any).median(dataSet.slice().sort((a,b)=>a-b)), 
        Math.max(...dataSet) 
    ];
    let tempOptionsPSA = [parseFloat(mean.toFixed(1)), ...wrongOptionsPSA.filter((v,i,self) => self.indexOf(v) === i && v !== parseFloat(mean.toFixed(1)))];
    while(tempOptionsPSA.length < 4) { tempOptionsPSA.push(parseFloat((mean + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*3)+1.5)).toFixed(1))); tempOptionsPSA = tempOptionsPSA.filter((v,i,self) => self.indexOf(v) === i); }
    
    options = tempOptionsPSA.slice(0,4).sort((n1,n2) => n1 - n2).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`);
    const correctOptPSA = options.find(opt => parseFloat(opt.substring(3)) === parseFloat(mean.toFixed(1)));
    answer = correctOptPSA!;
    explanation = `To find the mean, sum all the numbers and divide by the count. Sum = ${dataSet.reduce((s,v)=>s+v,0)}. Count = ${dataSet.length}. Mean = ${dataSet.reduce((s,v)=>s+v,0)}/${dataSet.length} = ${mean.toFixed(1)}.`;
    difficulty = "Medium";
  } else if (topic === "Geometry and Trigonometry") {
    const sideA = Math.floor(Math.random() * 10) + 3;
    const sideB = Math.floor(Math.random() * 10) + 3;
    const area = sideA * sideB;
    questionText = `A rectangle has a length of ${sideA} units and a width of ${sideB} units. What is its area?`;
    const wrongOptionsGeo = [
        2 * (sideA + sideB), 
        area + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*5)+1),
        area - (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*5)+1),
    ];
    let tempOptionsGeo = [area, ...wrongOptionsGeo.filter((v,i,self) => self.indexOf(v) === i && v !== area && v > 0)];
    while(tempOptionsGeo.length < 4) { tempOptionsGeo.push(area + (Math.random() > 0.5 ? 1:-1) * (Math.floor(Math.random()*10)+6)); tempOptionsGeo = tempOptionsGeo.filter((v,i,self) => self.indexOf(v) === i && v > 0); }

    options = tempOptionsGeo.slice(0,4).sort((n1,n2) => n1 - n2).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt} square units`);
    const correctOptGeo = options.find(opt => parseInt(opt.substring(3)) === area);
    answer = correctOptGeo!;
    explanation = `The area of a rectangle is calculated by multiplying its length by its width. Area = Length × Width = ${sideA} × ${sideB} = ${area} square units.`;
    difficulty = "Easy";
  }

  return {
    id: uniqueId,
    text: questionText,
    topic: topic,
    difficulty: difficulty,
    options: options,
    answer: answer,
    explanation: explanation
  };
};

/**
 * Generates fallback questions if there's an error parsing the report or calling the API
 * @param text The original text input
 * @param count Number of questions to generate (default: 10)
 */
const generateFallbackQuestions = (contextText: string = "", count: number = 10, errorContext?: string): GeneratedQuestion[] => {
  const questions: GeneratedQuestion[] = [];
  const availableTopics: { section: string, topic: string }[] = [
    { section: "Reading and Writing", topic: "Information and Ideas" },
    { section: "Reading and Writing", topic: "Craft and Structure" },
    { section: "Reading and Writing", topic: "Expression of Ideas" },
    { section: "Reading and Writing", topic: "Standard English Conventions" },
    { section: "Math", topic: "Algebra" },
    { section: "Math", topic: "Advanced Math" },
    { section: "Math", topic: "Problem-Solving and Data Analysis" },
    { section: "Math", topic: "Geometry and Trigonometry" },
  ];

  const inferredTopics: { section: string, topic: string }[] = [];
  if (contextText) {
    availableTopics.forEach(t => {
      if (contextText.toLowerCase().includes(t.topic.toLowerCase())) {
        inferredTopics.push(t);
      }
    });
  }

  const topicsToUse = inferredTopics.length > 3 ? inferredTopics : availableTopics; // Use inferred if we get a few, else all
  
  if (errorContext && questions.length < count) {
      questions.push({
          id: `error_context_q_${Date.now()}`,
          topic: "System Feedback",
          text: `A processing issue occurred. The system reported: "${errorContext.substring(0,150)}${errorContext.length > 150 ? '...' : ''}". While we address this, would you like to try a general knowledge question? (This is a placeholder due to the error.)`,
          options: ["A) Yes, proceed with general questions", "B) No, I'll try uploading again later", "C) Report this issue", "D) Show me my score report summary"],
          answer: "A) Yes, proceed with general questions",
          explanation: "This indicates an issue with the automated question generation. Choosing 'A' allows you to continue with some practice.",
          difficulty: "N/A"
      });
  }

  for (let i = 0; questions.length < count; i++) {
    const topicDetail = topicsToUse[i % topicsToUse.length];
    questions.push(generateQuestionForTopic(topicDetail.section, topicDetail.topic, i));
  }
  
  // Shuffle to provide variety
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions.slice(0, count); // Ensure we don't exceed the count
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