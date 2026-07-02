# CIP — Guía de Setup Completa

**Career Intelligence Platform** · Next.js 14 · TypeScript · PostgreSQL · Prisma · Google Gemini AI

---

## Prerequisitos

Antes de empezar, necesitas tener instalado en tu computador:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18.x o superior | `node --version` |
| npm | 9.x o superior | `npm --version` |
| Git | cualquier versión | `git --version` |

Si no tienes Node.js instalado: https://nodejs.org (descarga la versión LTS)

---

## Cuentas necesarias

Necesitarás crear cuentas en los siguientes servicios (todos tienen plan gratuito):

1. **GitHub** — https://github.com (para alojar el código y conectar con Vercel)
2. **Supabase** — https://supabase.com (base de datos PostgreSQL gratis)
3. **Vercel** — https://vercel.com (hosting y deployment)
4. **Google Cloud Console** — https://console.cloud.google.com (OAuth para el login)

Además, las features de IA (generador de CV, analizador de ofertas, coach de entrevistas) dependen de **AI Core** corriendo localmente — ver Paso 7.

---

## Paso 1 — Organizar los archivos descargados

Después de descargar el ZIP de Claude.ai:

```bash
# 1. Crea una carpeta para el proyecto
mkdir career-intelligence-platform
cd career-intelligence-platform

# 2. Extrae el ZIP aquí
# (arrastra y suelta, o usa unzip desde la terminal)
# Los archivos deben quedar así:
# career-intelligence-platform/
#   ├── src/
#   ├── prisma/
#   ├── package.json
#   ├── next.config.ts
#   └── ... (resto de archivos)
```

---

## Paso 2 — Instalar dependencias

```bash
# En la carpeta del proyecto:
npm install
```

Esto instala todo lo del `package.json` (Next.js, Prisma, TanStack Query, etc.)

---

## Paso 3 — Instalar shadcn/ui

Los componentes de UI (botones, inputs, diálogos) se instalan con el CLI de shadcn.

```bash
# Inicializar shadcn/ui
# Cuando pregunte "Would you like to use CSS variables?" → Yes
# Cuando pregunte por el directorio de components → src/components/ui
npx shadcn@latest init
```

Cuando termine, instalar todos los componentes que usa el proyecto:

```bash
npx shadcn@latest add button input label textarea checkbox card badge form separator tabs toast alert-dialog avatar select
```

Este proceso tarda 1-2 minutos y crea los archivos en `src/components/ui/`.

---

## Paso 4 — Base de datos con Supabase

### 4.1 Crear el proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Haz clic en **"New project"**
3. Elige un nombre (ej: `cip-dev`), una contraseña fuerte, y la región más cercana (ej: South America - São Paulo)
4. Espera ~2 minutos mientras se crea

### 4.2 Obtener la URL de conexión

En tu proyecto de Supabase:
1. Ve a **Settings → Database**
2. Busca la sección **"Connection string"**
3. Selecciona **"URI"** y copia el string (empieza con `postgresql://...`)
4. Reemplaza `[YOUR-PASSWORD]` con la contraseña que pusiste al crear el proyecto

---

## Paso 5 — Variables de entorno

Crea el archivo `.env` en la raíz del proyecto (copia de `.env.example`):

```bash
cp .env.example .env
```

Luego edita `.env` con tus valores reales:

```env
# Base de datos (de Supabase, paso 4.2)
DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@db.[TU-REF].supabase.co:5432/postgres"

# NextAuth — genera el secret con este comando en la terminal:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET="pega-aqui-el-resultado"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (paso 6 abajo)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI Core (paso 7 abajo)
AI_CORE_BASE_URL="http://localhost:8001"
AI_CORE_API_KEY=""
```

---

## Paso 6 — Google OAuth (Login con Google)

### 6.1 Crear las credenciales

1. Ve a https://console.cloud.google.com
2. Crea un proyecto nuevo (ej: "CIP")
3. Ve a **APIs & Services → Credentials**
4. Haz clic en **"Create Credentials" → "OAuth client ID"**
5. Tipo de aplicación: **Web application**
6. Nombre: "CIP Local Dev"
7. En **"Authorized redirect URIs"** agrega:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Haz clic en **Create** y copia el **Client ID** y **Client Secret**
9. Pégalos en tu `.env`

---

## Paso 7 — AI Core (motor de IA)

Las features de IA (generador de CV, analizador de ofertas, coach de entrevistas, importador de CV) no llaman a Gemini directamente — pasan por **AI Core**, una plataforma de IA local-first que corre aparte de CIP. Ver `docs/modules/Completion.md` en el repo de AI Core para el detalle de cómo se conecta cualquier consumidor.

### 7.1 Levantar AI Core (una sola vez por máquina)

```bash
# Desde el repo de AI Core
docker compose -f docker/docker-compose.yml up -d   # Postgres + Chroma
cd backend
alembic upgrade head                                  # aplica el esquema
```

### 7.2 Provisionar una API key para CIP (una sola vez, hasta que la rotes)

```bash
# Desde backend/ de AI Core, con el venv activo
python scripts/create_api_key.py cip
```

Esto imprime la key en texto plano una sola vez — cópiala ahora, AI Core solo guarda su hash.

### 7.3 Variables de entorno en CIP

```env
AI_CORE_BASE_URL="http://localhost:8001"
AI_CORE_API_KEY="<la-key-del-paso-7.2>"
```

### 7.4 Cada vez que vayas a trabajar

AI Core corre como un servidor de desarrollo aparte — no es parte de `npm run dev`. Tenés que levantarlo en su propia terminal:

