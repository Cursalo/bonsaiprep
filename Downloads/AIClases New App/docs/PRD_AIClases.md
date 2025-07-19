# AIClases 4.0 - Product Requirements Document

## 🎯 Visión del Producto

### Misión
Democratizar el acceso a la educación en Inteligencia Artificial mediante una plataforma que se auto-actualiza con los últimos avances tecnológicos, garantizando que el conocimiento impartido sea siempre relevante y actual.

### Visión 2025
Ser la escuela digital de referencia en IA para Europa y Latinoamérica, con más de 100,000 estudiantes activos y cursos que se actualizan automáticamente con papers, noticias y repositorios publicados en las últimas 48 horas.

### Propuesta de Valor Única
**"Cursos de IA que nunca se vuelven obsoletos"** - Contenido educativo que evoluciona en tiempo real con la industria.

## 📊 Métricas SMART

### Objetivos Q1 2025 (Específico, Medible, Alcanzable, Relevante, Temporal)

#### 1. Adquisición de Usuarios
- **Específico:** Alcanzar 5,000 usuarios registrados
- **Medible:** Tracking via Vercel Analytics + Supabase
- **Alcanzable:** 167 registros/día promedio
- **Relevante:** Base crítica para feedback y monetización
- **Temporal:** 31 de marzo 2025
- **KPI:** Tasa de conversión landing → registro ≥ 8%

#### 2. Engagement y Retención
- **Específico:** 70% completación promedio de cursos iniciados
- **Medible:** `completed_lessons / total_lessons * 100`
- **Alcanzable:** Basado en mejores prácticas EdTech
- **Relevante:** Indicador clave de calidad educativa
- **Temporal:** Promedio móvil 30 días
- **KPI Secundario:** Tiempo promedio en plataforma ≥ 45 min/sesión

#### 3. Monetización
- **Específico:** $25,000 USD en ingresos mensuales recurrentes (MRR)
- **Medible:** Stripe + MercadoPago webhooks
- **Alcanzable:** 1,250 suscripciones AIClases+ @ $20/mes
- **Relevante:** Sostenibilidad financiera del proyecto
- **Temporal:** Junio 2025
- **KPI:** Customer Lifetime Value (CLV) ≥ $120

#### 4. Calidad del Contenido
- **Específico:** 95% de lecciones actualizadas en últimos 30 días
- **Medible:** `updated_lessons / total_lessons * 100`
- **Alcanzable:** Automatización MCP + cron jobs
- **Relevante:** Diferenciador clave vs competencia
- **Temporal:** Monitoreo continuo
- **KPI:** Net Promoter Score (NPS) ≥ 50

#### 5. Expansión Geográfica
- **Específico:** Presencia activa en 8 países (ES, MX, AR, BR, CO, PE, CL, US)
- **Medible:** Distribución geográfica de usuarios
- **Alcanzable:** Marketing digital localizado
- **Relevante:** Mercado objetivo paneuropeo-latinoamericano
- **Temporal:** Diciembre 2025
- **KPI:** ≥5% usuarios por país objetivo

## 🗓️ Roadmap 6 Sprints (Q1-Q2 2025)

### Sprint 1: Fundación (2 semanas) - Feb 3-14, 2025
**Objetivo:** Plataforma base funcional con autenticación y estructura

**Entregables:**
- ✅ Configuración Turborepo + Next.js 14
- ✅ Sistema de autenticación NextAuth + Supabase
- ✅ Design system básico (@aiclases/ui)
- ✅ Landing page con Bento Grid
- ✅ Schema base de datos (usuarios, cursos, progreso)

**Criterios de Aceptación:**
- [ ] Usuario puede registrarse/iniciar sesión
- [ ] Landing page responsive 360px+
- [ ] Lighthouse ≥ 85 en todos los scores
- [ ] Deploy automático en Vercel

### Sprint 2: Contenido y MentorAI (2 semanas) - Feb 17-28, 2025
**Objetivo:** Sistema de cursos básico con IA mentor

**Entregables:**
- ✅ Player de cursos con MDX
- ✅ MentorAI integrado (OpenAI GPT-4o Mini)
- ✅ Sistema de AICredits básico
- ✅ 2 cursos demo multilingües (ES/EN)
- ✅ Progreso de usuario tracking

**Criterios de Aceptación:**
- [ ] Usuario puede consumir lección completa
- [ ] MentorAI responde en <3 segundos
- [ ] AICredits se otorgan/deducen correctamente
- [ ] Cambio de idioma funcional

### Sprint 3: Auto-Actualización (2 semanas) - Mar 3-14, 2025
**Objetivo:** Implementar MCP tools y contenido dinámico

**Entregables:**
- ✅ Integración MCP brave.search
- ✅ Cron job nightly actualización
- ✅ Componente `<FetchLatest />`
- ✅ ISR para cursos
- ✅ Context7 MCP para ejemplos dinámicos

**Criterios de Aceptación:**
- [ ] Contenido se actualiza automáticamente cada 24h
- [ ] Ejemplos dinámicos en lecciones
- [ ] Performance no se degrada con contenido fresco
- [ ] Error handling robusto para APIs externas

### Sprint 4: Monetización (2 semanas) - Mar 17-28, 2025
**Objetivo:** Sistema de pagos y suscripciones

**Entregables:**
- ✅ Integración Stripe + MercadoPago
- ✅ Planes de suscripción
- ✅ Paywall inteligente
- ✅ Dashboard financiero usuario
- ✅ Webhooks de pagos

