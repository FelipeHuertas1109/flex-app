## Stack

- Este proyecto usa Next.js 16, React 19, TypeScript estricto y Tailwind CSS 4 via `@tailwindcss/postcss`.
- Las APIs y convenciones de Next pueden diferir del material de entrenamiento; contrastar con el codigo del repo y la [documentacion oficial de Next.js](https://nextjs.org/docs) cuando haga falta.

## Arquitectura frontend

- La aplicacion vive bajo `src/` para separar codigo fuente de configuracion, assets publicos y metadatos del repo.
- `src/app/` contiene rutas App Router, layouts, metadata y estilos globales.
- `src/components/ui/` contiene primitivas reutilizables sin conocimiento de dominio: botones, badges, paneles y utilidades visuales.
- `src/components/layout/` contiene estructura de pagina y navegacion persistente.
- `src/components/feedback/` contiene estados transversales como skeleton loaders.
- `src/features/<feature>/` agrupa componentes, tipos y datos mock o adaptadores de cada dominio. Para esta fase existe `features/dashboard`.
- `src/lib/` contiene helpers pequenos y sin estado compartidos por varias capas.
- `src/styles/` queda reservado para tokens o estilos globales adicionales cuando `app/globals.css` crezca demasiado.

## Convenciones de nombres

- Componentes React en `PascalCase`.
- Archivos de componentes en `kebab-case.tsx`.
- Tipos de dominio en `types.ts` dentro de la feature correspondiente.
- Datos mock en `features/<feature>/data/`, con nombres explicitos como `mock-dashboard.ts`.
- Helpers generales en `camelCase` y exportaciones nombradas.

## Componentes reutilizables

- Un componente va a `components/ui` solo si no depende del dominio de League of Legends, Supabase ni del dashboard.
- Un componente va a `features/<feature>/components` si renderiza conceptos del producto como grupos, miembros, cuentas, ranking Flex o Posicion Promedio.
- Un componente va a `components/layout` si organiza regiones persistentes de la aplicacion, navegacion o shell.
- Evitar abstracciones antes de que haya repeticion real o una frontera clara de responsabilidad.

## Tailwind CSS y sistema visual

- Usar Tailwind CSS 4 con tokens definidos en `src/app/globals.css`.
- Preferir clases utilitarias locales y componentes pequenos antes que CSS global.
- Usar fuentes del sistema por defecto. Evitar `next/font/google` hasta que el pipeline garantice acceso de red o se incorporen fuentes locales.
- La paleta base debe sentirse moderna, limpia y enfocada en producto: fondos claros, tinta profunda, acentos teal, indigo y dorado moderado.
- Evitar interfaces dominadas por una sola familia de color, gradientes decorativos excesivos, orbes o fondos puramente ornamentales.
- Usar radios sobrios, densidad media y jerarquia clara para que la app se perciba como herramienta operativa, no landing page.
- La direccion visual actual combina dashboard SaaS premium con personalidad sutil de League of Legends: superficies claras, tinta profunda, acentos teal/indigo/dorado, gradientes suaves funcionales y patrones discretos de fondo.
- Las cards deben usar radio `rounded-lg` como limite general, bordes visibles, sombras suaves y estados hover con elevacion leve solo cuando sean elementos interactivos o escaneables.
- Los badges deben comunicar estado o jerarquia con color y texto, nunca depender solo del color. Para tiers/rangos se permite una paleta especifica por tier siempre que conserve contraste.
- Los botones primarios deben reservarse para la accion principal de la vista o bloque. Los secundarios cubren acciones de creacion relacionadas y los ghost acciones compactas de baja friccion.
- Evitar iconografia pesada si no hay libreria instalada. Se permiten marcas tipograficas o iniciales dentro de contenedores visuales cuando aporten escaneo sin agregar dependencias.

## UX, carga y estados vacios

- Toda vista que dependa de datos remotos debe tener skeleton loader con dimensiones estables.
- Los skeletons deben vivir cerca de la vista si son especificos de una feature, o en `components/feedback` si son genericos.
- Los estados vacios deben explicar el siguiente paso accionable sin bloquear el resto de la pantalla.
- Las tablas/listas deben conservar encabezados, alineacion y alturas predecibles durante carga y vacio.
- Los skeleton loaders deben imitar la estructura real de la vista final: hero, acciones, stat cards, leaderboard desktop/mobile y paneles laterales.
- Los estados vacios deben tener composicion propia, descripcion corta y CTA visible. No usar solo texto plano dentro de una caja.
- En mobile, tablas densas deben convertirse en cards cuando mejore la lectura y evite overflow horizontal.
- El leaderboard es un componente principal del producto: debe destacar top 1-3, mostrar cuenta/rango/LP/win rate/Posicion Promedio con alta escaneabilidad y mantener version responsive.

## Animaciones

- Usar animaciones sutiles: entrada leve, hover discreto y shimmer de skeleton.
- Respetar `prefers-reduced-motion` desde CSS global.
- No usar animaciones que cambien layout o distraigan de lectura de datos.
- Las microinteracciones deben ser breves y consistentes: hover lift minimo, cambio suave de borde/sombra y shimmer de carga. No introducir animaciones lentas, loops decorativos dominantes ni efectos gamer recargados.

## Supabase y autenticacion futura

- La autenticacion sera exclusivamente Google OAuth via Supabase.
- No acoplar componentes visuales a clientes Supabase directamente. Crear adaptadores en `lib/supabase` o Server Actions cuando se implemente backend.
- Mantener el estado de sesion en limites de servidor cuando sea posible y pasar datos serializables a componentes cliente.
- Variables futuras esperadas: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Server Actions futuras

- Usar Server Actions para mutaciones pequenas y cercanas a formularios: crear grupo, invitar miembro, asociar cuenta y actualizar preferencias.
- Validar entradas en servidor antes de llamar Supabase.
- Mantener acciones por feature para evitar un archivo monolitico de acciones.
- No usar Server Actions para scraping pesado; reservar jobs o endpoints controlados para tareas largas.

## Integraciones futuras

- Scraping de League of Graphs debe aislarse detras de servicios/adaptadores y no contaminar componentes React.
- Vercel Cron Jobs se reservara para sincronizacion periodica de rankings, cuentas y metricas.
- La metrica "Posicion Promedio" debe tener tipos explicitos y documentacion de formula antes de exponerla como dato real.

## Reglas para agentes de codigo

- Leer este archivo antes de modificar codigo. Si aparece un `AGENTS.md` mas especifico en una subcarpeta, sus reglas prevalecen.
- Mantener cambios pequenos, verificables y alineados con la estructura existente.
- Documentar aqui decisiones nuevas que afecten arquitectura, convenciones o integraciones.
- No introducir dependencias sin justificar el valor y revisar primero si el stack actual resuelve el caso.
- Evitar sobreingenieria: no crear capas, stores globales, factories ni patrones complejos hasta que el producto los necesite.

## Decisiones visuales — Mayo 2026

### Paleta de colores actualizada
- **Fondo**: migrado de verde-grisaceo (`#f4f7f4`) a azul-gris frio (`#edf2f7`). Refuerza identidad gaming y aleja de look "nature/eco".
- **Foreground**: `#0d1520` (navy-negro con tinte azul, antes verde-negro).
- **Teal**: `#0891b2` (cyan-teal vibrante, antes teal forestal `#0f8b7f`). Mas alineado con la UI de LoL.
- **Indigo**: `#4f46e5` (violeta-indigo profundo, antes azul-indigo suave `#4656b0`).
- **Gold**: `#b45309` (ambar rico, antes dorado apagado `#ad7a22`).
- **Body background**: gradientes radiales en esquinas (cyan top-left, indigo top-right, ambar bottom-center) para atm=sfera gaming sin fondos dominados por un color.

### Header oscuro (`AppShell`)
- Header usa `bg-foreground` (navy oscuro) para crear contraste chrome/contenido tipo client gaming.
- El boton Google del header es un `<button>` nativo con estilos dark-context; no usa el componente `Button` para no forzar el tema claro sobre fondo oscuro.
- Una linea de 1px con gradiente teal→indigo→transparent separa el header del contenido.
- Texto blanco con opacidades graduales para la jerarquia de informacion del header.

### Botones
- **Primary**: gradiente `from-teal to-indigo` con sombra glow teal. Es la accion mas prominente de la vista.
- **Secondary**: superficie blanca con borde, hover teal-soft. Para acciones secundarias.
- No cambia la logica de cuales acciones son primary vs secondary.

### Panel
- Sombra reforzada: `shadow-lg shadow-black/6` + `ring-1 ring-black/2` para mayor profundidad y sensacion de superficie elevada.

### Leaderboard — medallas top-3
- Posicion 1: gradiente ambar/dorado (`from-amber-300 to-amber-500`), texto amber-900.
- Posicion 2: gradiente plata (`from-slate-200 to-slate-400`), texto slate-700.
- Posicion 3: gradiente bronce (`from-amber-600 to-amber-800`), texto amber-100.
- Filas top-3 tienen un lavado de color horizontal sutil (gold/silver/bronze) con `bg-linear-to-r`.
- Para posiciones 4+: badge neutro sin gradiente.

### RankBadge — tiers LoL
- `font-bold` para Gold y tiers superiores (GOLD, PLATINUM, EMERALD, DIAMOND, MASTER).
- Platinum usa teal (alineado con el color del tier en LoL), Emerald usa verde, Diamond usa indigo, Master usa fuchsia.

### StatTile
- Icono con `ring-1 ring-accent/20` para definicion visual sin peso excesivo.
- Gradiente de fondo `from-accent-soft/70 to-surface` (antes `/85` en valores menos saturados, ahora mas visible con la nueva paleta).

### PerformanceMeter
- Barra mas fina: `h-1.5` (antes `h-2.5`). Mas refinada y menos chunky.
- Valor numerico en `text-base` (antes `text-sm`) para mejor legibilidad de datos.
- Fondo de barra: `bg-border/60` (antes `bg-surface-muted ring-1 ring-border/60`). Mas limpio.

### MembersPanel
- Avatar de iniciales (`size-7`, letra inicial del nombre) para escaneo rapido sin agregar imagenes o dependencias.
- Owner recibe tratamiento indigo en el avatar; el resto usa neutral.

### EmptyState
- Icono `⊕` (circled plus unicode) en lugar de `+` plano. Mas personalidad visual.
- Gradiente de fondo `from-teal-soft/25 to-transparent` para mayor composicion.

### Superficie y patron
- Pattern de diamantes (45/-45 degrees, `22px`) en lugar de cuadricula simple. Mas dinamismo.
- Shimmer del skeleton ajustado a tonos azul-gris frios para coincidir con la nueva paleta.

## Decisiones visuales — Rediseño gaming oscuro Mayo 2026

### Direccion visual
- El rediseño oscuro reemplaza la direccion clara anterior para acercar la app a un dashboard gaming premium: fondo navy/negro, paneles translúcidos, bordes iluminados y glows controlados.
- La interfaz debe sentirse inmersiva sin perder lectura: fondos tecnológicos, jerarquia fuerte, acentos neon y superficies con profundidad.
- La funcionalidad y estructura de features se mantienen; el cambio es principalmente de presentacion, densidad visual y microinteracciones.

### Paleta oscura
- **Background**: `#030712`, con gradientes radiales cyan, violeta y magenta sobre navy profundo.
- **Surface**: `#07111f` y `#0d1b2f`, usados con transparencia y blur para paneles tipo vidrio oscuro.
- **Foreground**: `#f7fbff`; texto secundario en slate frio para mantener contraste sin fatiga.
- **Acentos**: cyan `#19d8ff`, violeta `#7c3cff`, dorado `#f5b83f` y magenta `#ff4f93`.
- Evitar volver a fondos claros o superficies planas salvo que una vista especifica lo justifique.

### Componentes
- `Panel` es ahora una superficie oscura con `rounded-xl`, blur, ring claro sutil y pseudo-fondo `neon-panel`.
- `Button` primary usa gradiente cyan/teal/violeta con borde luminoso; secondary y ghost viven en contexto oscuro con bordes y hover neon.
- `Badge` usa fondos transparentes tintados, borde visible, sombra suave y texto con contraste alto.
- `RankBadge` usa tonos oscuros por tier, no variantes pastel claras.

### Dashboard
- El hero es el bloque principal: panel oscuro grande, badges superiores, titulo fuerte, acciones prominentes, marca FX decorativa y luces internas.
- Las stat cards son tarjetas neon con icono destacado, valor grande, borde por acento y hover lift minimo.
- El leaderboard es la pieza central: tabla oscura enmarcada, filas top 1-3 con lavados gold/silver/bronze, medallas hexagonales y barras de rendimiento con gradientes.
- Las cards de cuentas usan avatar/rango visual, badge Main/Smurf, estado de sincronizacion y CTA compacto integrado.
- Los skeletons deben imitar esta estructura oscura con shimmer frio y dimensiones estables.

### Fondo global
- `public/fondo.png` es el fondo visual principal de la app.
- El fondo se aplica desde `src/app/globals.css` en el `body`, con repeticion vertical (`repeat-y`) para que conecte al hacer scroll en pantallas largas.
- Mantener overlays oscuros y radiales encima del asset para preservar legibilidad de paneles, textos y tablas.