```bash
# En el repo de AI Core, backend/, con el venv activo
uvicorn app.main:app --reload --port 8001
```

`--port 8001` es necesario porque el contenedor de Chroma ya ocupa el `:8000` en esta máquina (ver `docker-compose.yml` de AI Core). Si Docker ya estaba corriendo (paso 7.1), no hace falta repetirlo — solo `uvicorn`. La API key del paso 7.2 tampoco se regenera por sesión, es persistente.

> En producción (CIP en Vercel), AI Core todavía no tiene una historia de hosting pública resuelta — está pendiente (ver `docs/TODO.md` de AI Core). Por ahora esta integración es solo para desarrollo local.

---

## Paso 8 — Crear la base de datos

Con la `DATABASE_URL` ya configurada en `.env`, ejecuta:

```bash
# Genera el cliente de Prisma (types TypeScript de la DB)
npx prisma generate

# Crea todas las tablas en Supabase
npx prisma db push
```

Si todo funciona, verás algo como:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your Prisma schema.
```

Para verificar que las tablas se crearon, puedes abrir el editor visual:
```bash
npx prisma studio
```

---

## Paso 9 — Primera ejecución local

```bash
npm run dev
```

Abre http://localhost:3000 en el navegador. Deberías ver la pantalla de login con "Continue with Google".

Si algo falla, revisa la terminal — los errores más comunes son:
- `DATABASE_URL` mal configurada → revisa la contraseña en el string
- `GOOGLE_CLIENT_ID` faltante → revisa `.env`
- Error de Prisma → corre `npx prisma generate` de nuevo

---

## Paso 10 — Subir a GitHub

```bash
# Inicializar repositorio
git init
git add .
git commit -m "feat: initial CIP setup"

# Crear repo en GitHub (desde github.com → New repository)
# Nombre sugerido: career-intelligence-platform
# Visibilidad: Private (recomendado)

# Conectar y subir
git remote add origin https://github.com/TU-USUARIO/career-intelligence-platform.git
git branch -M main
git push -u origin main
```

---

## Paso 11 — Deploy a Vercel

### 11.1 Conectar el repositorio

1. Ve a https://vercel.com e inicia sesión con GitHub
2. Haz clic en **"New Project"**
3. Importa el repositorio `career-intelligence-platform`
4. Framework: **Next.js** (detectado automáticamente)
5. **NO hagas deploy todavía** — primero configura las variables de entorno

### 11.2 Variables de entorno en Vercel

En la pantalla de configuración del proyecto, ve a **"Environment Variables"** y agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | El mismo string de Supabase |
| `NEXTAUTH_SECRET` | El mismo que generaste |
| `NEXTAUTH_URL` | `https://TU-DOMINIO.vercel.app` (cambia después del primer deploy) |
| `GOOGLE_CLIENT_ID` | De Google Console |
| `GOOGLE_CLIENT_SECRET` | De Google Console |
| `AI_CORE_BASE_URL` | URL pública donde esté expuesto AI Core — **no resuelto todavía**, ver nota del Paso 7.4 |
| `AI_CORE_API_KEY` | La key generada en el Paso 7.2 |

### 11.3 Primer deploy

Haz clic en **"Deploy"**. El proceso tarda ~2 minutos.

### 11.4 Actualizar NEXTAUTH_URL y Google OAuth

Después del primer deploy, Vercel te asigna una URL (ej: `cip-xyz.vercel.app`).

1. En Vercel → Settings → Environment Variables → actualiza `NEXTAUTH_URL` con esa URL
2. En Google Console → Credentials → tu OAuth app → agrega la nueva redirect URI:
   ```
   https://cip-xyz.vercel.app/api/auth/callback/google
   ```
3. Haz un nuevo deploy en Vercel para que tome los cambios

---

## Comandos de referencia rápida

```bash
npm run dev          # Servidor de desarrollo local
npm run build        # Build de producción (prueba antes de deploy)
npm run typecheck    # Verificar tipos TypeScript sin compilar

npx prisma studio    # GUI visual de la base de datos
npx prisma db push   # Sincronizar schema con la DB (sin migraciones)
npx prisma generate  # Regenerar el cliente TypeScript de Prisma
```

---

## Estructura del proyecto

```
career-intelligence-platform/
├── src/
│   ├── app/                    # Next.js pages y API routes
│   ├── domain/                 # Lógica de negocio pura (sin dependencias externas)
│   ├── application/            # Casos de uso (orquestación)
│   ├── infrastructure/         # Prisma, Gemini AI, base de datos
│   ├── components/             # Componentes React
│   ├── hooks/                  # React Query hooks
│   └── lib/                    # Tipos, validadores, utils
├── prisma/
│   └── schema.prisma           # Definición de la base de datos
├── .env                        # Variables de entorno (NO commitear)
├── .env.example                # Plantilla de variables (sí se commitea)
└── vercel.json                 # Configuración de Vercel
```

---

## Próximos pasos de desarrollo

Una vez que el proyecto esté corriendo, el orden recomendado para implementar:

1. **Cargar tus datos** — Agrega tus 4 experiencias, skills y 2 stories desde la UI
2. **Probar el Resume Generator** — Genera tu primer CV con Gemini
3. **Probar el Job Analyzer** — Analiza una oferta de trabajo real
4. **Cover Letter Generator** — Próximo módulo a construir
5. **Interview Coach** — Simulación de entrevistas con Gemini
6. **LinkedIn Optimizer** — Generador de headline y summary

---

¿Problemas? Abre una nueva conversación con Claude y describe el error exacto que aparece en la terminal.
