# AIClases 4.0 - Documentación de Instalación y Deployment

## 🚀 Instalación Local

### Prerrequisitos
- Node.js 18.17+ 
- pnpm 8+
- Docker (opcional para Supabase local)

### 1. Clonar y configurar
```bash
git clone <repository-url> aiclases-4.0
cd aiclases-4.0
pnpm install
```

### 2. Variables de entorno
Copiar y configurar variables:
```bash
cp .env.example .env.local
```

**Configuración mínima requerida:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# OpenAI (fallback MentorAI)
OPENAI_API_KEY=your_openai_key

# MCP Tools
BRAVE_API_KEY=your_brave_search_key
CONTEXT7_API_KEY=your_context7_key

# Pagos
STRIPE_SECRET_KEY=sk_test_xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
```

### 3. Base de datos Supabase

#### Opción A: Supabase Cloud
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar migraciones:
```bash
pnpm supabase:migrate
pnpm supabase:seed
```

#### Opción B: Supabase Local
```bash
pnpm supabase:start
pnpm supabase:migrate:local
pnpm supabase:seed:local
```

### 4. Configurar Context7 MCP (Opcional)

Para funcionalidad completa de auto-actualización:

#### Instalación del MCP Server
```bash
# Instalar Context7 MCP globalmente
npm install -g @upstash/context7-mcp

# O usar npx (recomendado)
npx -y @upstash/context7-mcp
```

#### Configuración para Claude Desktop
Agregar a `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

#### Configuración para Claude Code
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

### 5. Iniciar desarrollo
```bash
pnpm dev
```

Aplicación disponible en `http://localhost:3000`

## 🌐 Deploy en Vercel

### Deploy automático (recomendado)

1. **Conectar repositorio:**
   - Fork/clone repositorio
   - Conectar en [vercel.com](https://vercel.com)

2. **Variables de entorno en Vercel:**
```bash
# Producción
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
NEXTAUTH_SECRET=random_string_32_chars
NEXTAUTH_URL=https://aiclases.vercel.app
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_live_xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
BRAVE_API_KEY=xxx
CONTEXT7_API_KEY=your_context7_key
```

3. **Configuración Build:**
   - Framework Preset: `Next.js`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

### Deploy manual via CLI
```bash
npm i -g vercel
vercel --prod
```

### Variables adicionales para producción
```env
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=xxxxx

# SEO
NEXT_PUBLIC_DOMAIN=https://aiclases.com
```

## 📱 Prueba PWA

### Desktop (Chrome/Edge)
1. Abrir `https://aiclases.vercel.app`
2. Icono "Instalar app" en barra de direcciones
3. Click "Instalar"

### Mobile (iOS/Android)
1. Abrir en Safari/Chrome móvil
2. **iOS:** Share → "Add to Home Screen"
3. **Android:** Menu → "Add to Home Screen"

### Verificación PWA
```bash
# Lighthouse CLI
npm i -g lighthouse
lighthouse https://aiclases.vercel.app --only-categories=pwa
```

**Checklist PWA:**
- ✅ Manifest.json válido
- ✅ Service Worker registrado
- ✅ Iconos 192px y 512px
- ✅ Offline fallback básico
- ✅ HTTPS habilitado
- ✅ Splash screen
- ✅ Theme color configurado

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Servidor desarrollo
pnpm build            # Build producción
pnpm start            # Servidor producción
pnpm lint             # ESLint check
pnpm type-check       # TypeScript check

# Base de datos
pnpm supabase:start   # Supabase local
pnpm supabase:stop    # Detener Supabase local
pnpm supabase:migrate # Aplicar migraciones
pnpm supabase:seed    # Poblar datos demo

# Testing
pnpm test             # Jest + Testing Library
pnpm test:e2e         # Playwright E2E
pnpm storybook        # Componentes Storybook

# Turborepo
pnpm build:all        # Build todos los packages
pnpm lint:all         # Lint monorepo completo
pnpm clean            # Limpiar node_modules
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Vercel Analytics:** Habilitado por defecto
- **Core Web Vitals:** Tracking automático
- **Real User Monitoring:** Via Vercel Speed Insights

### Error Tracking
```bash
# Opcional: Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### SEO Monitoring
- **Google Search Console:** Configurar propiedad
- **Sitemap:** Auto-generado en `/sitemap.xml`
- **Robots.txt:** Configurado para producción

## 🚨 Troubleshooting

### Error: "Cannot connect to Supabase"
```bash
# Verificar variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Reiniciar servicios
pnpm supabase:restart
```

### Error: "NextAuth session undefined"
```bash
# Regenerar secret
openssl rand -base64 32

# Actualizar NEXTAUTH_SECRET y reiniciar
```

### PWA no instala
- Verificar HTTPS habilitado
- Comprobar manifest.json válido
- Service Worker registrado correctamente
- Lighthouse PWA score > 90

### Build falla en Vercel
```bash
# Verificar TypeScript localmente
pnpm type-check

# Verificar dependencias
pnpm install --frozen-lockfile
```

## 📚 Recursos Adicionales

- [Documentación Supabase](https://supabase.com/docs)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Vercel Deployment](https://vercel.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Turborepo Docs](https://turbo.build/repo/docs)

## 📞 Soporte

**Issues técnicos:** GitHub Issues
**Consultas generales:** [support@aiclases.com](mailto:support@aiclases.com)
**Documentación:** `/docs/` directorio