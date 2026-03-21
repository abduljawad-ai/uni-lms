const fs = require('fs');
const glob = require('glob');
const stripComments = require('strip-comments');

const root = '/home/jawad/Desktop/uni-lms/src';

glob(root + '/**/*.{js,jsx}', (err, files) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  let count = 0;
  files.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(code, { keepProtected: true });
    
    // Remove exactly empty lines left by multi-line comment removals
    const cleaned = stripped.replace(/^\s*[\r\n]/gm, '\n').replace(/\n{3,}/g, '\n\n');
    
    if (code !== cleaned) {
      fs.writeFileSync(file, cleaned);
      count++;
    }
  });
  console.log(`Successfully stripped comments from ${count} files.`);
});
