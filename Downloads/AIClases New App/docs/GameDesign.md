# AIClases 4.0 - Game Design & Economía AICredits

## 🎮 Filosofía de Gamificación

### Principios Core
1. **Progreso Significativo:** Cada acción contribuye al crecimiento real del usuario
2. **Autonomía:** El usuario controla su ritmo de aprendizaje y gasto de créditos
3. **Maestría:** Sistema de niveles reflejante de competencia real en IA
4. **Propósito:** Créditos conectan directamente con objetivos educativos

### Psicología del Engagement
- **Flow State:** Dificultad progresiva manteniendo challenge/skill balance
- **Variable Rewards:** Bonificaciones sorpresa por rachas y logros especiales
- **Social Proof:** Leaderboards y badges públicos opcionales
- **Loss Aversion:** Streaks que se pueden perder, pero con recovery mecánicas

## 💰 Economía AICredits

### Definición de AICredits
**AICredits (AC)** es la moneda unificada que mide y recompensa el compromiso educativo del usuario. Funciona como:
- 🎯 **Sistema de Progreso:** Refleja avance real en conocimientos IA
- 💡 **Moneda Funcional:** Permite acceder a contenido premium y servicios
- 🏆 **Motivador Intrínseco:** Gamifica el proceso de aprendizaje

### Conversión de Referencia
```
1 AICredit ≈ 1 minuto de tiempo educativo de calidad
100 AC ≈ 1 hora de aprendizaje concentrado
2,500 AC ≈ 1 mes de suscripción AIClases+
```

## 📈 Sistema de Ganancia de AICredits

### Actividades Base (Daily Earnings)

#### 1. Completar Lecciones
```typescript
const lessonRewards = {
  // Lecciones cortas (5-10 min)
  micro: { base: 15, time_bonus: 5 },
  
  // Lecciones estándar (15-25 min)  
  standard: { base: 20, time_bonus: 0 },
  
  // Lecciones avanzadas (30-45 min)
  advanced: { base: 35, time_bonus: -5 },
  
  // Workshops prácticos (60+ min)
  workshop: { base: 60, time_bonus: -10 }
}

// Fórmula final
credits = base + time_bonus + quality_multiplier + streak_bonus
```

**Multiplicadores de Calidad:**
- ⚡ **Terminada sin salir:** +25%
- 🧠 **Notas tomadas:** +15% 
- 🔄 **Revisitada < 7 días:** +10%
- 📱 **Completada en móvil:** +5%

#### 2. Quizzes y Evaluaciones
```typescript
const quizRewards = {
  // Quiz estándar (5-8 preguntas)
  standard: {
    perfect: 10,      // 100% correcto
    good: 7,          // 80-99% correcto
    passed: 5,        // 60-79% correcto
    failed: 2         // <60% (crédito de participación)
  },
  
  // Quiz de certificación
  certification: {
    perfect: 25,
    good: 18,
    passed: 12,
    failed: 5
  }
}
```

#### 3. Interacción con MentorAI
```typescript
const mentorRewards = {
  // Por hacer pregunta válida
  question: 2,
  
  // Por seguir sugerencia del mentor
  follow_suggestion: 3,
  
  // Por feedback positivo al mentor
  helpful_feedback: 2,
  
  // Límite diario
  daily_cap: 30
}
```

#### 4. Streaks (Rachas de Estudio)
```typescript
const streakBonuses = {
  3: 10,    // 3 días consecutivos
  7: 25,    // 1 semana
  14: 50,   // 2 semanas  
  30: 100,  // 1 mes
  60: 200,  // 2 meses
  90: 350,  // 3 meses (máximo)
}

// Multiplicador de racha
const streakMultiplier = Math.min(1 + (streak_days * 0.02), 1.5)
```

#### 5. Actividades Sociales
```typescript
const socialRewards = {
  // Referir nuevo usuario que se registra
  referral_signup: 50,
  
  // Referido completa primer curso
  referral_complete: 80,
  
  // Límite mensual de referidos
  referral_monthly_cap: 3,
  
  // Compartir logro en redes (1/día)
  social_share: 3,
  
  // Review de curso (1 por curso)
  course_review: 8,
  
  // Responder en foro comunitario
  forum_answer: 5,
  forum_daily_cap: 25
}
```

### Daily Caps y Soft Limits

#### Hard Cap Diario
```typescript
const dailyCaps = {
  free_user: 100,      // Usuarios gratuitos
  course_owner: 200,   // Propietarios de curso individual
  plus_subscriber: 300 // Suscriptores AIClases+
}
```

#### Soft Cap System
Después de 300 AC/día, todas las recompensas se reducen al 50%:
```typescript
function calculateReward(baseReward: number, dailyEarned: number) {
  if (dailyEarned >= 300) {
    return Math.floor(baseReward * 0.5)
  }
  return baseReward
}
```

