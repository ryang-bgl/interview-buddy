const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

function convertCsvToJson() {
  const csvPath = path.join(__dirname, '../src/shared/dsa_questions_summary.csv');
  const outputPath = path.join(__dirname, '../src/shared/dsaQuestionsData.json');

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const questions = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 6) continue;

    const index = parseInt(fields[0], 10);
    const title = fields[1] || '';
    const slug = fields[2] || '';
    const tagsString = fields[3] || '';
    const difficulty = fields[4] || 'Medium';
    const relatedQuestionsString = fields[5] || '';

    // Parse tags
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

    // Parse related questions
    const relatedQuestions = relatedQuestionsString
      ? relatedQuestionsString.split(',').map(q => parseInt(q.trim(), 10)).filter(q => !isNaN(q))
      : [];

    questions.push({
      index,
      title,
      slug,
      tags,
      difficulty,
      relatedQuestions
    });
  }

  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
  console.log(`✅ Successfully converted ${questions.length} DSA questions to JSON`);
  console.log(`Output: ${outputPath}`);
}

convertCsvToJson();