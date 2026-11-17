// Corre la suite e2e midiendo la cobertura y genera los reportes:
//   node tests/cobertura/correr.mjs [argumentos extra para playwright test]
// 1. Playwright en Chromium con E2E_COBERTURA=1 (el único navegador con cobertura nativa de V8).
// 2. Frontend: une la cobertura del navegador y la del servidor de Next en un lcov.
// 3. Backend: el lcov y el HTML de coverage.py.
// 4. diff-cover: cobertura solo de las líneas que el fork cambió respecto de upstream/main.
// 5. Copia los reportes a docs/reportes/cobertura, para que queden en el repo.
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

import { MCR } from 'monocart-coverage-reports';

import {
  ARCHIVO_COBERTURA_BACKEND,
  CARPETA_COBERTURA,
  CARPETA_V8_SERVIDOR,
  opcionesFrontend,
} from './opciones.mjs';

const PYTHON_BIN = path.join('backend', '.venv', 'bin');
const RAMA_BASE = process.env.E2E_RAMA_BASE ?? 'upstream/main';
const CARPETA_PUBLICADA = path.join('docs', 'reportes', 'cobertura');

function ejecutar(comando, argumentos, opciones = {}) {
  console.log(`\n$ ${comando} ${argumentos.join(' ')}`);
  const resultado = spawnSync(comando, argumentos, { stdio: 'inherit', ...opciones });
  return resultado.status ?? 1;
}

// 1. Pruebas, empezando sin datos de corridas anteriores
rmSync(CARPETA_COBERTURA, { recursive: true, force: true });
mkdirSync(path.dirname(ARCHIVO_COBERTURA_BACKEND), { recursive: true });
const estadoPruebas = ejecutar(
  'npx',
  ['playwright', 'test', '--project=chromium', ...process.argv.slice(2)],
  { env: { ...process.env, E2E_COBERTURA: '1' } },
);

// 2. Frontend: los workers ya agregaron la cobertura del navegador; falta la del servidor
const reporteFrontend = MCR(opcionesFrontend);
await reporteFrontend.addFromDir(CARPETA_V8_SERVIDOR);
const resultadoFrontend = await reporteFrontend.generate();
if (!resultadoFrontend || resultadoFrontend.files.length === 0) {
  throw new Error('No se generó cobertura del frontend: revisar la fixture de tests/base.ts');
}

// 3. Backend, en lcov como el frontend (diff-cover no mezcla lcov con XML).
// Desde la raíz, para que las rutas queden "backend/app/..." como en git.
const coverage = path.join(PYTHON_BIN, 'coverage');
const rcBackend = ['--rcfile=backend/.coveragerc', `--data-file=${ARCHIVO_COBERTURA_BACKEND}`];
const carpetaBackend = path.dirname(ARCHIVO_COBERTURA_BACKEND);
const lcovBackend = path.join(carpetaBackend, 'lcov.info');
const estadoBackend =
  ejecutar(coverage, ['lcov', ...rcBackend, '-o', lcovBackend]) ||
  ejecutar(coverage, ['html', ...rcBackend, '-d', path.join(carpetaBackend, 'html')]);

// 4. Solo lo que cambió el fork
const lcovFrontend = path.join(opcionesFrontend.outputDir, 'lcov.info');

// diff-cover se salta en silencio los archivos que no están en ningún lcov: un archivo
// del fork que ninguna prueba cargó daría 100 % sin estar cubierto. Se marca como faltante.
const medidos = new Set(
  [lcovBackend, lcovFrontend].flatMap((archivo) =>
    readFileSync(archivo, 'utf-8')
      .split('\n')
      .filter((linea) => linea.startsWith('SF:'))
      .map((linea) => linea.slice(3)),
  ),
);
const base = execFileSync('git', ['merge-base', RAMA_BASE, 'HEAD'], { encoding: 'utf-8' }).trim();
const cambiados = execFileSync('git', ['diff', '--name-only', '--diff-filter=AM', base], {
  encoding: 'utf-8',
})
  .split('\n')
  .filter((archivo) => /^(backend\/app\/.*\.py|frontend\/(app|componentes|lib)\/.*\.tsx?|frontend\/proxy\.ts)$/.test(archivo));
const sinMedir = cambiados.filter((archivo) => !medidos.has(archivo));
if (sinMedir.length > 0) {
  console.error(`\nArchivos del fork sin datos de cobertura (ninguna prueba los cargó):\n  ${sinMedir.join('\n  ')}`);
}

const estadoDiff = ejecutar(path.join(PYTHON_BIN, 'diff-cover'), [
  lcovBackend,
  lcovFrontend,
  `--compare-branch=${RAMA_BASE}`,
  '--fail-under=100',
  '--format',
  `html:${path.join(CARPETA_COBERTURA, 'diff-cover.html')},markdown:${path.join(CARPETA_COBERTURA, 'diff-cover.md')}`,
]);

// 5. Publicar los reportes en el repo (docs/reportes/cobertura), salvo en una corrida
// parcial (con argumentos extra), que no representa a toda la suite
if (process.argv.length <= 2) {
  rmSync(CARPETA_PUBLICADA, { recursive: true, force: true });
  mkdirSync(CARPETA_PUBLICADA, { recursive: true });
  for (const archivo of ['diff-cover.html', 'diff-cover.md']) {
    cpSync(path.join(CARPETA_COBERTURA, archivo), path.join(CARPETA_PUBLICADA, archivo));
  }
  cpSync(opcionesFrontend.outputDir, path.join(CARPETA_PUBLICADA, 'frontend'), {
    recursive: true,
    filter: (origen) => !origen.includes(`${path.sep}.cache`),
  });
  cpSync(carpetaBackend, path.join(CARPETA_PUBLICADA, 'backend'), {
    recursive: true,
    // coverage.py deja un .gitignore con "*" en su HTML, que impediría subirlo
    filter: (origen) => !origen.endsWith('.coverage') && path.basename(origen) !== '.gitignore',
  });
  console.log(`\nReportes publicados en ${CARPETA_PUBLICADA}/`);
}

process.exit(estadoPruebas || estadoBackend || estadoDiff || (sinMedir.length > 0 ? 1 : 0));
