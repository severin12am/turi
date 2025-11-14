import { supabase } from './supabase';
import { logger } from './logger';
import type { SupportedLanguage } from '../constants/translations';

/**
 * Interface for expressions from the expressions table
 * Matches the database structure: expressions_1, expressions_2, etc.
 */
export interface ScenarioExpression {
  expression_id: number;
  dialogue_id: number;
  en_expression: string;
  ru_expression: string;
  es_expression: string;
  // For compatibility with VocalQuizComponent
  id?: number;
  [key: string]: any;
}

/**
 * Get column name in expressions table for a given language
 */
const getExpressionColumnForLanguage = (language: SupportedLanguage): string => {
  const columnMap: Record<string, string> = {
    'en': 'en_expression',
    'ru': 'ru_expression',
    'es': 'es_expression',
    'fr': 'fr_expression',
    'de': 'de_expression',
    'it': 'it_expression',
    'pt': 'pt_expression',
    'ar': 'ar_expression',
    'CH': 'ch_expression',
    'ja': 'ja_expression',
    'tr': 'tr_expression'
  };
  
  return columnMap[language] || 'en_expression';
};

/**
 * Fetch pre-curated expressions for a scenario dialogue
 * Returns up to 5 expressions (or fewer if not enough in table)
 * 
 * @param characterId - The character ID for the scenario (determines table name)
 * @param dialogueId - The dialogue ID within the scenario (1-10)
 * @param scenarioNumber - The scenario number (for logging)
 * @param targetLanguage - The language being learned
 * @param motherLanguage - The user's native language
 * @returns Array of expressions (0-5 expressions)
 */
export const fetchScenarioExpressions = async (
  characterId: number,
  dialogueId: number,
  scenarioNumber: number,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage
): Promise<ScenarioExpression[]> => {
  try {
    logger.info('Fetching scenario expressions', { 
      characterId, 
      dialogueId, 
      scenarioNumber, 
      targetLanguage, 
      motherLanguage 
    });
    console.log('💬 Fetching expressions from expressions table');

    // Table name follows pattern: expressions_1, expressions_2, etc.
    const expressionsTable = `expressions_${characterId}`;
    
    // Fetch expressions for this specific dialogue
    const { data: expressionData, error: expressionError } = await supabase
      .from(expressionsTable)
      .select('*')
      .eq('dialogue_id', dialogueId)
      .limit(5); // Limit to 5 expressions

    if (expressionError) {
      // Table might not exist yet - this is expected for fallback
      logger.info('Expressions table not found, will use fallback', { 
        table: expressionsTable, 
        error: expressionError.message 
      });
      console.log(`ℹ️ No expressions table (${expressionsTable}) - using word fallback`);
      return [];
    }

    if (!expressionData || expressionData.length === 0) {
      logger.info('No expressions found for this dialogue', { 
        characterId, 
        dialogueId,
        table: expressionsTable
      });
      console.log(`ℹ️ No expressions found for dialogue ${dialogueId} - using word fallback`);
      return [];
    }

    // Transform expressions to match VocalQuizWord format expected by VocalQuizComponent
    const targetColumn = getExpressionColumnForLanguage(targetLanguage);
    const motherColumn = getExpressionColumnForLanguage(motherLanguage);

    const expressions: ScenarioExpression[] = expressionData.map((expr) => ({
      id: expr.expression_id, // Use expression_id as id
      expression_id: expr.expression_id,
      dialogue_id: dialogueId,
      // Map to entry_in_* format expected by VocalQuizComponent
      entry_in_en: expr.en_expression || '',
      entry_in_ru: expr.ru_expression || '',
      entry_in_es: expr.es_expression || '',
      entry_in_fr: expr.fr_expression || '',
      entry_in_de: expr.de_expression || '',
      entry_in_it: expr.it_expression || '',
      entry_in_pt: expr.pt_expression || '',
      entry_in_ar: expr.ar_expression || '',
      entry_in_ch: expr.ch_expression || '',
      entry_in_ja: expr.ja_expression || '',
      entry_in_tr: expr.tr_expression || '',
      // Also include raw expression data
      ...expr
    }));

    logger.info('Successfully fetched expressions', { 
      count: expressions.length,
      expressions: expressions.map(e => e[`entry_in_${targetLanguage}`])
    });
    console.log(`✅ Found ${expressions.length} expressions for dialogue ${dialogueId}`);

    return expressions;
  } catch (error) {
    logger.error('Error in fetchScenarioExpressions', { error });
    console.error('Error fetching expressions:', error);
    return []; // Return empty array to trigger fallback
  }
};

/**
 * Check if expressions table exists for a character
 * Useful for diagnostics
 */
export const checkExpressionsTableExists = async (
  characterId: number
): Promise<boolean> => {
  try {
    const expressionsTable = `expressions_${characterId}`;
    const { error } = await supabase
      .from(expressionsTable)
      .select('expression_id')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};

/**
 * Get expression statistics for a dialogue (for debugging)
 */
export const getExpressionStats = async (
  characterId: number,
  dialogueId: number
): Promise<{
  expressionCount: number;
  tableExists: boolean;
}> => {
  try {
    const expressionsTable = `expressions_${characterId}`;
    const { data, error } = await supabase
      .from(expressionsTable)
      .select('expression_id')
      .eq('dialogue_id', dialogueId);

    return {
      expressionCount: data?.length || 0,
      tableExists: !error
    };
  } catch (error) {
    return { expressionCount: 0, tableExists: false };
  }
};

