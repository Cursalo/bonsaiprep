-- Insert demo courses
INSERT INTO public.courses (id, title, description, slug, category, level, duration_hours, price_credits, published) VALUES
('00000000-0000-0000-0000-000000000001', 'Fundamentos de Inteligencia Artificial', 'Aprende los conceptos básicos de IA desde cero. Un curso completo para principiantes que cubre desde qué es la IA hasta sus aplicaciones prácticas.', 'fundamentos-ia', 'fundamentos-ia', 'beginner', 8, 600, true),
('00000000-0000-0000-0000-000000000002', 'Machine Learning Práctico', 'Domina los algoritmos de aprendizaje automático con ejemplos reales. Incluye Python, scikit-learn y proyectos hands-on.', 'machine-learning-practico', 'machine-learning', 'intermediate', 12, 900, true),
('00000000-0000-0000-0000-000000000003', 'Productividad con IA', 'Descubre herramientas de IA para aumentar tu productividad personal y profesional. ChatGPT, Midjourney, Notion AI y más.', 'productividad-ia', 'productividad', 'beginner', 6, 450, true);

-- Insert demo lessons for Fundamentos IA course
INSERT INTO public.lessons (course_id, title, description, content, order_index, duration_minutes, published) VALUES
('00000000-0000-0000-0000-000000000001', '¿Qué es la Inteligencia Artificial?', 'Introducción a los conceptos fundamentales de la IA', '# ¿Qué es la Inteligencia Artificial?

La **Inteligencia Artificial** (IA) es una rama de la ciencia de la computación que se enfoca en crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.

## Definición

La IA busca desarrollar algoritmos y sistemas que puedan:
- Aprender de datos
- Reconocer patrones
- Tomar decisiones
- Resolver problemas
- Adaptarse a nuevas situaciones

## Tipos de IA

### 1. IA Débil (Narrow AI)
- Diseñada para tareas específicas
- Ejemplos: Siri, recomendaciones de Netflix, filtros de spam

### 2. IA Fuerte (General AI)
- Inteligencia comparable a la humana
- Capaz de realizar cualquier tarea intelectual
- Aún no existe

## Aplicaciones Actuales

- **Reconocimiento de voz**: Asistentes virtuales
- **Visión por computadora**: Detección de objetos
- **Procesamiento de lenguaje**: Traducción automática
- **Sistemas de recomendación**: E-commerce, streaming

## Historia Rápida

- **1950**: Alan Turing propone el "Test de Turing"
- **1956**: Se acuña el término "Inteligencia Artificial"
- **1980s**: Surgen los sistemas expertos
- **2010s**: Boom del Deep Learning
- **2020s**: Era de los modelos de lenguaje masivos', 1, 25, true),

('00000000-0000-0000-0000-000000000001', 'Tipos de Aprendizaje Automático', 'Explora los diferentes enfoques del machine learning', '# Tipos de Aprendizaje Automático

El **Machine Learning** es el motor principal de la IA moderna. Existen tres paradigmas principales:

## 1. Aprendizaje Supervisado

### Características
- Utiliza datos etiquetados
- El algoritmo aprende de ejemplos
- Predice resultados en datos nuevos

### Tipos de Problemas
- **Clasificación**: Predecir categorías
  - Spam vs No spam
  - Gato vs Perro
- **Regresión**: Predecir valores numéricos
  - Precio de casas
  - Temperatura

### Algoritmos Populares
- Regresión Lineal
- Árboles de Decisión
- Random Forest
- Support Vector Machines
- Redes Neuronales

## 2. Aprendizaje No Supervisado

### Características
- No utiliza etiquetas
- Busca patrones ocultos
- Explora la estructura de los datos

### Tipos de Problemas
- **Clustering**: Agrupar datos similares
- **Reducción de dimensionalidad**: Simplificar datos
- **Detección de anomalías**: Encontrar valores atípicos

### Algoritmos Populares
- K-Means
- PCA (Principal Component Analysis)
- DBSCAN

## 3. Aprendizaje por Refuerzo

### Características
- Aprende mediante prueba y error
- Recibe recompensas o castigos
- Optimiza decisiones a largo plazo

### Aplicaciones
- Videojuegos (AlphaGo)
- Robótica
- Sistemas de recomendación
- Trading automático

## Ejemplo Práctico

```python
# Ejemplo simple de clasificación supervisada
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Cargar datos
iris = load_iris()
X, y = iris.data, iris.target

# Dividir datos
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Entrenar modelo
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Evaluar
accuracy = model.score(X_test, y_test)
print(f"Precisión: {accuracy:.2f}")
```', 2, 30, true),

('00000000-0000-0000-0000-000000000001', 'Ética en la Inteligencia Artificial', 'Consideraciones éticas y sociales de la IA', '# Ética en la Inteligencia Artificial

La IA tiene un impacto profundo en la sociedad, lo que hace crucial considerar sus implicaciones éticas.

## Principales Preocupaciones Éticas

### 1. Sesgo y Discriminación
- **Problema**: Los algoritmos pueden perpetuar o amplificar sesgos humanos
- **Ejemplo**: Sistemas de contratación que discriminan por género
- **Solución**: Datasets diversos, auditorías regulares

### 2. Privacidad
- **Problema**: Recolección masiva de datos personales
- **Ejemplo**: Reconocimiento facial en espacios públicos
- **Solución**: Anonimización, consentimiento informado

### 3. Transparencia
- **Problema**: "Cajas negras" - algoritmos incomprensibles
- **Ejemplo**: Decisiones médicas basadas en IA opaca
- **Solución**: IA explicable (XAI)

### 4. Impacto Laboral
- **Problema**: Automatización puede eliminar empleos
- **Ejemplo**: Robots en manufacturas
- **Solución**: Reentrenamiento, nuevos tipos de trabajo

## Principios Éticos para IA

### 1. Beneficencia
- La IA debe beneficiar a la humanidad
- Priorizar el bienestar social

### 2. No Maleficencia
- "No hacer daño"
- Evitar consecuencias negativas

### 3. Autonomía
- Respetar la libertad humana
- Mantener control humano sobre decisiones importantes

### 4. Justicia
- Distribución equitativa de beneficios
- Acceso universal a tecnologías de IA

### 5. Explicabilidad
- Los sistemas deben ser comprensibles
- Transparencia en el proceso de decisión

## Marcos Regulatorios

### Europa
- **GDPR**: Protección de datos
- **AI Act**: Regulación específica para IA

### Estados Unidos
- Iniciativas federales para IA responsable
- Regulaciones sectoriales específicas

### Global
- Partnership on AI
- IEEE Standards for Ethical AI

## Casos de Estudio

### Caso 1: Justicia Predictiva
- **Problema**: Algoritmos que predicen reincidencia criminal
- **Sesgo**: Discriminación racial documentada
- **Lección**: Necesidad de auditorías continuas

### Caso 2: Contratación Automatizada
- **Problema**: Amazon canceló IA de contratación
- **Sesgo**: Discriminaba contra mujeres
- **Lección**: Importancia de datasets balanceados

## Buenas Prácticas

1. **Equipos Diversos**: Incluir múltiples perspectivas
2. **Auditorías Regulares**: Revisar sesgos periódicamente
3. **Transparencia**: Documentar procesos y limitaciones
4. **Participación Ciudadana**: Involucrar a la comunidad
5. **Educación Continua**: Mantenerse actualizado en ética

## Reflexión

La ética en IA no es solo responsabilidad de programadores, sino de toda la sociedad. ¿Cómo podemos asegurar que la IA sirva al bien común?', 3, 35, true);

-- Insert lessons for Machine Learning course
INSERT INTO public.lessons (course_id, title, description, content, order_index, duration_minutes, published) VALUES
('00000000-0000-0000-0000-000000000002', 'Configuración del Entorno Python', 'Prepara tu entorno de desarrollo para ML', '# Configuración del Entorno Python

Antes de comenzar con Machine Learning, necesitamos configurar un entorno de desarrollo robusto.

## Instalación de Python

### Opción 1: Anaconda (Recomendado)
```bash
# Descargar Anaconda desde https://www.anaconda.com/
# Incluye Python + librerías científicas
conda --version
```

### Opción 2: Python Oficial
```bash
# Desde python.org
python --version
pip --version
```

## Librerías Esenciales

### 1. NumPy - Computación Numérica
```bash
pip install numpy
```

```python
import numpy as np

# Arrays eficientes
arr = np.array([1, 2, 3, 4, 5])
print(arr * 2)  # [2 4 6 8 10]
```

### 2. Pandas - Manipulación de Datos
```bash
pip install pandas
```

```python
import pandas as pd

# DataFrames para datos tabulares
df = pd.DataFrame({
    "nombre": ["Ana", "Luis", "María"],
    "edad": [25, 30, 35]
})
print(df)
```

### 3. Matplotlib - Visualización
```bash
pip install matplotlib
```

```python
import matplotlib.pyplot as plt

# Gráficos simples
plt.plot([1, 2, 3, 4], [1, 4, 9, 16])
plt.show()
```

### 4. Scikit-learn - Machine Learning
```bash
pip install scikit-learn
```

### 5. Jupyter - Entorno Interactivo
```bash
pip install jupyter
jupyter notebook
```

## Entorno Virtual

### Crear entorno
```bash
# Con venv
python -m venv ml_env

# Con conda
conda create -n ml_env python=3.9
```

### Activar entorno
```bash
# Windows
ml_env\\Scripts\\activate

# Mac/Linux
source ml_env/bin/activate

# Conda
conda activate ml_env
```

## Verificación de Instalación

```python
# test_installation.py
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import sklearn

print("NumPy:", np.__version__)
print("Pandas:", pd.__version__)
print("Scikit-learn:", sklearn.__version__)
print("¡Todo listo para Machine Learning!")
```

## Jupyter Notebooks

### Ventajas
- Código interactivo
- Visualizaciones inline
- Documentación integrada
- Ideal para experimentación

### Comandos Básicos
- `Shift + Enter`: Ejecutar celda
- `A`: Insertar celda arriba
- `B`: Insertar celda abajo
- `M`: Convertir a Markdown

## Google Colab (Alternativa)

### Ventajas
- No requiere instalación local
- GPU/TPU gratuitas
- Colaboración en tiempo real

### Acceso
1. Ir a colab.research.google.com
2. Crear nuevo notebook
3. ¡Empezar a programar!

## Estructura de Proyecto

```
ml_project/
├── data/
│   ├── raw/
│   └── processed/
├── notebooks/
├── src/
│   ├── data/
│   ├── features/
│   ├── models/
│   └── visualization/
├── requirements.txt
└── README.md
```

## requirements.txt

```
numpy>=1.21.0
pandas>=1.3.0
matplotlib>=3.4.0
scikit-learn>=1.0.0
jupyter>=1.0.0
seaborn>=0.11.0
```

¡Tu entorno está listo para el Machine Learning!', 1, 20, true);

-- Insert sample user (demo purposes)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000099', 'demo@aiclases.com', now(), now(), now());

INSERT INTO public.users (id, email, full_name) VALUES
('00000000-0000-0000-0000-000000000099', 'demo@aiclases.com', 'Usuario Demo');

-- Initialize demo user credits
INSERT INTO public.user_credits (user_id, total_earned, current_balance) VALUES
('00000000-0000-0000-0000-000000000099', 100, 100);

-- Add sample progress
INSERT INTO public.user_progress (user_id, course_id, completed_lessons, total_lessons, last_lesson_id) VALUES
('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000001', 2, 3, '00000000-0000-0000-0000-000000000001');

-- Add sample subscription
INSERT INTO public.user_subscriptions (user_id, subscription_type) VALUES
('00000000-0000-0000-0000-000000000099', 'free');