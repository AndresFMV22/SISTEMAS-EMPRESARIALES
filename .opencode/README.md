# Agentes de NóvaTravel

Los agentes están definidos en `agents/servidor.md` y `agents/interfaz.md`.
Son subagentes y heredan el modelo configurado en la sesión principal.

## Uso

Reinicia OpenCode después de crear o editar estos archivos. En una sesión nueva puedes invocarlos así:

```text
@servidor revisa el esquema y propón el contrato de datos para el asesor.
@interfaz implementa la vista del asesor usando el contrato acordado.
```

También puedes pedir al agente principal que delegue una tarea a cada especialista.
Para trabajar en paralelo, acuerda primero el contrato y asigna archivos distintos.
Servidor se ocupa de datos, autenticación y permisos; interfaz de vistas y componentes.
El agente principal integra los cambios y verifica el flujo completo.

Los agentes no arrancan automáticamente al ejecutar `npm run dev`.
Son herramientas de desarrollo dentro de OpenCode, no usuarios de la aplicación.

## Skills instaladas en el proyecto

Las cinco skills se guardan en `.agents/skills/`. La configuración
`.opencode/opencode.json` registra esa carpeta mediante `skills.paths`.
`skills-lock.json` registra sus fuentes para poder restaurar la instalación.

| Agente | Skills que debe cargar según la tarea |
| --- | --- |
| `@servidor` | `supabase`, `supabase-postgres-best-practices` |
| `@interfaz` | `vercel-react-best-practices`, `web-design-guidelines` |
| Ambos, para comprobar integración | `webapp-testing` |

La relación se establece en las instrucciones de cada agente: las skills
no se cargan todas automáticamente. Se seleccionan cuando son pertinentes.
Sus identificadores oficiales se conservan; el trabajo del proyecto se hace
en español. La skill de pruebas no instala Python, Playwright ni navegadores.

Para consultar la instalación local:

```powershell
npx skills list
```

Reinicia OpenCode para que descubra las skills y las instrucciones actualizadas.
