// Pruebas unitarias del backend (pytest). Es lo que corre "pnpm test".
//
//   pnpm test               → pytest
//   pnpm test --coverage    → pytest bajo coverage.py; deja el reporte HTML en coverage/
//
// Usa backend/.venv, igual que la suite e2e (ver playwright.config.ts).
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const BACKEND = 'backend';
const BIN = path.join('.venv', 'bin');
const CARPETA_COBERTURA = path.resolve('coverage');
const conCobertura = process.argv.includes('--coverage');

function ejecutar(comando, argumentos) {
  const { status } = spawnSync(path.join(BIN, comando), argumentos, { cwd: BACKEND, stdio: 'inherit' });
  return status ?? 1;
}

if (!conCobertura) process.exit(ejecutar('python', ['-m', 'pytest', '-q']));

rmSync(CARPETA_COBERTURA, { recursive: true, force: true });
const datos = `--data-file=${path.join(CARPETA_COBERTURA, '.coverage')}`;
const estado = ejecutar('coverage', ['run', '--rcfile=.coveragerc', datos, '-m', 'pytest', '-q']);
ejecutar('coverage', ['report', datos]);
ejecutar('coverage', ['html', datos, '-d', CARPETA_COBERTURA]);
console.log(`\nReporte de cobertura de las pruebas unitarias: ${path.relative('.', CARPETA_COBERTURA)}/index.html`);
process.exit(estado);
