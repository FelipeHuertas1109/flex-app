<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Estado de la documentacion local

- La regla anterior es obligatoria. Si `node_modules/next/dist/docs/` no existe, se debe dejar constancia en el cambio y trabajar de forma conservadora con las convenciones verificables del repositorio.
- Este proyecto usa Next.js 16, React 19, TypeScript estricto y Tailwind CSS 4 via `@tailwindcss/postcss`.

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
