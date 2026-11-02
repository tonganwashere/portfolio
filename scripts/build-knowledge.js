const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const PRIMARY_OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'data', 'tongan-knowledge.json');

const filesToInclude = [
  'profile.md',
  'projects.md',
  'education_experience.md',
  'hobbies.md',
  'faq_and_guardrails.md'
];

function compileKnowledge() {
  console.log('Compiling Tongan AI knowledge base...');
  
  const sections = [];
  let totalChars = 0;

  for (const filename of filesToInclude) {
    const filePath = path.join(KNOWLEDGE_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`[Warning] Missing file: ${filePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    totalChars += content.length;
    sections.push({
      file: filename,
      title: filename.replace('.md', ''),
      content
    });
  }

  const combinedContent = sections.map(s => s.content).join('\n\n---\n\n');
  const payload = {
    name: 'Tongan AI',
    persona: 'First-person AI clone of Hor Tongan',
    updatedAt: new Date().toISOString(),
    characterCount: totalChars,
    estimatedTokens: Math.ceil(totalChars / 4),
    sections,
    combinedContext: combinedContent
  };

  const outDir = path.dirname(PRIMARY_OUTPUT_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonStr = JSON.stringify(payload, null, 2);
  fs.writeFileSync(PRIMARY_OUTPUT_FILE, jsonStr, 'utf-8');

  console.log(`Knowledge successfully compiled to:`);
  console.log(`  - ${PRIMARY_OUTPUT_FILE}`);
  console.log(`Total sections: ${sections.length}`);
  console.log(`Total characters: ${totalChars.toLocaleString()} (~${payload.estimatedTokens.toLocaleString()} tokens)`);
}

compileKnowledge();