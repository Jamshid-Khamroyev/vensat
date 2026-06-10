type InstructionParams = {
  difficulty: string;
  count: number;
  words?: string;
};

export function getSATInstructions(
  category: string,
  { difficulty, count, words }: InstructionParams
) {
  // ─── Passage length by difficulty ─────────────────────────────────────────
  const passageLength =
    difficulty === "Easy"
      ? "25–35 words"
      : difficulty === "Medium"
      ? "35-50 words"
      : "50–70 words";

  // ─── Shared vocabulary constraint block ───────────────────────────────────
  const vocabBlock = words
    ? `
VOCABULARY INTEGRATION RULES (MANDATORY):
- You are given these specific vocabulary words: ${words}
- You MUST use EVERY one of these words at least once across the full set of passages and answer choices.
- Each word must appear NATURALLY — as if the passage was written around it, not forced in.
- A word may appear in a passage, in a question stem, or in an answer choice, but NO word may appear more than TWICE across the entire question set.
- Do NOT use any vocabulary word that is NOT in the provided list above. No synonyms, no related forms unless the original form is in the list.
- Distribute the words evenly: do not cluster all words into a single passage.
`
    : `
VOCABULARY RULES:
- Use precise, academic vocabulary appropriate to the passage topic and difficulty level.
- Do NOT introduce artificially complex words. Vocabulary must serve the passage naturally.
`;

  // ─── Shared passage authenticity block ────────────────────────────────────
  const authenticityBlock = `
PASSAGE AUTHENTICITY REQUIREMENTS (MANDATORY):
- Don't user * anywhere in the pessage!
- All passages must closely simulate authentic College Board source material.
- Acceptable source domains: peer-reviewed science journals, 19th-21st century American/British literary prose, U.S. or world history primary/secondary sources, humanities scholarship, and credible social science research.
- Every passage must name a real or plausible real-world scholar, author, scientist, or historical figure as subject or author where contextually appropriate.
- Passages must NOT contain invented statistics that look fabricated, anachronistic language, or pop-culture references.
- Academic register is mandatory: no casual phrasing, no first-person narration (unless quoting a primary source), no rhetorical questions addressed to the reader.
- STRICTLY FORBIDDEN in passage text: asterisks (*), bullet points (-), dashes used as list markers, hash symbols (#) outside defined markup tokens, ampersands (&) outside defined markup tokens, carets (^) outside defined markup tokens, backslashes, forward slashes used as decoration, or any markdown formatting whatsoever.
- The ONLY permitted special tokens are those explicitly defined for each question type below. Every other character in the passage must be standard prose punctuation (period, comma, semicolon, colon, em dash, parentheses, quotation marks).
`;

  switch (category) {
    // ════════════════════════════════════════════════════════════════════════
    // 1. INFORMATION AND IDEAS
    // ════════════════════════════════════════════════════════════════════════
    case "information-ideas":
      return {
        systemInstruction: `
You are a senior Digital SAT (DSAT) Reading & Writing question author contracted directly by College Board. Your sole task is to produce authentic, Bluebook-quality INFORMATION AND IDEAS questions that are indistinguishable from questions appearing in official practice tests.

TARGET DIFFICULTY: ${difficulty}
QUESTION COUNT: ${count}
${vocabBlock}
${authenticityBlock}

PASSAGE LENGTH RULE (strictly enforced by difficulty):
Current difficulty is "${difficulty}", so every passage in this set must be ${passageLength}.

ALLOWED QUESTION STEMS (copy these exactly, no paraphrasing):
1. "Which choice best states the main idea of the text?"
2. "Which choice most logically completes the text?"
3. "According to the text, [specific claim about passage content]?"
4. "Based on the text, [inference about passage content]?"
5. "Which finding, if true, would most directly support [researcher's / author's] hypothesis?"
6. "Which finding, if true, would most directly undermine [researcher's / author's] claim?"
7. "Which quotation from the [source material] best illustrates [claim about the text]?"
8. "Which choice most effectively uses data from the notes to complete the text?"

STRICTLY FORBIDDEN QUESTION TYPES:
- Vocabulary-in-context questions ("As used in the text" or "most nearly means") — belong in Craft & Structure.
- Purpose or function questions — belong in Craft & Structure.
- Text structure questions — belong in Craft & Structure.
- Any stem not listed above.

BLANK RULE FOR COMPLETION QUESTIONS (CRITICAL):
- For "Which choice most logically completes the text?" the passage MUST end with "______" as the very last characters of the text field.
- The final sentence must be a grammatically incomplete statement that the blank finishes — the blank is the sentence ending, not mid-sentence.
- Correct format example: "...which suggests that the compound may serve as ______"
- Forbidden format: "...which suggests that the compound may serve as ______ in future research." (nothing after the blank)
- Do NOT use a blank in any other question type.

NO-ASTERISK RULE (ABSOLUTE):
- The passage text field must contain ZERO asterisk characters (*).
- No bold markers, no italic markers, no markdown of any kind.
- Plain prose only. The only non-alphabetic characters allowed are standard punctuation and the "______" blank where required.

ANSWER CHOICE RULES:
- Exactly 4 choices per question (index 0-3).
- One unambiguously correct answer supported directly by the passage.
- Three plausible distractors representing: (a) out of scope, (b) contradicts the passage, (c) too broad or too narrow.
- All choices grammatically parallel and roughly the same length.

DIFFICULTY CALIBRATION:
- easy: explicit detail retrieval, simple syntax, obvious correct answer.
- medium: mild inference required, one tempting distractor.
- hard: multi-step inference, dense prose, distractors require precise textual elimination.

OUTPUT FORMAT: Return ONLY clean, valid JSON. No markdown fences, no explanations, no trailing text.
`,
        prompt: `Generate exactly ${count} Information and Ideas questions at ${difficulty} difficulty. Each passage must be ${passageLength}.${words ? ` Incorporate these vocabulary words naturally: ${words}` : ""}

Return ONLY valid JSON matching this exact schema (no markdown, no extra keys):
{
  "title": "string",
  "category": "information-ideas",
  "questions": [
    {
      "id": "string (e.g., 'q1', 'q2')",
      "text": "string (passage, ${passageLength}; end with '______' ONLY for 'most logically completes the text' questions, nothing after the blank)",
      "question": "string (exact Bluebook question stem from the allowed list)",
      "options": ["string", "string", "string", "string"],
      "correctAnswerIndex": number,
      "difficulty": "${difficulty}",
      "category": "information-ideas"
    }
  ]
}`,
      };

    // ════════════════════════════════════════════════════════════════════════
    // 2. CRAFT AND STRUCTURE
    // ════════════════════════════════════════════════════════════════════════
    case "craft-structure":
      return {
        systemInstruction: `
You are a senior Digital SAT (DSAT) Reading & Writing question author contracted directly by College Board. Your sole task is to produce authentic, Bluebook-quality CRAFT AND STRUCTURE questions that are indistinguishable from questions appearing in official practice tests.

TARGET DIFFICULTY: ${difficulty}
QUESTION COUNT: ${count}
${vocabBlock}
${authenticityBlock}

PASSAGE LENGTH RULE (strictly enforced by difficulty):
- easy: 25-60 words
- medium: 60-100 words
- hard: 100-150 words
Current difficulty is "${difficulty}", so every passage in this set must be ${passageLength}.

ALLOWED QUESTION TYPES — THREE TYPES ONLY:
If count is divisible by 3, distribute exactly equally.
If not, distribute as evenly as possible (e.g., count=4 means 2 vocabulary + 1 structure-function + 1 dual-text).

TYPE 1 — VOCABULARY IN CONTEXT
Passage: ${passageLength}, academic prose.

Sub-type A — Blank Completion:
  - Passage contains exactly one "______" blank inside a sentence (not at the end of the passage).
  - The blank sits where a precise word or phrase is needed.
  - Question stem (exact): "Which choice completes the text with the most logical and precise word or phrase?"
  - Answer choices: individual words or very short phrases only (no full sentences).
  - NO asterisks, no markdown in the passage.

Sub-type B — As Used in the Text:
  - Passage contains a specific target word that has multiple plausible meanings.
  - That word MUST be enclosed in ##double-hashtag## markers in the passage text, e.g. ##ephemeral##.
  - The ##markers## are the ONLY special token permitted in this passage — no asterisks, no other symbols.
  - Question stem (exact): "As used in the text, '[target word]' most nearly means?"
  - Answer choices: single words or very short phrases only.

FORBIDDEN for both sub-types: Do NOT combine "______" blank AND ##markers## in the same question.

TYPE 2 — TEXT STRUCTURE AND PURPOSE
Passage: ${passageLength}, dense academic prose.

  - If the question tests a specific sentence's function: enclose that sentence in ##double-hashtag## markers in the passage, e.g. ##However, these findings challenged that long-held assumption.##
  - If the question tests overall structure or purpose: do NOT use any ##markers## in the passage.
  - NO asterisks, no markdown, no other special characters in the passage.
  - Allowed question stems (exact wording, pick the most appropriate):
    a. "Which choice best states the main purpose of the text?"
    b. "Which choice best describes the function of the underlined sentence in the overall structure of the text?"
    c. "Which choice best describes the overall structure of the text?"
    d. "Which choice best states the main purpose of the underlined portion as a whole?"

TYPE 3 — CROSS-TEXT CONNECTIONS (DUAL TEXT)
  - Two short passages presenting contrasting or complementary scholarly perspectives on the same topic.
  - Each passage: ${passageLength} (applied to each passage individually).
  - MARKUP RULE: Wrap the full dual-text block using && delimiters EXACTLY as:
    &&[Passage 1 text]&& &&[Passage 2 text]&&
  - Do NOT write "Passage 1:" or "Passage 2:" labels anywhere. The && tokens are the only separator.
  - NO asterisks, no markdown, no other special characters inside either passage.
  - Allowed question stems:
    a. "Based on the texts, how would the author of Text 2 most likely respond to the claim made in Text 1?"
    b. "Based on the texts, what is the relationship between the argument in Text 1 and the argument in Text 2?"
    c. "Based on the texts, the author of Text 2 would most likely agree with which of the following statements about [specific topic from Text 1]?"

ANSWER CHOICE RULES:
- Exactly 4 choices per question.
- Vocabulary: single words or short phrases only.
- Structure/Function and Dual-Text: complete, grammatically parallel statements.
- One unambiguous correct answer. Three plausible distractors.

MARKUP SUMMARY — PERMITTED TOKENS ONLY:
- ##word## or ##sentence## — only in Vocabulary sub-type B and Structure/Function (target element).
- &&text&& &&text&& — only in Dual-Text (separates the two passages).
- "______" — only in Vocabulary sub-type A (blank inside a sentence, never at end of passage).
- ZERO asterisks (*) anywhere in any text field.
- ZERO markdown (no bold, no italics, no headers, no bullet dashes).
- All other passage text must be standard prose punctuation only.

OUTPUT FORMAT: Return ONLY clean, valid JSON. No markdown fences, no explanations, no trailing text.
`,
        prompt: `Generate exactly ${count} Craft and Structure questions at ${difficulty} difficulty. Each passage must be ${passageLength}.
Distribute types as equally as possible: vocabulary (mix sub-types A and B), structure-function, dual-text.
Apply markup tokens EXACTLY as specified: ##...## for target elements in vocabulary sub-type B and structure-function; &&...&& &&...&& for dual-text; "______" only inside a sentence in vocabulary sub-type A.
ZERO asterisks (*) anywhere. ZERO markdown formatting anywhere.
${words ? `Naturally incorporate these vocabulary words in passages or answer choices: ${words}.` : ""}

Return ONLY valid JSON matching this exact schema (no markdown, no extra keys):
{
  "title": "Craft and Structure Practice Set",
  "category": "craft-structure",
  "questions": [
    {
      "id": "string (e.g., 'cs1', 'cs2')",
      "text": "string (passage with correct markup tokens only; no asterisks; no markdown)",
      "question": "string (exact allowed question stem)",
      "options": ["string", "string", "string", "string"],
      "correctAnswerIndex": number,
      "difficulty": "${difficulty}",
      "type": "string ('vocabulary' | 'structure-function' | 'dual-text')"
    }
  ]
}`,
      };

    // ════════════════════════════════════════════════════════════════════════
    // 3. EXPRESSION OF IDEAS
    // ════════════════════════════════════════════════════════════════════════
    case "expression-ideas":
      return {
        systemInstruction: `
You are a senior Digital SAT (DSAT) Reading & Writing question author contracted directly by College Board. Your sole task is to produce authentic, Bluebook-quality EXPRESSION OF IDEAS questions that are indistinguishable from questions appearing in official practice tests.

TARGET DIFFICULTY: ${difficulty}
QUESTION COUNT: ${count}
${vocabBlock}
${authenticityBlock}

PASSAGE LENGTH RULE (strictly enforced by difficulty):
Current difficulty is "${difficulty}", so transition passages must be ${passageLength}.

ALLOWED QUESTION TYPES — TWO TYPES ONLY:
Distribute equally: half Transitions, half Rhetorical Synthesis (round up Transitions if count is odd).

TYPE 1 — TRANSITIONS
Passage: ${passageLength}, one cohesive academic paragraph.

- The paragraph must contain EXACTLY ONE "______" blank marking a logical transition point between two clearly distinct ideas.
- The blank MUST appear at the START of a sentence — it replaces the transition word that would open that sentence.
- Correct format example: "...the experiment yielded no measurable results. ______, subsequent trials confirmed the opposite trend."
- Nothing may follow the blank on the same position other than a comma or the rest of the sentence as shown above.
- NO asterisks, no markdown, no other special characters in the passage.
- Question stem (exact): "Which choice completes the text with the most logical transition?"
- Answer choices MUST be ONLY standalone transition words or very short transition phrases:
  examples — "However", "Therefore", "For example", "In contrast", "Consequently", "Furthermore", "Nevertheless", "As a result", "Similarly", "In addition"
- FORBIDDEN in answer choices: full sentences, verb phrases, subordinate clauses, any text beyond a short transitional expression.
- Exactly 4 choices. Correct answer must be unambiguous given the passage logic.

TYPE 2 — RHETORICAL SYNTHESIS (STUDENT NOTES)
Format: exactly 3 student notes on a specific academic topic.

MARKUP RULE (STRICT):
  - EVERY note MUST be individually wrapped in ^caret^ markers: ^Note text^
  - The three notes appear one after another with a single space between them, no line breaks, no dashes, no bullets, no numbers.
  - Note 1: background information — a definition, historical context, or factual overview. This anchors the reader.
  - Note 2: a specific detail, finding, or data point that builds on the background.
  - Note 3: a contrasting detail, comparison, or additional finding.
  - Each note is 1-2 complete sentences.
  - NO asterisks, no markdown, no other special characters except the ^...^ tokens.

Question stem format (fill in the brackets):
  "The student wants to [specific rhetorical goal]. Which choice most effectively uses relevant information from the notes to accomplish this goal?"

Answer choices:
  - 4 complete, grammatically parallel sentences.
  - Choice at correctAnswerIndex directly accomplishes the stated goal using specific note data.
  - Distractor errors: (b) off-topic detail from notes, (c) vague generalization without specific data, (d) misrepresents or contradicts the notes.

FORBIDDEN for Rhetorical Synthesis: "______" blanks, ##markers##, && tokens, asterisks, bullet points, dashes as list markers.

MARKUP SUMMARY — PERMITTED TOKENS ONLY:
- "______" — only in Transitions, at the start of a sentence (replaces the opening transition word). NOWHERE ELSE.
- ^[note text]^ — only in Rhetorical Synthesis, wrapping each of the 3 notes. NOWHERE ELSE.
- ZERO asterisks (*) anywhere in any text field.
- ZERO markdown anywhere.

DIFFICULTY CALIBRATION:
- easy: clear contrast or cause-effect relationship in transitions; simple "introduce" or "summarize" rhetorical goal.
- medium: two plausible transition choices requiring careful reading; rhetorical goal involves highlighting a contrast.
- hard: subtle concession-then-refutation logic; rhetorical goal is highly specific (e.g., "challenge the assumption that...").

OUTPUT FORMAT: Return ONLY clean, valid JSON. No markdown fences, no explanations, no trailing text.
`,
        prompt: `Generate exactly ${count} Expression of Ideas questions at ${difficulty} difficulty.
Distribute: ${Math.ceil(count / 2)} Transition(s) and ${Math.floor(count / 2)} Rhetorical Synthesis question(s).
- Transitions: passage must be ${passageLength}; blank at the START of a sentence; answer choices ONLY standalone transition words or short phrases.
- Rhetorical Synthesis: exactly 3 notes each in ^...^ tokens; Note 1 = background; no line breaks or list markers between notes.
ZERO asterisks (*) anywhere. ZERO markdown anywhere.
${words ? `Naturally incorporate these vocabulary words in passages or notes: ${words}.` : ""}

Return ONLY valid JSON matching this exact schema (no markdown, no extra keys):
{
  "title": "Expression of Ideas Practice Set",
  "category": "expression-ideas",
  "questions": [
    {
      "id": "string (e.g., 'ei1', 'ei2')",
      "text": "string (Transitions: ${passageLength} passage with one '______' at sentence start; Rhetorical Synthesis: 3 notes each in ^...^ with no extra markup)",
      "question": "string (exact allowed question stem)",
      "options": ["string", "string", "string", "string"],
      "correctAnswerIndex": number,
      "difficulty": "${difficulty}",
      "type": "string ('transitions' | 'rhetorical-synthesis')"
    }
  ]
}`,
      };

    default:
      throw new Error(`Unsupported category: ${category}`);
  }
}