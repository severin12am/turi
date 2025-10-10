-- Populate Quiz Table for Scenario 1: Greetings and Introductions
-- Run this in Supabase SQL Editor

-- These are the words that actually appear in scenario 1 dialogues
-- Including conjugated forms as they appear in conversations

INSERT INTO quiz (spanish, english) VALUES
-- Greetings
('hola', 'hello'),
('buenos', 'good'),
('días', 'days'),
('tardes', 'afternoons'),
('noches', 'nights'),
('adiós', 'goodbye'),
('hasta', 'until'),
('luego', 'later'),
('pronto', 'soon'),

-- Being/Introductions (as conjugated in dialogues)
('soy', 'I am'),
('eres', 'you are'),
('es', 'he/she is'),
('somos', 'we are'),
('son', 'they are'),
('estoy', 'I am (temporary)'),
('estás', 'you are (temporary)'),
('está', 'he/she is (temporary)'),

-- Calling oneself (as appears in "Me llamo...")
('llamo', 'I call/call myself'),
('llamas', 'you call/call yourself'),
('llama', 'he/she calls'),
('llamamos', 'we call'),
('llaman', 'they call'),

-- Pleasure/Nice to meet you
('mucho', 'much/very'),
('gusto', 'pleasure'),
('encantado', 'delighted (masc)'),
('encantada', 'delighted (fem)'),
('placer', 'pleasure'),
('conocerte', 'to meet you'),
('conocer', 'to know/meet'),

-- How are you phrases
('cómo', 'how'),
('qué', 'what'),
('tal', 'such'),

-- Good/Well responses
('bien', 'well/good'),
('muy', 'very'),
('gracias', 'thank you'),
('mal', 'bad'),
('regular', 'so-so'),

-- Common words in conversations
('tú', 'you'),
('yo', 'I'),
('me', 'me/myself'),
('te', 'you/yourself'),
('se', 'himself/herself'),
('mi', 'my'),
('tu', 'your'),
('su', 'his/her/their'),
('nombre', 'name'),
('apellido', 'surname'),

-- Verbs as conjugated
('tengo', 'I have'),
('tienes', 'you have'),
('tiene', 'he/she has'),
('voy', 'I go'),
('vas', 'you go'),
('va', 'he/she goes'),
('puedo', 'I can'),
('puedes', 'you can'),
('puede', 'he/she can'),

-- Questions
('dónde', 'where'),
('cuándo', 'when'),
('por', 'for/by'),
('qué', 'what'),
('cuál', 'which'),
('quién', 'who'),

-- Common adjectives
('bueno', 'good (masc)'),
('buena', 'good (fem)'),
('malo', 'bad (masc)'),
('mala', 'bad (fem)'),
('grande', 'big'),
('pequeño', 'small (masc)'),
('pequeña', 'small (fem)'),

-- Also/And/Or
('también', 'also'),
('pero', 'but'),
('porque', 'because'),
('para', 'for/to'),
('con', 'with'),
('sin', 'without'),
('de', 'of/from')  -- Often gets filtered out but including for completeness

ON CONFLICT (spanish) DO UPDATE SET 
  english = EXCLUDED.english;

-- Verify the additions
SELECT COUNT(*) as total_scenario_1_words
FROM quiz
WHERE spanish IN (
  'hola', 'soy', 'llamo', 'mucho', 'gusto', 'cómo', 'estás', 
  'bien', 'gracias', 'adiós', 'encantado', 'nombre'
);

-- Should show at least 12 matches

