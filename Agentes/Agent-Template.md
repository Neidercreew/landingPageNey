# Agent Template

**Versión:** 2.0
**Estado:** Activo
**Documento:** Plantilla Oficial de Skills
**Ubicación:** `/agent-template/Agent-Template.md`

---

# 1. Objetivo

Este documento define la estructura obligatoria que debe seguir todo Skill del Framework.

Garantiza consistencia entre todos los especialistas y facilita la creación de nuevos Skills.

Ningún Skill puede ser aprobado si no respeta esta plantilla.

---

# 2. Estructura Oficial

Todo Skill debe contener las siguientes secciones, en este orden exacto:

1. Header de identificación
2. Misión
3. Rol Profesional
4. Mentalidad
5. Objetivo Principal
6. Dependencias
7. Responsabilidades
8. Prioridades
9. Políticas Aplicables (sección opcional)
10. Colabora con
11. Nunca debe
12. Cómo toma decisiones
13. Indicadores de Éxito
14. Entradas Habituales
15. Entregables
16. Criterios de Calidad
17. Modelo Principal (con `## Justificación`)
18. Modelo de Respaldo (con `## Justificación`)
19. Escalamiento
20. Filosofía
21. Historial

La omisión de cualquiera de estas secciones (salvo `Políticas Aplicables` que es opcional) impide la aprobación del Skill.

---

# 3. Plantilla

A continuación se muestra la plantilla base que debe utilizarse para crear un nuevo Skill.

```markdown
# [Nombre del Skill]

Versión: 1.0

Estado: Activo

Nivel: Estratégico | Táctico | Operativo

---

# Misión

[Describe claramente cuál es la responsabilidad principal del agente.]

[Debe responder:]

- ¿Por qué existe este agente?
- ¿Qué problema resuelve?
- ¿Qué responsabilidad posee dentro del Framework?

---

# Rol Profesional

[Especialización profesional.]

[Lista de conocimientos.]

[Áreas de experiencia.]

[Principios generales.]

---

# Mentalidad

[Cómo piensa.]

[Cómo analiza.]

[Qué prioriza.]

[Qué evita.]

[Cuál es su filosofía profesional.]

---

# Objetivo Principal

[Describe cuál es el resultado esperado cuando este agente realiza correctamente su trabajo.]

---

# Dependencias

[Documentos necesarios antes de comenzar.]

Ejemplo:

- MASTER-BRIEF aprobado.
- Arquitectura del sistema.
- Modelo de datos.
- APIs definidas.
- Reglas globales del Framework.

---

# Responsabilidades

- [Responsabilidad 1 — debe comenzar con un verbo.]
- [Responsabilidad 2.]
- [Responsabilidad 3.]

---

# Prioridades

1. [Prioridad 1.]
2. [Prioridad 2.]
3. [Prioridad 3.]

[Nunca utilizar prioridades ambiguas. Siempre numeradas.]

---

# Políticas Aplicables

- Collaboration Policy
- Code Quality Policy
- Model Selection Policy
- Escalation Policy

[Esta sección es opcional. Solo incluirla si el Skill hace referencia explícita a Policies en su trabajo diario.]

---

# Colabora con

- [Skill 1.]
- [Skill 2.]

[No listar agentes innecesarios.]

---

# Nunca debe

- [Prohibición 1.]
- [Prohibición 2.]

[Todo aquello que pertenece a otros agentes.]

---

# Cómo toma decisiones

[Proceso mental.]

[Preguntas que siempre debe responder antes de actuar:]

- ¿[Pregunta 1]?
- ¿[Pregunta 2]?
- ¿[Pregunta 3]?

---

# Indicadores de Éxito

- [Indicador 1 medible.]
- [Indicador 2 medible.]

[¿Cómo sabemos que el agente hizo un buen trabajo? Los indicadores deben ser medibles.]

---

# Entradas Habituales

- [Documento 1.]
- [Contexto 1.]
- [Información 1.]

---

# Entregables

- [Documento 1.]
- [Código 1.]
- [Diagrama 1.]

---

# Criterios de Calidad

Toda propuesta debe ser:

- [Criterio 1.]
- [Criterio 2.]

[Características mínimas que debe cumplir cualquier trabajo realizado por el agente.]

---

# Modelo Principal

[Modelo recomendado.]

## Justificación

[Explicar por qué ese modelo es el más adecuado.]

---

# Modelo de Respaldo

[Segundo modelo recomendado.]

## Justificación

[Explicar cuándo utilizarlo.]

---

# Escalamiento

Situaciones donde debe consultar:

- Usuario
- Chief Software Architect
- Senior Product Manager
- Otro Skill

[Nunca tomar decisiones fuera de su alcance.]

---

# Filosofía

"[Una frase que represente el rol. Debe ser breve y memorable.]"

---

# Historial

## v1.0

[Creación inicial.]
```

---

# 4. Reglas de Formato

- Utilizar `-` (guión markdown) para todas las listas. No mezclar con `•` o `*`.
- Utilizar `## Justificación` (markdown H2) bajo `Modelo Principal` y `Modelo de Respaldo`. No usar `Motivo:` u otros formatos.
- Utilizar `## vX.Y` (markdown H2) para entradas del Historial.
- El header de identificación debe usar el formato:

  ```
  # Nombre del Skill

  Versión: X.Y

  Estado: Activo

  Nivel: Estratégico | Táctico | Operativo
  ```

- Toda referencia a documentos del proyecto debe usar el nuevo flujo oficial (`MASTER-BRIEF`, no `PRD` ni `Brief`).
- El nombre del Framework oficial es `OpenCode Workspace Framework`. No utilizar nombres anteriores como `IA_Code_Setup`.

---

# 5. Niveles de Skill

| Nivel | Descripción |
|---|---|
| Estratégico | Toma decisiones de alto impacto. Define rumbo. No implementa. |
| Táctico | Ejecuta responsabilidades técnicas especializadas. |
| Operativo | Realiza tareas de soporte, documentación o mantenimiento. |

---

# 6. Referencias

- `docs/03-SKILLS.md`
- `docs/07-FRAMEWORK-ARCHITECTURE.md`
- `WORKFLOW.md`
- `/policies/Collaboration-Policy.md`
- `/policies/Code-Quality-Policy.md`
- `/policies/Model-Selection-Policy.md`
- `/policies/Escalation-Policy.md`

---

# 7. Historial

## v2.0

- Estructura formalizada con 21 secciones obligatorias.
- Añadida sección `Políticas Aplicables` como sección opcional.
- Añadidas reglas de formato (bullets unificados, formato de Justificación, formato de Historial).
- Añadida tabla de niveles de Skill.

## v1.0

- Creación inicial.
