const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));
  const summary = [];
  
  data.forEach(file => {
    if (file.errorCount > 0 || file.warningCount > 0) {
      const messages = file.messages.map(m => `  Line ${m.line}: [${m.ruleId}] ${m.message}`);
      summary.push(`File: ${file.filePath}\n${messages.join('\n')}`);
    }
  });

  console.log(`Found issues in ${summary.length} files.`);
  console.log(summary.join('\n\n'));
} catch (e) {
  console.error("Error reading or parsing lint_results.json", e);
}
