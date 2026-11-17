# Despliegue de Mascota al Día con Docker y AWS EC2

Fecha de la auditoría: **14 de noviembre de 2026**.

Este procedimiento crea una instalación nueva y aislada. No reutiliza contenedores,
redes, volúmenes, grupos de seguridad ni la IP elástica de LogicDraft. En esta primera
fase no se creó ni modificó ningún recurso de AWS.

## 1. Arquitectura

```text
Internet (80/443)
        |
      Caddy  -- TLS automático cuando SITE_ADDRESS es un dominio
        |
      Next.js :3000 (solo red Docker)
        |
      FastAPI :8000 (solo red Docker interna)
        |
      SQLite /datos/mascota-al-dia.db
        |
      volumen Docker mascota-al-dia-sqlite sobre EBS propio
```

Solo Caddy publica puertos del host. Next.js traduce `/api/:path*` hacia
`http://backend:8000/:path*`; FastAPI y SQLite no son alcanzables desde Internet.
Compose fija nombres exclusivos (`mascota-al-dia-*`) y usa dos redes, una de ellas
marcada como interna para la API.

## 2. Requisitos

### Windows para validación local

- Docker Desktop con Docker Compose v2.
- Git.
- PowerShell 5.1 o posterior.
- Para ejecutar las pruebas fuera de Docker: Python 3.12, Node 24 y los navegadores de
  Playwright instalados.

### EC2

- Región propuesta: `us-east-1` (N. Virginia), después de comprobar cuota y precio en la
  cuenta concreta.
