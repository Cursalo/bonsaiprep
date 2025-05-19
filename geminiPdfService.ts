// src/services/geminiPdfService.ts

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

const ANALYSIS_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
// Update to use Gemini 1.5 Flash model which is optimized for document processing and file uploads
const ANALYSIS_API_URL = process.env.REACT_APP_GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

const addProcessingDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Converts a File object to a base64 string and formats it for the Gemini API.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
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

const parseSATReport = (reportText: string): SATTestData => {
  const lines = reportText.split('\n');
  const data: SATTestData = {
    sections: {
      'Reading and Writing': { correct: 0, incorrect: 0, total: 0, incorrectQuestions: [] },
      'Math': { correct: 0, incorrect: 0, total: 0, incorrectQuestions: [] }
    },
    totalCorrect: 0,
    totalIncorrect: 0,
    totalQuestions: 0,
    sectionInfo: {}
  };

  const totalQuestionsMatch = reportText.match(/(\d+)\s*Total Questions/);
  if (totalQuestionsMatch) data.totalQuestions = parseInt(totalQuestionsMatch[1]);
  const correctAnswersMatch = reportText.match(/(\d+)\s*Correct Answers/);
  if (correctAnswersMatch) data.totalCorrect = parseInt(correctAnswersMatch[1]);
  const incorrectAnswersMatch = reportText.match(/(\d+)\s*Incorrect Answers/);
  if (incorrectAnswersMatch) data.totalIncorrect = parseInt(incorrectAnswersMatch[1]);

  const sectionInfoRegex = /(Information and Ideas|Expression of Ideas|Craft and Structure|Standard English Conventions|Algebra|Advanced Math|Problem-Solving and Data Analysis|Geometry and Trigonometry)\s*\((\d+)%[^)]*\)(?:[^)]*Diﬃculty level: (Easy|Medium|Hard))?/g;
  let sectionMatch;
  while ((sectionMatch = sectionInfoRegex.exec(reportText)) !== null) {
    const topic = sectionMatch[1];
    const percentage = parseInt(sectionMatch[2]);
    const difficulty = sectionMatch[3] || "Medium";
    let mainSection = ['Information and Ideas', 'Expression of Ideas', 'Craft and Structure', 'Standard English Conventions'].includes(topic) ? 'Reading and Writing' : 'Math';
    if (!data.sectionInfo![mainSection]) data.sectionInfo![mainSection] = {};
    data.sectionInfo![mainSection][topic] = { percentage, difficulty };
  }

  const questionRegex = /^\s*(\d+)\s+(Reading and Writing|Math)\s+([A-D0-9/\., ]+)\s+([A-D0-9/\., ]+);?\s*(Correct|Incorrect)/;
  for (const line of lines) {
    const questionMatch = line.match(questionRegex);
    if (questionMatch) {
      const [_, questionNumber, section, correctAnswer, yourAnswer, status] = questionMatch;
      if (section in data.sections) {
        data.sections[section].total++;
        if (status === 'Correct') {
          data.sections[section].correct++;
        } else {
          data.sections[section].incorrect++;
          data.sections[section].incorrectQuestions.push({ questionNumber, correctAnswer: correctAnswer.trim(), yourAnswer: yourAnswer.trim() });
        }
      }
    }
  }

  if (data.totalQuestions === 0 && (data.sections['Reading and Writing'].total > 0 || data.sections['Math'].total > 0)) {
    data.totalCorrect = Object.values(data.sections).reduce((sum, s) => sum + s.correct, 0);
    data.totalIncorrect = Object.values(data.sections).reduce((sum, s) => sum + s.incorrect, 0);
    data.totalQuestions = data.totalCorrect + data.totalIncorrect;
  }
  return data;
};

const determineTopics = (section: string): string[] => {
  if (section === 'Reading and Writing') return ['Information and Ideas', 'Expression of Ideas', 'Craft and Structure', 'Standard English Conventions'];
  if (section === 'Math') return ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'];
  return ['General Knowledge'];
};

