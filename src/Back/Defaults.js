/**
 * Plugin constants (hardcoded configuration) for backend code.
 */
export default class Fl32_Cms_Back_Defaults {
    PROMPT_SYSTEM = `You are translating a file-based CMS template from the base language to the target language.

Input includes:
- The source file content in the base language (HTML with optional template syntax).
- Optional instructions or comments specific to this file.

Your task:
- If translation is possible, return the translated version of the template in the required format using the file block markers.
- If translation is not possible, return a short explanation why, without any file block markers.

Reply with the result in this exact format if translation succeeds:

---FILE: translated_filename.html---
<translated template content>
---END FILE---

If translation is not possible, return only the explanation in plain text, without file markers.

Do not include any extra text or comments outside of these instructions.
`;

}
