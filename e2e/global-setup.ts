import { execSync } from 'node:child_process';

// Reseed the local table so every run starts from identical data (visual baselines depend on it).
export default function globalSetup() {
  execSync('bash scripts/seed.sh', { cwd: '..', stdio: 'inherit' });
}