const createAnalysisPrompt = (satData: SATTestData): string => {
  let prompt = `As an expert SAT tutor, create 10 unique SAT practice questions tailored to this student's specific performance on a recent SAT practice test.

STUDENT'S SAT REPORT SUMMARY:
- Reading and Writing section: ${satData.sections['Reading and Writing'].correct} correct, ${satData.sections['Reading and Writing'].incorrect} incorrect
- Math section: ${satData.sections['Math'].correct} correct, ${satData.sections['Math'].incorrect} incorrect
- Total score: ${satData.totalCorrect} out of ${satData.totalQuestions}
`;

  if (satData.sectionInfo && Object.keys(satData.sectionInfo).length > 0) {
    prompt += `\nSECTION DIFFICULTY INFORMATION:\n`;
    for (const [section, topics] of Object.entries(satData.sectionInfo)) {
      prompt += `${section}:\n`;
      for (const [topic, info] of Object.entries(topics)) {
        prompt += `- ${topic}: ${info.difficulty} difficulty (${info.percentage}% of section)\n`;
      }
    }
  }

  const incorrectRWCount = satData.sections['Reading and Writing']?.incorrect || 0;
  if (incorrectRWCount > 0) {
    prompt += `\nREADING AND WRITING MISTAKES:\n`;
    satData.sections['Reading and Writing'].incorrectQuestions.forEach(q => {
      prompt += `- Question ${q.questionNumber}: Student answered "${q.yourAnswer}" but correct answer was "${q.correctAnswer}"\n`;
    });
  }
  const incorrectMathCount = satData.sections['Math']?.incorrect || 0;
  if (incorrectMathCount > 0) {
    prompt += `\nMATH MISTAKES:\n`;
    satData.sections['Math'].incorrectQuestions.forEach(q => {
      prompt += `- Question ${q.questionNumber}: Student answered "${q.yourAnswer}" but correct answer was "${q.correctAnswer}"\n`;
    });
  }

  let readingWeakTopics: string[] = [];
  let mathWeakTopics: string[] = [];
  if (satData.sectionInfo) {
    if (satData.sectionInfo['Reading and Writing']) {
      readingWeakTopics = Object.entries(satData.sectionInfo['Reading and Writing'])
        .filter(([_, info]) => info.difficulty === 'Hard' || incorrectRWCount / (satData.sections['Reading and Writing'].total || 1) > 0.3) // Prioritize Hard or >30% incorrect
        .map(([topic, _]) => topic);
    }
    if (satData.sectionInfo['Math']) {
      mathWeakTopics = Object.entries(satData.sectionInfo['Math'])
        .filter(([_, info]) => info.difficulty === 'Hard' || incorrectMathCount / (satData.sections['Math'].total || 1) > 0.3) // Prioritize Hard or >30% incorrect
        .map(([topic, _]) => topic);
    }
  }
  if (readingWeakTopics.length === 0 && incorrectRWCount > 0) readingWeakTopics = determineTopics('Reading and Writing');
  if (mathWeakTopics.length === 0 && incorrectMathCount > 0) mathWeakTopics = determineTopics('Math');
  
  const weakTopics = [...new Set([...readingWeakTopics, ...mathWeakTopics])]; // Unique weak topics
  let questionDistribution: { [key: string]: number } = {};
  const numQuestionsToGenerate = 10;

  if (weakTopics.length > 0) {
    let questionsPerWeakTopic = Math.floor(numQuestionsToGenerate * 0.8 / weakTopics.length); // ~80% for weak topics
    questionsPerWeakTopic = Math.max(1, questionsPerWeakTopic); // At least 1 per weak topic if possible
    let assignedQuestions = 0;
    weakTopics.forEach(topic => {
      const count = Math.min(questionsPerWeakTopic, numQuestionsToGenerate - assignedQuestions);
      if (count > 0) {
        questionDistribution[topic] = (questionDistribution[topic] || 0) + count;
        assignedQuestions += count;
      }
    });
    
    // Distribute remaining questions generally
    let remainingGeneral = numQuestionsToGenerate - assignedQuestions;
    const allTopics = [...determineTopics('Reading and Writing'), ...determineTopics('Math')];
    for (let i = 0; i < remainingGeneral; i++) {
      const topic = allTopics[i % allTopics.length];
      questionDistribution[topic] = (questionDistribution[topic] || 0) + 1;
    }
  } else { // Default distribution if no specific weak areas or too few errors
    const allTopics = [...determineTopics('Reading and Writing'), ...determineTopics('Math')];
    allTopics.forEach((topic, idx) => {
        questionDistribution[topic] = (questionDistribution[topic] || 0) + (idx < numQuestionsToGenerate % allTopics.length ? Math.floor(numQuestionsToGenerate / allTopics.length) +1 : Math.floor(numQuestionsToGenerate / allTopics.length) );
    });
  }
   // Normalize to 10 questions
  let currentTotal = Object.values(questionDistribution).reduce((sum, count) => sum + count, 0);
  const topicsInDistribution = Object.keys(questionDistribution);
  let iter = 0;
  while(currentTotal !== numQuestionsToGenerate && topicsInDistribution.length > 0 && iter < 20) { // iter limit to prevent infinite loops
      const topicToAdjust = topicsInDistribution[iter % topicsInDistribution.length];
      if (currentTotal < numQuestionsToGenerate) {
          questionDistribution[topicToAdjust]++;
          currentTotal++;
      } else if (currentTotal > numQuestionsToGenerate && questionDistribution[topicToAdjust] > 0) {
           // Try to reduce from topics that have more than 1 question, or from any if all have 1
           if (questionDistribution[topicToAdjust] > 1 || Object.values(questionDistribution).every(c => c <= 1)) {
                questionDistribution[topicToAdjust]--;
                currentTotal--;
           }
      }
      iter++;
  }


  prompt += `\nBased on this, generate questions focusing on these areas, with the following approximate distribution if possible: \n`;
  for (const [topic, count] of Object.entries(questionDistribution)) {
    if (count > 0) prompt += `- ${topic}: ${count} question(s)\n`;
  }

  prompt += `\nIMPORTANT: Generate a diverse set of questions. For each question, provide the question text, the specific topic (from the list above), difficulty level (Easy, Medium, Hard), four multiple-choice options (A, B, C, D), the correct answer (letter and text), and a concise explanation for the correct answer. The question ID should be a unique string for each question.

Return the output ONLY as a minified JSON array of objects. Each object in the array should represent a single question and strictly follow this structure:
[
  {
    "id": "unique_id_1",
    "text": "Question text...",
    "topic": "Specific Topic",
    "difficulty": "Medium",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": "A) Option A text",
    "explanation": "Explanation why A is correct..."
  }
  // ... more questions
]

Do not include any other text, greetings, or apologies in your response. Just the JSON.
`;
  return prompt;
};