## 💸 Sistema de Gasto de AICredits

### Contenido Premium
```typescript
const contentCosts = {
  // Cursos completos
  course_basic: 600,        // Curso introducción (6-8h)
  course_intermediate: 900, // Curso intermedio (10-12h) 
  course_advanced: 1200,   // Curso avanzado (15-20h)
  course_specialization: 1800, // Especialización (25-30h)
  
  // Contenido individual
  premium_lesson: 45,      // Lección premium individual
  workshop_access: 120,    // Workshop en vivo
  template_download: 120,  // Plantillas/recursos
  ebook_download: 180,     // eBooks especializados
}
```

### Servicios MentorAI Premium
```typescript
const mentorCosts = {
  // Mensajes adicionales (después del límite diario)
  extra_message: {
    free: 3,        // Usuarios free: 3 AC por mensaje extra
    course: 2,      // Propietarios de curso: 2 AC
    plus: 1         // AIClases+: 1 AC (casi simbólico)
  },
  
  // Análisis personalizado de código
  code_review: 25,
  
  // Roadmap personalizado de aprendizaje
  custom_roadmap: 50,
  
  // Sesión 1-on-1 virtual (30 min)
  virtual_session: 300
}
```

### Power-ups y Boosts
```typescript
const boosts = {
  // Multiplicadores temporales
  double_xp_24h: 40,       // 2x créditos por 24h
  double_xp_7d: 200,       // 2x créditos por 7 días
  
  // Accesos especiales
  early_access: 80,        // Acceso temprano a nuevos cursos
  beta_features: 60,       // Features experimentales
  
  // Personalización
  custom_avatar: 30,       // Avatar personalizado
  profile_badge: 20,       // Badge especial en perfil
  
  // Utilidades
  course_preview: 15,      // Preview completo antes de comprar
  skip_prerequisites: 100  // Saltar prerrequisitos de curso
}
```

## 🏆 Sistema de Niveles

### Cálculo de Nivel
```typescript
function calculateLevel(totalCredits: number): number {
  return Math.floor(Math.sqrt(totalCredits / 100)) + 1
}

// Ejemplos de progresión
const levelExamples = {
  1: 0,        // Nivel inicial
  2: 100,      // 100 AC totales
  3: 400,      // 400 AC totales  
  4: 900,      // 900 AC totales
  5: 1600,     // 1,600 AC totales
  10: 8100,    // 8,100 AC totales
  15: 19600,   // 19,600 AC totales
  20: 36100,   // 36,100 AC totales
  25: 57600,   // 57,600 AC totales (usuario power)
}
```

### Beneficios por Nivel
```typescript
const levelBenefits = {
  5: {
    unlock: "Custom study schedule",
    bonus: "5% faster credit earning"
  },
  10: {
    unlock: "Private community access", 
    bonus: "Course preview for free"
  },
  15: {
    unlock: "Monthly 1-on-1 mentor session",
    bonus: "10% discount on premium courses"
  },
  20: {
    unlock: "Beta tester status",
    bonus: "Free monthly course of choice"
  },
  25: {
    unlock: "AIClases Ambassador status",
    bonus: "Revenue sharing program"
  }
}
```

## 🎖️ Sistema de Badges y Logros

### Badges de Progreso
```typescript
const progressBadges = {
  // Milestones de cursos
  "first_course": { credits: 50, icon: "🎓" },
  "course_collector": { courses: 5, credits: 100, icon: "📚" },
  "knowledge_seeker": { courses: 10, credits: 200, icon: "🔍" },
  "ai_expert": { courses: 20, credits: 500, icon: "🤖" },
  
  // Milestones de tiempo
  "week_warrior": { streak: 7, credits: 75, icon: "⚡" },
  "month_master": { streak: 30, credits: 300, icon: "🏆" },
  "quarter_champion": { streak: 90, credits: 750, icon: "👑" },
  
  // Especialización
  "productivity_pro": { category: "productivity", courses: 3, icon: "⚙️" },
  "coding_ninja": { category: "programming", courses: 3, icon: "💻" },
  "content_creator": { category: "content", courses: 3, icon: "✍️" },
  "soft_skills_sage": { category: "soft-skills", courses: 3, icon: "🧠" }
}
```

### Badges Especiales
```typescript
const specialBadges = {
  // Comportamiento excepcional  
  "early_adopter": { condition: "registered_first_1000", icon: "🚀" },
  "feedback_champion": { reviews: 20, helpful_votes: 100, icon: "⭐" },
  "community_helper": { forum_answers: 50, upvotes: 200, icon: "🤝" },
  "night_owl": { late_sessions: 30, icon: "🦉" },
  "weekend_learner": { weekend_sessions: 20, icon: "📅" },
  
  // Logros únicos
  "perfect_student": { perfect_quizzes: 25, icon: "💯" },
  "mentor_whisperer": { mentor_interactions: 200, icon: "🗣️" },
  "sharing_caring": { referrals: 10, icon: "💝" },
  "mobile_master": { mobile_sessions: 100, icon: "📱" }
}
```

