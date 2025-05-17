import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { skillsAPI } from '../services/api';

export interface Skill {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  mastered: boolean;
  masteryLevel: number;
}

interface SkillsContextType {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  totalSkills: number;
  categories: string[];
  updateSkillProgress: (skillId: string, progress: number) => void;
  masteredSkillsCount: number;
}

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const useSkills = () => {
  const context = useContext(SkillsContext);
  if (context === undefined) {
    throw new Error('useSkills must be used within a SkillsProvider');
  }
  return context;
};

interface SkillsProviderProps {
  children: ReactNode;
}

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // For testing purposes - if we're in development mode and there's no API response, use mock data
  const useMockData = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        if (!useMockData) {
          try {
            const response = await skillsAPI.getSkills();
            setSkills(response);
            setLoading(false);
            return;
          } catch (err) {
            console.log('API fetch failed, using mock data instead');
          }
        }
        
        // If API fetch fails or we're in development, use mock data
        // This is temporary for development purposes
        setSkills(mockSkills);
        setLoading(false);
      } catch (err) {
        setError('Failed to load skills data');
        setLoading(false);
        console.error('Error fetching skills:', err);
      }
    };

    fetchSkills();
  }, [useMockData]);

  // Derived values
  const totalSkills = mockSkills.length;
  const masteredSkillsCount = skills.filter(skill => skill.mastered).length;
  const categories = [...new Set(skills.map(skill => skill.category))];

  // Function to update a skill's progress
  const updateSkillProgress = (skillId: string, progress: number) => {
    setSkills(prevSkills => 
      prevSkills.map(skill => 
        skill.id === skillId 
          ? { 
              ...skill, 
              masteryLevel: progress,
              mastered: progress >= 80 // Consider mastered if progress is 80% or higher
            } 
          : skill
      )
    );
  };

  return (
    <SkillsContext.Provider 
      value={{ 
        skills, 
        loading, 
        error, 
        totalSkills, 
        categories,
        updateSkillProgress,
        masteredSkillsCount 
      }}
    >
      {children}
    </SkillsContext.Provider>
  );
};

// Mock skills data for development
const mockSkills: Skill[] = [
  {
    id: "sec-pun-comma",
    name: "Using Commas Correctly",
    category: "Standard English Conventions",
    subcategory: "Punctuation",
    description: "Using commas to separate items in a list, join independent clauses, and set off introductory elements.",
    mastered: true,
    masteryLevel: 90
  },
  {
    id: "sec-pun-semi",
    name: "Semicolon Usage",
    category: "Standard English Conventions",
    subcategory: "Punctuation",
    description: "Using semicolons to join related independent clauses and in lists with internal commas.",
    mastered: false,
    masteryLevel: 60
  },
  {
    id: "sec-gram-agree",
    name: "Subject-Verb Agreement",
    category: "Standard English Conventions",
    subcategory: "Grammar",
    description: "Ensuring subjects and verbs agree in number (singular/plural).",
    mastered: true,
    masteryLevel: 85
  },
  {
    id: "sec-gram-tense",
    name: "Verb Tense Consistency",
    category: "Standard English Conventions",
    subcategory: "Grammar",
    description: "Maintaining consistent verb tenses within and across sentences.",
    mastered: false,
    masteryLevel: 45
  },
  {
    id: "sec-sent-run",
    name: "Fixing Run-on Sentences",
    category: "Standard English Conventions",
    subcategory: "Sentence Structure",
    description: "Identifying and correcting run-on sentences and comma splices.",
    mastered: false,
    masteryLevel: 30
  },
  {
    id: "sec-sent-frag",
    name: "Sentence Fragments",
    category: "Standard English Conventions",
    subcategory: "Sentence Structure",
    description: "Identifying and correcting sentence fragments.",
    mastered: true,
    masteryLevel: 95
  },
  {
    id: "expr-evid-data",
    name: "Data Interpretation",
    category: "Expression of Ideas",
    subcategory: "Evidence",
    description: "Analyzing and interpreting data presented in tables, graphs, and charts.",
    mastered: false,
    masteryLevel: 70
  },
  {
    id: "expr-evid-support",
    name: "Evidence-Based Claims",
    category: "Expression of Ideas",
    subcategory: "Evidence",
    description: "Evaluating the relevance and sufficiency of evidence to support claims.",
    mastered: false,
    masteryLevel: 55
  },
  {
    id: "expr-org-trans",
    name: "Transition Usage",
    category: "Expression of Ideas",
    subcategory: "Organization",
    description: "Using transitions to connect ideas and improve flow between sentences and paragraphs.",
    mastered: true,
    masteryLevel: 85
  },
  {
    id: "expr-org-intro",
    name: "Introduction and Conclusion",
    category: "Expression of Ideas",
    subcategory: "Organization",
    description: "Crafting effective introductions and conclusions in essays.",
    mastered: false,
    masteryLevel: 65
  },
  {
    id: "math-alg-linear",
    name: "Linear Equations",
    category: "Math",
    subcategory: "Algebra",
    description: "Solving and graphing linear equations and inequalities.",
    mastered: true,
    masteryLevel: 90
  },
  {
    id: "math-alg-quad",
    name: "Quadratic Equations",
    category: "Math",
    subcategory: "Algebra",
    description: "Solving and graphing quadratic equations and functions.",
    mastered: false,
    masteryLevel: 40
  },
  {
    id: "math-alg-exp",
    name: "Exponents and Radicals",
    category: "Math",
    subcategory: "Algebra",
    description: "Working with exponents and radicals in expressions and equations.",
    mastered: false,
    masteryLevel: 25
  },
  {
    id: "math-geo-tri",
    name: "Triangle Properties",
    category: "Math",
    subcategory: "Geometry",
    description: "Understanding and applying the properties of triangles.",
    mastered: true,
    masteryLevel: 95
  },
  {
    id: "math-geo-circle",
    name: "Circle Properties",
    category: "Math",
    subcategory: "Geometry",
    description: "Understanding and applying the properties of circles.",
    mastered: false,
    masteryLevel: 60
  }
];

export default SkillsProvider; 