**Criterios de Aceptación:**
- [ ] Usuario puede suscribirse exitosamente
- [ ] Acceso a contenido premium funciona
- [ ] Facturación automática mensual
- [ ] Soporte múltiples monedas (USD, EUR, MXN, BRL, ARS)

### Sprint 5: Gamificación Avanzada (2 semanas) - Mar 31 - Abr 11, 2025
**Objetivo:** Sistema completo de gamificación y social

**Entregables:**
- ✅ Niveles y badges
- ✅ Leaderboards semanales
- ✅ Sistema de referidos
- ✅ Racha de estudio (streaks)
- ✅ Certificados digitales

**Criterios de Aceptación:**
- [ ] Niveles se calculan correctamente
- [ ] Leaderboards actualizan en tiempo real
- [ ] Certificados se generan como PDF
- [ ] Sistema de referidos otorga créditos

### Sprint 6: PWA y Optimización (2 semanas) - Abr 14-25, 2025
**Objetivo:** Experiencia móvil completa y optimizaciones

**Entregables:**
- ✅ PWA completa (offline, installable)
- ✅ Optimizaciones Core Web Vitals
- ✅ Push notifications
- ✅ Analytics avanzados
- ✅ SEO técnico completo

**Criterios de Aceptación:**
- [ ] PWA score Lighthouse ≥ 95
- [ ] App instalable en móviles
- [ ] Core Web Vitals en verde
- [ ] Funcionalidad básica offline

## 👥 Segmentos de Usuario

### Segmento Primario: "Profesionales Tech Evolving" (60%)
- **Demografía:** 25-40 años, desarrolladores/diseñadores/PM
- **Motivación:** Mantenerse relevante en mercado laboral
- **Pain Points:** Falta de tiempo, contenido obsoleto, costos altos
- **Valor:** Cursos concentrados, siempre actualizados, flexibles

### Segmento Secundario: "Estudiantes Universitarios" (25%)
- **Demografía:** 18-25 años, carreras STEM
- **Motivación:** Complementar educación formal
- **Pain Points:** Teoría vs práctica, acceso a recursos premium
- **Valor:** Contenido práctico, precios estudiantiles, mentorías

### Segmento Terciario: "Executives Curious" (15%)
- **Demografía:** 35-55 años, líderes empresariales
- **Motivación:** Entender impacto IA en sus industrias
- **Pain Points:** Jerga técnica, tiempo limitado
- **Valor:** Cursos ejecutivos, casos de uso empresariales

## 🏆 Diferenciadores Competitivos

### 1. Auto-Actualización Inteligente
**Competencia:** Coursera, Udemy (contenido estático)
**Nosotros:** Cursos evolucionan con industria vía MCP (brave.search, Context7, fetch.http)

### 2. MentorAI Contextual
**Competencia:** Chatbots genéricos
**Nosotros:** IA entrenada en contenido específico del curso

### 3. Economía Gamificada
**Competencia:** Sistemas de puntos básicos
**Nosotros:** AICredits como moneda funcional

### 4. Foco Paneuropeo-Latinoamericano
**Competencia:** Plataformas US-céntricas
**Nosotros:** Contenido localizado, precios regionales

## 📈 Proyecciones Financieras

### Modelo de Ingresos
```
Freemium + Suscripciones + Cursos Individuales

Año 1 (2025):
- Usuarios Totales: 15,000
- Conversión Pago: 12%
- ARPU: $18/mes
- Ingresos Anuales: $388,800

Año 2 (2026):
- Usuarios Totales: 50,000  
- Conversión Pago: 15%
- ARPU: $22/mes
- Ingresos Anuales: $1,980,000

Año 3 (2027):
- Usuarios Totales: 120,000
- Conversión Pago: 18%
- ARPU: $25/mes
- Ingresos Anuales: $6,480,000
```

### Costos Operativos Proyectados
- **Infraestructura:** $2,000/mes (Vercel Pro + Supabase Pro)
- **APIs IA:** $5,000/mes (OpenAI + MCP tools)
- **Marketing:** $15,000/mes (contenido + ads)
- **Personal:** $25,000/mes (4 FTE por año 2)

## ⚠️ Riesgos y Mitigaciones

### Riesgo Técnico: Dependencia APIs Externas
- **Probabilidad:** Media
- **Impacto:** Alto
- **Mitigación:** Fallbacks múltiples, rate limiting, caching agresivo

### Riesgo Mercado: Competencia Big Tech
- **Probabilidad:** Alta
- **Impacto:** Alto  
- **Mitigación:** Foco en nicho, velocidad de innovación, comunidad

### Riesgo Financiero: Costos IA Escalables
- **Probabilidad:** Media
- **Impacto:** Medio
- **Mitigación:** Optimización de prompts, modelos propios a largo plazo

### Riesgo Regulatorio: Cambios en IA
- **Probabilidad:** Media
- **Impacto:** Medio
- **Mitigación:** Compliance proactivo, diversificación geográfica

## 🎯 Success Metrics Dashboard

### Métricas de Producto (Weekly)
- DAU/MAU ratio ≥ 0.25
- Course completion rate ≥ 70%
- MentorAI satisfaction ≥ 4.5/5
- Content freshness index ≥ 95%

### Métricas de Negocio (Monthly)
- MRR growth rate ≥ 15%
- Customer Acquisition Cost (CAC) ≤ $25
- Churn rate ≤ 5%
- Net Revenue Retention ≥ 110%

### Métricas Técnicas (Daily)
- API uptime ≥ 99.9%
- Page load time ≤ 2s
- Error rate ≤ 0.1%
- Core Web Vitals score ≥ 90

Este PRD sirve como documento vivo que se actualiza cada sprint con learnings y métricas reales del mercado.