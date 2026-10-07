# Convoltaje Landing Page

## Descripción del Proyecto
Landing page para Convoltaje (sistemas de energía solar, PowerStations e insumos) en Cuba. Cuenta con catálogo, calculadora solar interactiva y generación de prefacturas en PDF.

## Estructura del Proyecto
- `src/components/`: Componentes de interfaz compartidos
- `src/components/calculator/`: Pasos interactivos de la calculadora solar
- `src/hooks/`: Custom hooks
- `src/lib/`: Lógica de utilidades, generación de PDFs, catálogo y configuraciones
- `archive/`: Código no utilizado actualmente pero preservado

## Stack
React + Vite + TypeScript + Tailwind + shadcn/ui + wouter

## Reglas del Proyecto
1. El catálogo de productos vive en `src/lib/products.ts` — la fuente de verdad para precios y productos es [elyerromenu.com](https://elyerromenu.com/b/convoltaje).
2. El número de WhatsApp oficial debe ser consistente en todo el código (+53 53097058 / +5353097058).
3. La generación de PDF de prefacturas debe usar contenido real, nunca usar `alert()`.
4. Tintaflash está fuera de scope por ahora — no tocar `TintaflashSection.tsx` ni archivos relacionados sin instrucción explícita.
5. Cualquier cambio de UI debe respetar el sistema de diseño: 
   - Colores: primary `#0F3A7D`, secondary/cyan `#00D9FF`, accent coral `#FF6B35`
   - Fuentes: Poppins para display/accent e Inter para body.
6. **Regla de Borrado**: Antes de borrar o mover archivos, SIEMPRE hay que confirmar con el usuario si no está 100% claro que no se usan.
7. **Control de Versiones (Git)**: Cada cambio o conjunto de tareas probado y confirmado por el usuario debe terminar en un commit de Git con un mensaje descriptivo y claro. No hacer push ni vincular a remotos sin consultar primero.
8. **Cómo correr el proyecto**: Ejecutar `npm install && npm run dev`
9. **Reglas de Integración con Obsidian y OpenCode**:
   - El vault de Obsidian en `/Users/rodyfigueroa/Movies/Viralist Obsidian/ReloNL/Convoltaje/` es de **LECTURA Y ESCRITURA para logs de sesión únicamente**.
   - **Solo escribir** en `Convoltaje/Sesiones/YYYY-MM-DD.md` al cerrar cada sesión.
   - **NUNCA modificar** archivos en `Convoltaje/Decisiones/` ni `Convoltaje/Productos/` — esas carpetas las maneja exclusivamente OpenCode.
   - El repo de GitHub sigue siendo el territorio exclusivo de Antigravity para todo el código y `AGENTS.md`.

## Protocolo de Reinicio de Sesión (LLM Wiki)

Para evitar recargar millones de tokens de caché al iniciar una nueva sesión, **siempre** sigue estos pasos al arrancar:

1. Lee estos 3 archivos en orden para restaurar el contexto completo en < 5.000 tokens:
   - `README.md` en el vault de Obsidian (visión general del proyecto)
   - Este archivo `AGENTS.md` (reglas y configuración del proyecto)
   - `Contexto-Actual.md` en el vault de Obsidian (estado actual del proyecto)
   - El archivo de sesión más reciente en `Sesiones/YYYY-MM-DD.md`

2. Después de leerlos, confirma al usuario:
   "Contexto restaurado desde Obsidian. Última sesión: [fecha]. Pendientes: [lista de pendientes]."

3. Si el usuario pide "continuar", retoma exactamente desde donde quedó la última sesión.

4. **Siempre** registra el resumen de la sesión en `Sesiones/YYYY-MM-DD.md` al cerrar.

## Configuración del Entorno
`OBSIDIAN_VAULT=/Users/rodyfigueroa/Movies/Viralist Obsidian/ReloNL/Convoltaje`

## Contexto y Reglas Extendidas
Adicionalmente, revisa los siguientes archivos en `.agents/rules/` para guías detalladas:
- `.agents/rules/project-context.md`: Contexto del negocio y el proyecto.
- `.agents/rules/mobile-first.md`: **OBLIGATORIO LEER ANTES DE CUALQUIER CAMBIO DE UI**. Contiene checklist y reglas de validación responsive.
- `.agents/rules/known-issues.md`: Lista viva de problemas y verificaciones pendientes.

## Lista de Tareas Pendientes Conocidas
1. Verificar en el sitio live (Netlify) los 3 bugs solucionados recientemente (imagen AC 3000W, botón comparador, scroll al catálogo en "Volver").
2. Esperar feedback general del cliente (Angel).
3. Imagen de "Samuel el Panel" para el Hero sigue siendo un placeholder temporal (solucionapagon.jpg) — falta decidir si se genera arte oficial de la mascota o se cambia el enfoque visual del Hero.
4. Crear librería de manuales de usuario.
5. Desarrollar sistema de captura de leads más robusto — base de datos automatizada (tipo Excel/CRM) de las conversaciones con la comercial, y un sistema de encuestas de satisfacción post-venta que le lleguen directamente al dueño para evaluar el desempeño del equipo comercial. Esto está en fase de definición (Fase 2).

66. **Identidad Visual Móvil (Dashboard)**: El layout del Panel de Administración (`MobileHomeGrid`, `DashboardPanel`) **SIEMPRE** debe mantener su fondo azul oscuro institucional (`bg-[#0b3c8f]`) y modo oscuro para componentes base (glassmorphism `bg-white/5`, textos blancos). NUNCA revertir a fondos blancos (`bg-slate-50`) ni esquemas claros.

67. **Orden visual de catálogo**: Siempre que las imágenes estén disponibles, la prioridad de la galería de fotos de un equipo en la Landing Page debe ser: 1) Foto del Equipo en sí, 2) Foto con el Cliente (social proof), y 3) Foto de los Paneles. Esto se debe respetar en la propiedad `images` de `src/lib/products.ts`.