- Ubuntu Server 24.04 LTS x86_64.
- Instancia nueva con etiqueta `Name=mascota-al-dia`.
- Recomendación: `t3.small` (2 vCPU, 2 GiB). `t3.micro` tiene 2 vCPU y 1 GiB, pero la
  compilación de Next puede quedarse sin memoria. AWS publica 24 créditos CPU/h y 20 %
  de línea base por vCPU para `t3.small`; `t3.micro` recibe 12 créditos/h y 10 % de línea
  base. Ver [características y precios T3](https://aws.amazon.com/ec2/instance-types/t3/).
- EBS gp3 cifrado, 20 GiB como inicio, con borrado al terminar solo si ya existe una copia
  externa válida. No hace falta provisionar IOPS sobre la base de gp3.
- Una clave SSH nueva o existente bajo control del administrador; nunca copiar la clave a
  la instancia.

La medición local en reposo fue aproximadamente: Caddy 19 MiB, Next.js 63 MiB y FastAPI
61 MiB. Es una muestra, no una garantía. Con Linux, Docker, cachés y picos de build se debe
presupuestar entre 0.6 y 1.5 GiB; por eso `t3.small` es la opción segura para compilar en la
misma máquina. `t3.micro` solo se recomienda para una demo pequeña, con 2 GiB de swap y
vigilancia de memoria/créditos.

## 3. Variables de entorno

Copiar `.env.deploy.example` a `.env.deploy`. Este último está ignorado por Git.

| Variable | Local | Producción con HTTPS |
|---|---|---|
| `SITE_ADDRESS` | `http://localhost` | dominio, por ejemplo `mascotas.ejemplo.com` |
| `ENTORNO` | `desarrollo` | `produccion` |
| `COOKIE_SEGURA` | `false` | `true` |
| `RECUPERACION_SIMULADA` | `true` | `false` |
| `SECRETO_JWT` | secreto aleatorio local | mínimo 32 caracteres, recomendado 32 bytes aleatorios |
| `MINUTOS_SESION` | `120` | según política |
| `MINUTOS_CODIGO_RECUPERACION` | `15` | no se usa mientras la recuperación esté desactivada |
| `ZONA_HORARIA` | `America/La_Paz` | zona IANA del negocio |

En producción el backend se niega a iniciar si el secreto es corto, si la cookie no es
`Secure` o si la recuperación simulada está activa. Como todavía no hay proveedor de
correo, `/auth/recuperar` devuelve 503 en producción y no genera ningún código. No se debe
reactivar hasta implementar envío real, expiración y limitación de intentos.

## 4. Docker local desde Windows PowerShell

Desde la raíz del repositorio:

```powershell
Copy-Item .env.deploy.example .env.deploy
$secreto = [Convert]::ToHexString(
  [Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
).ToLower()
(Get-Content .env.deploy -Raw).Replace(
  'cambiar-por-un-secreto-aleatorio-largo', $secreto
) | Set-Content .env.deploy

docker compose --env-file .env.deploy -f compose.deploy.yml config
docker compose --env-file .env.deploy -f compose.deploy.yml build
docker compose --env-file .env.deploy -f compose.deploy.yml up -d --wait
docker compose --env-file .env.deploy -f compose.deploy.yml ps
Invoke-RestMethod http://localhost/api/salud
Start-Process http://localhost
```

Para ver logs:

```powershell
docker compose --env-file .env.deploy -f compose.deploy.yml logs -f --tail=100
```

Para detener sin perder datos:

```powershell
docker compose --env-file .env.deploy -f compose.deploy.yml stop
```

`docker compose down` conserva el volumen si no se agrega `-v`. **No usar `down -v`**:
eliminaría la base persistente.

## 5. Preparar una EC2 Linux nueva

### Grupo de seguridad exclusivo

Crear `mascota-al-dia-sg`, sin reutilizar ni editar el de LogicDraft:

| Entrada | Origen |
|---|---|
| TCP 22 | `IP_ADMIN/32`, nunca `0.0.0.0/0` |
| TCP 80 | `0.0.0.0/0` y `::/0`, solo cuando se publique web/ACME |
| TCP 443 | `0.0.0.0/0` y `::/0` |
| UDP 443 | opcional, `0.0.0.0/0` y `::/0`, para HTTP/3 |

No crear reglas para 3000 ni 8000. SQLite no usa puerto. AWS también recomienda limitar
SSH a la IP administrativa; ver [reglas de grupos de seguridad](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html).

### Instalación de Docker en Ubuntu

Conectarse únicamente a la IP de la instancia nueva:

```bash
ssh -i ~/.ssh/mascota-al-dia.pem ubuntu@IP_NUEVA
sudo apt-get update
sudo apt-get install -y ca-certificates curl git openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker
exit
```

Volver a conectar para que se aplique el grupo `docker` y comprobar:

```bash
docker version
docker compose version
```

## 6. Primera instalación

```bash
git clone --branch main --single-branch \
  https://github.com/AlexTiclla/segundoProyectoIHC.git mascota-al-dia
cd mascota-al-dia
cp .env.deploy.example .env.deploy
chmod 600 .env.deploy
openssl rand -hex 32
nano .env.deploy
```

Con dominio, configurar al menos:

```dotenv
SITE_ADDRESS=mascotas.ejemplo.com
ENTORNO=produccion
COOKIE_SEGURA=true
RECUPERACION_SIMULADA=false
SECRETO_JWT=PEGAR_EL_RESULTADO_ALEATORIO
ZONA_HORARIA=America/La_Paz
```

Crear un registro DNS A que apunte a la **IP nueva**, nunca a la IP elástica de
LogicDraft. Después de que DNS resuelva:

```bash
docker compose --env-file .env.deploy -f compose.deploy.yml config --quiet
docker compose --env-file .env.deploy -f compose.deploy.yml build
docker compose --env-file .env.deploy -f compose.deploy.yml up -d --wait
docker compose --env-file .env.deploy -f compose.deploy.yml ps
curl -fsS https://mascotas.ejemplo.com/api/salud
```

Caddy solicita y renueva el certificado automáticamente. Sus datos se conservan en los
volúmenes `mascota-al-dia-caddy-data` y `mascota-al-dia-caddy-config`.

### Demo sin dominio

La alternativa segura es no abrir 80/443 públicamente, dejar solo SSH desde `IP_ADMIN/32`
y usar un túnel. En `.env.deploy` mantener la configuración local (`SITE_ADDRESS=http://localhost`,
`ENTORNO=desarrollo`, cookie no segura) porque el transporte externo va cifrado por SSH:

```powershell
ssh -i $HOME\.ssh\mascota-al-dia.pem -L 8080:localhost:80 ubuntu@IP_NUEVA
```

Abrir `http://localhost:8080`. Este modo es para demostración privada, no para usuarios
públicos. No publicar HTTP con cookies sin `Secure`.

## 7. Actualizaciones desde Git

No actualizar si hay cambios locales sin revisar:

```bash
cd ~/mascota-al-dia
git status --short --branch
git fetch origin
git log --oneline HEAD..origin/main
```

Hacer primero una copia de SQLite como se indica abajo. Luego:

```bash
git pull --ff-only origin main
docker compose --env-file .env.deploy -f compose.deploy.yml build
docker compose --env-file .env.deploy -f compose.deploy.yml up -d --wait
docker compose --env-file .env.deploy -f compose.deploy.yml ps
curl -fsS https://mascotas.ejemplo.com/api/salud
```

Reconstruir/recrear contenedores no borra cuentas ni mascotas: la base está en el volumen
con nombre `mascota-al-dia-sqlite`, fuera de las capas de las imágenes.

## 8. Migraciones SQLite

En una instalación nueva `Base.metadata.create_all()` crea el esquema actual. No modifica
tablas ya existentes. El repositorio todavía no tiene un sistema versionado como Alembic;
los scripts históricos son parciales. Esta es una limitación importante.

Antes de desplegar una versión que cambie modelos:

1. Leer el diff de modelos y el script de migración de esa versión.
2. Hacer respaldo consistente.
3. Probar migración y rollback sobre una copia.
4. Detener el backend para aplicar cambios DDL.
5. Verificar columnas y datos antes de arrancar.

Inspección no destructiva del esquema actual:

```bash
docker compose --env-file .env.deploy -f compose.deploy.yml exec -T backend \
  python -c "import sqlite3; c=sqlite3.connect('/datos/mascota-al-dia.db'); print(c.execute('PRAGMA integrity_check').fetchone()[0]); print(c.execute('PRAGMA user_version').fetchone()[0])"
```

No copiar una base antigua encima del volumen sin aplicar todas sus migraciones. Para el
primer despliegue recomendado, empezar con el volumen vacío y conservar cualquier base
histórica como respaldo independiente.

## 9. Copias de seguridad y restauración

### Respaldo consistente

La API de backup de SQLite permite copiar mientras la app está activa:

```bash
cd ~/mascota-al-dia
mkdir -p backups
chmod 700 backups
marca=$(date -u +%Y%m%dT%H%M%SZ)
docker compose --env-file .env.deploy -f compose.deploy.yml exec -T backend \
  python -c "import sqlite3; o=sqlite3.connect('/datos/mascota-al-dia.db'); d=sqlite3.connect('/datos/respaldo-${marca}.db'); o.backup(d); d.close(); o.close()"
docker compose --env-file .env.deploy -f compose.deploy.yml cp \
  "backend:/datos/respaldo-${marca}.db" "backups/mascota-al-dia-${marca}.db"
docker compose --env-file .env.deploy -f compose.deploy.yml exec -T backend \
  python -c "import os; os.remove('/datos/respaldo-${marca}.db')"
chmod 600 "backups/mascota-al-dia-${marca}.db"
```

Copiar el archivo fuera de EC2 desde PowerShell:

```powershell
scp -i $HOME\.ssh\mascota-al-dia.pem `
  ubuntu@IP_NUEVA:~/mascota-al-dia/backups/mascota-al-dia-FECHA.db .
```

Una copia en el mismo EBS no protege frente a pérdida del volumen. Se puede añadir un
snapshot EBS cifrado y una política de retención, revisando antes su costo.

### Restauración

La restauración reemplaza datos. Confirmar archivo, checksum y respaldo de seguridad antes
de ejecutar:

```bash
cd ~/mascota-al-dia
sha256sum backups/mascota-al-dia-FECHA.db
docker compose --env-file .env.deploy -f compose.deploy.yml stop caddy frontend backend
docker run --rm \
  -v mascota-al-dia-sqlite:/datos \
  -v "$PWD/backups:/respaldo:ro" \
  alpine:3.22 sh -c \
  'cp /respaldo/mascota-al-dia-FECHA.db /datos/mascota-al-dia.db && chown 10001:10001 /datos/mascota-al-dia.db && chmod 600 /datos/mascota-al-dia.db'
docker compose --env-file .env.deploy -f compose.deploy.yml up -d --wait
docker compose --env-file .env.deploy -f compose.deploy.yml exec -T backend \
  python -c "import sqlite3; print(sqlite3.connect('/datos/mascota-al-dia.db').execute('PRAGMA integrity_check').fetchone()[0])"
```

## 10. Verificación de funcionamiento

```bash
docker compose --env-file .env.deploy -f compose.deploy.yml ps
docker compose --env-file .env.deploy -f compose.deploy.yml logs --tail=100
curl -fsS https://DOMINIO/api/salud
curl -I https://DOMINIO/
docker inspect mascota-al-dia-backend-1 --format '{{json .NetworkSettings.Ports}}'
docker inspect mascota-al-dia-frontend-1 --format '{{json .NetworkSettings.Ports}}'
docker volume inspect mascota-al-dia-sqlite
```

Comprobar manualmente registro, ingreso, navegación autenticada, crear/editar/realizar un
cuidado, permisos Consulta/Gestión, omisión de vencidos, exportación y eliminación de
cuenta. Tras ello reiniciar `backend` y `frontend` y confirmar que los registros siguen.

## 11. Resolución de errores

- **Backend no saludable:** revisar `docker compose ... logs backend`. En producción suele
  indicar un secreto corto, cookie insegura o recuperación simulada activa.
- **502 de Caddy:** confirmar que `frontend` y `backend` estén saludables; no abrir 3000/8000.
- **Cookie no aparece:** con `COOKIE_SEGURA=true` se requiere HTTPS válido. No desactivarla
  para resolver un problema de certificado.
- **Caddy no obtiene certificado:** comprobar DNS hacia la IP nueva, puertos 80/443 y logs.
- **`database is locked`:** confirmar que solo esta pila usa el volumen y evitar editar el
  archivo con herramientas externas mientras FastAPI está activo.
- **`no such column`:** la base es de una versión antigua; restaurar la copia y aplicar la
  migración revisada. `create_all` no agrega columnas.
- **Build termina por falta de memoria:** usar `t3.small` o mayor. Como mitigación temporal,
  agregar swap, pero no sustituye monitoreo ni capacidad real.
- **Créditos CPU caen:** revisar `CPUCreditBalance` y `CPUSurplusCreditsCharged` en
  CloudWatch; T3 Unlimited puede generar cargos por CPU sostenida.

## 12. Detener para ahorrar créditos

Desde EC2, detener contenedores no detiene el cobro de la instancia:

```bash
docker compose --env-file .env.deploy -f compose.deploy.yml stop
```

Para dejar de pagar cómputo hay que detener la instancia desde EC2 (`Instance state` →
`Stop instance`) o con AWS CLI, después de verificar el ID nuevo:

```bash
aws ec2 stop-instances --region us-east-1 --instance-ids i-ID_MASCOTA_AL_DIA
```

EBS sigue facturándose mientras exista. Una IP pública automática se libera al detener;
una Elastic IP reservada puede seguir cobrándose. No usar la Elastic IP de LogicDraft.

## 13. Comprobar que LogicDraft permanece intacto

Antes del aprovisionamiento, registrar en una tabla de control de solo lectura para ambas
instancias: Instance ID, etiqueta Name, estado, VPC, subnet, ENI, grupos de seguridad,
volúmenes y Elastic IP. La instancia nueva debe tener identificadores distintos.

Filtros de solo lectura sugeridos:

```bash
aws ec2 describe-instances --region us-east-1 \
  --filters 'Name=tag:Name,Values=LogicDraft,mascota-al-dia' \
  --query 'Reservations[].Instances[].{Id:InstanceId,Name:Tags[?Key==`Name`]|[0].Value,State:State.Name,Vpc:VpcId,Subnet:SubnetId,SG:SecurityGroups[].GroupId,Volumes:BlockDeviceMappings[].Ebs.VolumeId}'
aws ec2 describe-addresses --region us-east-1 \
  --query 'Addresses[].{PublicIp:PublicIp,AllocationId:AllocationId,InstanceId:InstanceId}'
```

Después del despliegue, repetir y comparar. LogicDraft debe conservar exactamente sus
identificadores, estado, reglas, volúmenes e IP. No ejecutar SSH, Docker ni cambios de red
en esa instancia.

## 14. Costos y créditos estimados

Valores oficiales consultados el 14/11/2026, sujetos a región, impuestos y cambios:

- AWS publica para T3 Linux bajo demanda aproximadamente `t3.micro` **USD 0.0104/h** y
  `t3.small` **USD 0.0209/h** en su tabla T3. Confirmar el valor exacto en la calculadora
  de la cuenta y `us-east-1` antes de crear.
- gp3 se cobra por capacidad; AWS usa **USD 0.08/GB-mes** como ejemplo y ofrece 3000 IOPS
  y 125 MB/s base sin recargo. Ver [precios EBS](https://aws.amazon.com/ebs/pricing/).
- Una IPv4 pública en uso o inactiva cuesta **USD 0.005/h** fuera de beneficios aplicables.
  Ver [precios VPC](https://aws.amazon.com/vpc/pricing/).
- AWS indica 100 GB/mes de salida a Internet sin cargo, agregados entre servicios y
  regiones comerciales; luego aplican tarifas. Ver [transferencia EC2](https://aws.amazon.com/ec2/pricing/on-demand/).
- El programa para cuentas nuevas puede otorgar hasta USD 200 y durar hasta 6 meses o
  hasta agotar créditos; la elegibilidad depende de la cuenta. Ver [FAQ de Free Tier](https://aws.amazon.com/free/free-tier-faqs/).

Estimación aproximada para 720 h/mes, sin impuestos, snapshots, DNS ni tráfico excedente:

| Concepto | `t3.micro` | `t3.small` recomendado |
|---|---:|---:|
| EC2 | USD 7.49 | USD 15.05 |
| IPv4 pública | USD 3.60 | USD 3.60 |
| EBS gp3 20 GB | USD 1.60 | USD 1.60 |
| Total aproximado | **USD 12.69/mes** | **USD 20.25/mes** |

Al detener la instancia se deja de cobrar cómputo, pero no EBS ni una Elastic IP ociosa.
No se puede afirmar cuánto crédito consumirá sin conocer saldo, elegibilidad, impuestos y
uso real de la cuenta. Configurar AWS Budgets y alertas de facturación antes de publicar.

## 15. Resultados reales de esta preparación local

- Imágenes backend y frontend: construidas correctamente.
- `GET /api/salud` a través de Caddy: 200, `{"estado":"ok"}`.
- Registro, ingreso, cookie, cuidado, Consulta/Gestión, omisión, exportación y eliminación:
  recorrido manual aprobado sobre la pila Docker.
- Persistencia: los dos cuidados de prueba siguieron visibles después de reiniciar backend
  y frontend.
- `pytest`: 99 aprobadas.
- TypeScript y `next build`: aprobados con Next.js 16.4.6.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas.
- Playwright funcional en Chromium contra Caddy: 56 aprobadas, 2 omitidas por el seguro
  que impide editar directamente un SQLite no local.
- Visuales Windows: ingreso y registro aprobados; lista vacía falla porque su snapshot
  Windows no incluye el enlace preexistente “Mi cuenta” (270 píxeles distintos). No se
  regeneró la evidencia sin revisión.