/**
 * Creates a prompt for the analysis engine to generate SAT practice questions from a PDF file.
 */
const createAnalysisPromptForFile = (): string => {
  return `You are an expert SAT tutor. Please analyze the content of the provided SAT score report PDF.
The SAT has two main sections: Reading and Writing, and Math.
The Reading and Writing section covers these topics: Information and Ideas, Expression of Ideas, Craft and Structure, Standard English Conventions.
The Math section covers these topics: Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry.

Based on your analysis of the student's performance in the PDF:
1. Identify the student's weak areas (topics where they likely struggled or got questions incorrect, or topics marked as 'Hard' difficulty).
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

const callContentAPI = async (prompt: string, file?: File): Promise<string> => {
  if (!ANALYSIS_API_KEY) {
    console.error("API key is not configured.");
    throw new Error("API key not configured. Please set REACT_APP_GEMINI_API_KEY.");
  }

  const requestBody: { contents: any[]; generationConfig: any; safetySettings?: any[] } = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.6,
      maxOutputTokens: 8192,
    },
    // safetySettings: [ /* ... safety settings ... */ ]
  };

  if (file) {
    // Commenting out the warning as gemini-1.5-flash-latest is multimodal.
    // if (!ANALYSIS_API_URL.includes("gemini-2.5") && !ANALYSIS_API_URL.includes("gemini-pro-vision")) {
    //     console.warn(`The configured API URL (${ANALYSIS_API_URL}) might not be optimal for file uploads. Consider using Gemini 2.5 Flash or another multimodal model.`);
    // }
    const filePart = await fileToGenerativePart(file);
    // For multimodal requests, the structure is typically contents: [{ parts: [ {text: "prompt"}, {inlineData: ...} ] }]
    requestBody.contents = [{ parts: [{ text: prompt }, filePart] }];
  }
  
  // console.log("API Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${ANALYSIS_API_URL}?key=${ANALYSIS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Content API request (${file ? 'with file' : 'text only'}) failed:`, response.status, errorBody);
      throw new Error(`Content API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    // console.log(`Raw API Response (${file ? 'with file' : 'text only'}):`, JSON.stringify(data, null, 2));

    if (data.promptFeedback && data.promptFeedback.blockReason) {
      console.error("Prompt was blocked:", data.promptFeedback.blockReason, data.promptFeedback.safetyRatings);
      throw new Error(`Content generation blocked: ${data.promptFeedback.blockReason}. Check safety ratings.`);
    }
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
      console.error("Unexpected API response structure:", data);
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          console.log("Parts received:", data.candidates[0].content.parts);
      } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
          console.log("Candidate finish reason:", data.candidates[0].finishReason);
          if(data.candidates[0].safetyRatings) console.log("Safety Ratings:", data.candidates[0].safetyRatings);
      }
      throw new Error("Unexpected response structure from Content API. No text part found.");
    }
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(`Error calling Content API (${file ? 'with file' : 'text only'}):`, error);
    throw error;
  }
};

const extractQuestionsFromResponse = (response: string): GeneratedQuestion[] => {
  if (!response || response.trim() === "") {
    console.warn("Empty response string received for question extraction.");
    return [];
  }
  let cleanedResponse = response;
  if (cleanedResponse.startsWith("```json")) cleanedResponse = cleanedResponse.substring(7);
  if (cleanedResponse.startsWith("```")) cleanedResponse = cleanedResponse.substring(3);
  if (cleanedResponse.endsWith("```")) cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
  cleanedResponse = cleanedResponse.trim();

  // Attempt to fix common JSON issues due to unescaped characters
  let fixedForJson = cleanedResponse;
  // Specific fixes for LaTeX-like math expressions that might break JSON.parse
  fixedForJson = fixedForJson.replace(/\\\\\\\\(/g, '\\\\\\\\\\\\\\(');
  fixedForJson = fixedForJson.replace(/\\\\\\\\)/g, '\\\\\\\\\\\\\\)');
  fixedForJson = fixedForJson.replace(/\\\\\\\\[/g, '\\\\\\\\\\\\\\\\[');
  fixedForJson = fixedForJson.replace(/\\\\\\\\]/g, '\\\\\\\\\\\\\\\\]');

  try {
    let parsedJson = JSON.parse(fixedForJson);
    if (!Array.isArray(parsedJson) && typeof parsedJson === 'object' && parsedJson !== null) {
        const keys = Object.keys(parsedJson);
        if (keys.length === 1 && Array.isArray(parsedJson[keys[0]])) {
            parsedJson = parsedJson[keys[0]];
        }
    }

    if (!Array.isArray(parsedJson)) {
      console.error("Parsed response is not an array:", parsedJson);
      return [];
    }
    const questions: GeneratedQuestion[] = parsedJson;
    return questions.map((q, index) => {
      let finalAnswer = "N/A"; // Default if answer is missing or unparseable
      const currentAnswer = q.answer ? q.answer.toString().trim() : "";

      if (currentAnswer !== "") {
        // Try to extract the first single uppercase letter, possibly followed by a parenthesis or period.
        const match = currentAnswer.match(/^([A-Z])(?:[\\.\\)]|$)/i);
        if (match && match[1]) {
          finalAnswer = match[1].toUpperCase();
        } else {
          // Fallback if no direct letter match, e.g. if answer is "Option A text"
          const qOptions = Array.isArray(q.options) ? q.options : [];
          const optionMatch = qOptions.find(opt => {
            const optString = typeof opt === 'string' ? opt.trim().toLowerCase() : "";
            if (!optString) return false;
            const optPrefixMatch = optString.match(/^([a-d])[\\.\\)]/i); // Check if option starts with A), B), etc.
            if (optPrefixMatch && currentAnswer.toLowerCase().includes(optString)) {
              return true;
            }
            // Also check if the answer itself IS one of the options (exact match or near match)
            if (currentAnswer.toLowerCase() === optString) return true;
            return false;
          });

          if (optionMatch) {
            const optString = typeof optionMatch === 'string' ? optionMatch.trim() : "";
            const finalOptMatch = optString.match(/^([A-D])[\\.\\)]/i);
            if (finalOptMatch && finalOptMatch[1]) {
              finalAnswer = finalOptMatch[1].toUpperCase();
            }
          }
        }
        // If still N/A, and the answer is just a single letter A-D, use that.
        if (finalAnswer === "N/A" && /^[A-D]$/i.test(currentAnswer)) {
          finalAnswer = currentAnswer.toUpperCase();
        }
      }

      return {
        id: q.id || `gen_q_${Date.now()}_${index}`,
        text: q.text || "Question text missing",
        topic: q.topic || "Topic missing",
        difficulty: q.difficulty || "Medium",
        options: Array.isArray(q.options) && q.options.length > 0 ? q.options.map(opt => (typeof opt === 'string' ? opt.trim() : "Invalid Option")) : ["Option A", "Option B", "Option C", "Option D"],
        answer: finalAnswer,
        explanation: q.explanation || "Explanation missing",
      };
    }).filter(q => q.text !== "Question text missing" && q.topic !== "Topic missing");
  } catch (error) {
    console.error("Error parsing JSON response from Content API:", error);
    console.error("Problematic response string (first 500 chars):", cleanedResponse.substring(0, 500));
    return [];
  }
};

