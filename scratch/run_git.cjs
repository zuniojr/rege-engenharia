const { execSync } = require('child_process');

try {
  console.log('Running git status...');
  const status = execSync('git status', { encoding: 'utf8' });
  console.log(status);

  console.log('Adding files...');
  execSync('git add .', { encoding: 'utf8' });

  console.log('Committing changes...');
  const commit = execSync('git commit -m "feat: atualiza imagem de regularizacao nas paginas do site"', { encoding: 'utf8' });
  console.log(commit);

  console.log('Pushing to remote...');
  const push = execSync('git push', { encoding: 'utf8' });
  console.log(push);
  console.log('SUCCESS');
} catch (err) {
  console.error('Error executing git commands:', err.message);
  if (err.stdout) console.log('Stdout:', err.stdout);
  if (err.stderr) console.log('Stderr:', err.stderr);
}
