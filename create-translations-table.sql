-- Create translations table for dynamic language loading
CREATE TABLE IF NOT EXISTS translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code text NOT NULL,
  translation_key text NOT NULL,
  translation_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(language_code, translation_key)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_translations_language_code ON translations(language_code);
CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(language_code, translation_key);

-- Enable RLS (Row Level Security)
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read translations
CREATE POLICY "Allow public read access to translations"
ON translations FOR SELECT
USING (true);

-- Policy to allow authenticated users with admin role to insert/update
-- (You can adjust this based on your auth setup)
CREATE POLICY "Allow admin to manage translations"
ON translations FOR ALL
USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_translations_timestamp
BEFORE UPDATE ON translations
FOR EACH ROW
EXECUTE FUNCTION update_translations_updated_at();

COMMENT ON TABLE translations IS 'Stores UI translations for all supported languages except English';
COMMENT ON COLUMN translations.language_code IS 'ISO language code (e.g., es, fr, de)';
COMMENT ON COLUMN translations.translation_key IS 'Translation key matching TranslationStrings interface';
COMMENT ON COLUMN translations.translation_value IS 'Translated text value';

