/**
 * Expression extraction prompt template for Google Gemini API
 * Optimized for speed and conciseness
 * Extracts 3-5 key conversational expressions from dialogue text
 */
export const generateExpressionExtractionPrompt = (
  dialogueText: string,
  targetLanguage: string,
  motherLanguage: string
): string => {
  return `You are a language learning assistant. Extract 3-5 key conversational expressions from this dialogue in ${targetLanguage}.

Rules:
- Length: 1-6 words maximum per expression
- Format: lowercase, no punctuation, no apostrophes
- Focus on: greetings, questions, responses, common conversational phrases
- Exclude: proper names, complex sentences, dialogue-specific content
- Quality: Only expressions that are reusable in other conversations

Dialogue in ${targetLanguage}:
${dialogueText}

Return a JSON array of expressions with translations:
[
  {"target": "expression in ${targetLanguage}", "mother": "translation in ${motherLanguage}"},
  ...
]

Example for Spanish to English:
[
  {"target": "hola", "mother": "hello"},
  {"target": "me llamo", "mother": "my name is"},
  {"target": "como estas", "mother": "how are you"}
]

Be fast and concise. Extract only the most useful conversational expressions.`;
};