## 🏅 Leaderboards y Competencia

### Leaderboards Semanales
```typescript
const leaderboardTypes = {
  // Leaderboard principal (créditos ganados esta semana)
  weekly_credits: {
    top_10_reward: 200,
    top_3_reward: 300,
    winner_reward: 500,
    reset: "sunday_midnight"
  },
  
  // Especializado por categoría
  category_leader: {
    categories: ["productivity", "programming", "content", "soft-skills"],
    winner_reward: 150,
    reset: "monthly"
  },
  
  // Leaderboard de streaks
  streak_masters: {
    minimum_streak: 7,
    winner_reward: 250,
    reset: "never" // All-time leaderboard
  }
}
```

### Competencias Especiales
```typescript
const seasonalEvents = {
  // Eventos temáticos mensuales
  "ai_september": {
    duration: "september",
    bonus_multiplier: 1.5,
    special_courses: ["latest_ai_trends"],
    exclusive_badge: "september_ai_pioneer"
  },
  
  // Hackathons trimestrales
  "quarterly_hackathon": {
    duration: "72_hours",
    entry_cost: 100,
    prizes: [1000, 500, 250], // Top 3
    project_submission: true
  }
}
```

## 📊 Balancing y Economy Health

### Anti-Abuse Mechanisms
```typescript
const antiFraud = {
  // Detección de comportamiento artificial
  session_time_validation: {
    minimum_lesson_time: 0.3, // 30% del tiempo esperado
    maximum_speedup: 3.0      // Máximo 3x velocidad
  },
  
  // Rate limiting
  action_cooldowns: {
    quiz_retake: "1_hour",
    course_start: "5_minutes", 
    mentor_question: "30_seconds"
  },
  
  // Validación humana
  periodic_captcha: {
    trigger_threshold: 500, // Cada 500 AC ganados
    failure_penalty: "temp_ban_24h"
  }
}
```

### Economic Monitoring
```typescript
const healthMetrics = {
  // Métricas clave a monitorear
  daily_inflation: "credits_earned / credits_spent",
  user_progression_rate: "avg_level_gain_per_week",
  premium_conversion: "credits_to_purchase_ratio",
  
  // Alertas automáticas
  triggers: {
    inflation_above_1_5: "reduce_daily_caps",
    progression_below_0_3: "increase_base_rewards", 
    conversion_below_0_1: "review_premium_pricing"
  }
}
```

### A/B Testing Framework
```typescript
const experimentGroups = {
  // Tests continuos de balance
  credit_rewards: {
    control: "current_rates",
    variant_a: "increased_10_percent",
    variant_b: "decreased_10_percent",
    success_metric: "7_day_retention"
  },
  
  // Tests de nuevas mecánicas
  streak_bonuses: {
    control: "linear_bonus",
    variant_a: "exponential_bonus",
    variant_b: "milestone_bonus",
    success_metric: "average_streak_length"
  }
}
```

## 🎯 Implementación Técnica

### Database Schema
```sql
-- Tabla principal de créditos de usuario
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  level INTEGER GENERATED ALWAYS AS (floor(sqrt(total_earned / 100)) + 1) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Historial de transacciones
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL, -- Positivo = ganado, Negativo = gastado
  transaction_type VARCHAR(50) NOT NULL, -- 'lesson_complete', 'quiz_perfect', etc.
  reference_id UUID, -- ID de la lección/curso/etc relacionado
  metadata JSONB, -- Datos adicionales contextuales
  created_at TIMESTAMP DEFAULT NOW()
);

-- Badges y logros
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  badge_id VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  credits_awarded INTEGER DEFAULT 0,
  UNIQUE(user_id, badge_id)
);

-- Streaks de usuario
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_count INTEGER DEFAULT 0 -- Para mecánica de "proteger racha"
);
```

### API Endpoints
```typescript
// Endpoints principales del sistema de créditos
const creditEndpoints = {
  "POST /api/credits/award": "Otorgar créditos por acción",
  "POST /api/credits/spend": "Gastar créditos en contenido/servicios", 
  "GET /api/credits/balance": "Obtener balance actual del usuario",
  "GET /api/credits/history": "Historial de transacciones",
  "GET /api/leaderboard": "Ranking de usuarios",
  "POST /api/badges/check": "Verificar si se ganó nuevo badge"
}
```

Este sistema de gamificación está diseñado para evolucionar con feedback de usuarios reales y métricas de engagement, manteniendo siempre el foco en el aprendizaje genuino por encima de la mecánica de juego.