export const generateQuestionsFromMistakes = async (
  extractedInput: string | File
): Promise<GeneratedQuestion[]> => {
  const inputType = typeof extractedInput === 'string' ? 'string' : `File (${(extractedInput as File).name}, type: ${(extractedInput as File).type})`;
  console.log("Attempting to generate questions for input type:", inputType);

  const randomDelay = Math.random() * 2000 + 3000; // 3-5 seconds
  await addProcessingDelay(randomDelay);

  if (!ANALYSIS_API_KEY) {
    console.warn("API key not configured. Generating fallback questions.");
    return generateFallbackQuestions(typeof extractedInput === 'string' ? extractedInput : "SAT Report PDF", 10, "API Key Missing");
  }

  try {
    let analysisResponseJson: string;
    if (extractedInput instanceof File) {
      if (extractedInput.type !== "application/pdf") {
        console.error("Invalid file type. Expected PDF, got:", extractedInput.type);
        return generateFallbackQuestions("Invalid file: PDF required.", 10, "Invalid File Type");
      }
      const prompt = createAnalysisPromptForFile();
      console.log("Sending PDF and prompt to API...");
      analysisResponseJson = await callContentAPI(prompt, extractedInput);
    } else if (typeof extractedInput === 'string' && extractedInput.trim() !== "") {
      console.log("Parsing text report and generating prompt...");
      const satData = parseSATReport(extractedInput);
      const prompt = createAnalysisPrompt(satData);
      analysisResponseJson = await callContentAPI(prompt);
    } else {
      console.warn("No valid input provided. Generating fallback.");
      return generateFallbackQuestions("No report data provided.", 10, "No Input Data");
    }
    
    const questions = extractQuestionsFromResponse(analysisResponseJson);
    
    if (questions.length === 0) {
      console.warn("No questions extracted from API response. Generating fallback.");
      const errorDetail = analysisResponseJson.trim() === "" ? "Empty API response" : "Failed to parse API response";
      return generateFallbackQuestions(typeof extractedInput === 'string' ? extractedInput : "SAT Report PDF", 10, errorDetail);
    }
    
    console.log(`Successfully generated ${questions.length} questions via API.`);
    return questions;

  } catch (error) {
    console.error("Error in question generation pipeline:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during question generation.";
    return generateFallbackQuestions(typeof extractedInput === 'string' ? extractedInput : "Error processing report.", 10, errorMessage);
  }
};

// Fallback question generation
const generateBasicQuestions = (): GeneratedQuestion[] => { 
    return [
        { id: "fb_alg_1", topic: "Algebra", text: "Solve: 3x - 7 = 14", options: ["A) 7", "B) 3", "C) 21", "D) 5"], answer: "A) 7", explanation: "3x = 21, so x = 7." },
        { id: "fb_rw_1", topic: "Standard English Conventions", text: "Which is correct: 'They're going to ___ car.'?", options: ["A) there", "B) their", "C) its", "D) they"], answer: "B) their", explanation: "'Their' is possessive." }
    ];
};

if (typeof (Math as any).median === 'undefined') {
  (Math as any).median = (arr: number[]) => {
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  };
}

const generateQuestionForTopic = (section: string, topic: string, index: number): GeneratedQuestion => {
  const uniqueId = `fallback_${topic.replace(/\s+/g, '').toLowerCase()}_${index}_${Date.now()}`;
  let questionText = `This is a sample question for ${topic}.`;
  let options = ["Option A", "Option B", "Option C", "Option D"];
  let answer = "A) Option A";
  let explanation = `This is a placeholder explanation for ${topic}. In a real scenario, this would detail why Option A is correct.`;
  let difficulty = "Medium";

  if (topic === "Algebra") {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const c = a * (Math.floor(Math.random() * 5) + 1) + b; 
    const x = (c - b) / a;
    questionText = `Solve for x: ${a}x + ${b} = ${c}`;
    const wrongOptions = [x + 1, x - 1, x + 2].filter(val => val !== x);
     while (wrongOptions.length < 3) wrongOptions.push(x + wrongOptions.length + 3); 
    const tempOptions = [x.toString(), ...wrongOptions.slice(0,3).map(wo => wo.toString())];
    options = tempOptions.sort(() => Math.random() - 0.5).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`);
    answer = options.find(opt => opt.includes(`${x}`))!;
    explanation = `To solve for x: \n1. Subtract ${b} from both sides: ${a}x = ${c - b}. \n2. Divide by ${a}: x = ${(c - b) / a}. \nSo, x = ${x}.`;
    difficulty = (a > 5 || Math.abs(x) > 10) ? "Hard" : "Medium";
  } else if (topic === "Standard English Conventions") {
    const grammarRules = [
      { q: "Its time for ____ nap.", choices: ["its", "it's", "their"], correct: "its", expl: "'Its' is possessive. 'It's' means 'it is'. 'Their' is plural possessive." },
      { q: "____ are many ways to solve this problem.", choices: ["There", "Their", "They're"], correct: "There", expl: "'There' indicates existence or place. 'Their' is possessive. 'They're' means 'they are'." },
      { q: "She did ____ homework meticulously.", choices: ["her", "hers", "she's"], correct: "her", expl: "'Her' is a possessive pronoun used before a noun." }
    ];
    const selected = grammarRules[index % grammarRules.length];
    questionText = `Choose the correct word: "${selected.q}"`;
    const tempOptions = [selected.correct, ...selected.choices.filter(c => c !== selected.correct)];
    options = tempOptions.sort(() => Math.random() - 0.5).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`);
    answer = options.find(opt => opt.includes(selected.correct))!;
    explanation = selected.expl;
    difficulty = "Easy";
  } else if (topic === "Information and Ideas") {
    questionText = "Which of the following best describes the main idea of a hypothetical passage about renewable energy sources?";
    options = ["A) Solar panels are expensive.", "B) Wind turbines can be noisy.", "C) Renewable energy offers environmental and economic benefits despite challenges.", "D) Fossil fuels are finite."].map((opt, i) => `${String.fromCharCode(65+i)}) ${opt.substring(3)}`);
    answer = "C) Renewable energy offers environmental and economic benefits despite challenges.";
    explanation = "The main idea usually encompasses a broader summary including benefits and acknowledging downsides, rather than focusing on a single specific detail.";
    difficulty = "Medium";
  } else if (topic === "Advanced Math") {
    const coeff = [Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 5) -2, Math.floor(Math.random()*5)-2]; 
    const xVal = Math.floor(Math.random()*3)+1;
    const fx = coeff[0]*xVal*xVal + coeff[1]*xVal + coeff[2];
    questionText = `If f(x) = ${coeff[0]}x² ${coeff[1] >= 0 ? '+': ''}${coeff[1]}x ${coeff[2] >= 0 ? '+': ''}${coeff[2]}, what is f(${xVal})?`;
    const wrongOpts = [fx+1, fx-1, fx+2].filter(v => v !== fx);
    const tempOpts = [fx, ...wrongOpts.slice(0,3)];
    options = tempOpts.sort((a,b)=>a-b).map((opt,i) => `${String.fromCharCode(65+i)}) ${opt}`);
    answer = options.find(opt => parseInt(opt.substring(3)) === fx)!;
    explanation = `Substitute x=${xVal}: f(${xVal}) = ${coeff[0]}(${xVal})² + ${coeff[1]}(${xVal}) + ${coeff[2]} = ${fx}.`;
    difficulty = "Hard";
  }

  return { id: uniqueId, text: questionText, topic: topic, difficulty: difficulty, options: options, answer: answer, explanation: explanation };
};

