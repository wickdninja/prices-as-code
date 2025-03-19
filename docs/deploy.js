const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const staticDocsDir = __dirname;
const deployDir = path.join(staticDocsDir, 'deploy');
const repoUrl = 'https://github.com/wickdninja/prices-as-code.git';
const branch = 'gh-pages';

// Ensure deploy directory exists and is clean
console.log('Preparing deployment directory...');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy all files except server.js, deploy.js, and node_modules
console.log('Copying files to deployment directory...');
const filesToIgnore = [
  'server.js',
  'deploy.js',
  'node_modules',
  'deploy',
  'template.html'
];

function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (filesToIgnore.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

copyDirectory(staticDocsDir, deployDir);

// Fix paths for GitHub Pages if needed
console.log('Adjusting paths for GitHub Pages...');
const basePath = '/prices-as-code';

function adjustHtmlPaths(directoryPath) {
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      adjustHtmlPaths(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Adjust href and src attributes for GitHub Pages
      content = content.replace(/href="\//g, `href="${basePath}/`);
      content = content.replace(/src="\//g, `src="${basePath}/`);
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

// Uncomment the following line if deploying to GitHub Pages with a base path
// adjustHtmlPaths(deployDir);

console.log('Creating CNAME file if needed...');
// Uncomment and update if you have a custom domain
// fs.writeFileSync(path.join(deployDir, 'CNAME'), 'your-custom-domain.com', 'utf8');

// Provide instructions for manual deployment or deploy automatically
console.log('\nDeployment files prepared in:', deployDir);
console.log('\nTo deploy to GitHub Pages, run these commands:');
console.log(`cd ${deployDir}`);
console.log('git init');
console.log('git add -A');
console.log('git commit -m "Deploy to GitHub Pages"');
console.log(`git push -f ${repoUrl} main:${branch}`);

// Uncomment below to deploy automatically
/*
try {
  console.log('\nDeploying to GitHub Pages...');
  const commands = [
    `cd ${deployDir}`,
    'git init',
    'git add -A',
    'git commit -m "Deploy to GitHub Pages"',
    `git push -f ${repoUrl} main:${branch}`
  ];
  execSync(commands.join(' && '), { stdio: 'inherit' });
  console.log('Successfully deployed to GitHub Pages!');
} catch (error) {
  console.error('Deployment failed:', error);
}
*/