const generateFallbackQuestions = (contextText: string = "", count: number = 10, errorContext?: string): GeneratedQuestion[] => {
  const questions: GeneratedQuestion[] = [];
  const availableTopics: { section: string, topic: string }[] = [
    { section: "Reading and Writing", topic: "Information and Ideas" }, { section: "Reading and Writing", topic: "Craft and Structure" },
    { section: "Reading and Writing", topic: "Expression of Ideas" }, { section: "Reading and Writing", topic: "Standard English Conventions" },
    { section: "Math", topic: "Algebra" }, { section: "Math", topic: "Advanced Math" },
    { section: "Math", topic: "Problem-Solving and Data Analysis" }, { section: "Math", topic: "Geometry and Trigonometry" },
  ];

  let topicsToUse = availableTopics;
  if (contextText) {
    const inferred = availableTopics.filter(t => contextText.toLowerCase().includes(t.topic.toLowerCase()));
    if (inferred.length > 2) topicsToUse = inferred;
  }
  
  if (errorContext && questions.length < count) {
    questions.push({
      id: `error_ctx_q_${Date.now()}`, topic: "System Feedback",
      text: `A processing issue occurred (${errorContext.substring(0,100)}${errorContext.length>100?'...':''}). Try a general question?`,
      options: ["A) Yes", "B) No, try again later"], answer: "A) Yes",
      explanation: "This indicates an issue. Choosing 'A' allows some practice.", difficulty: "N/A"
    });
  }

  for (let i = 0; questions.length < count; i++) {
    const topicDetail = topicsToUse[i % topicsToUse.length];
    questions.push(generateQuestionForTopic(topicDetail.section, topicDetail.topic, questions.length));
  }
  
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions.slice(0, count);
}; 