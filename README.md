# Finanzas Sin Filtro

Presentación web interactiva y diagnóstico financiero educativo.

## Publicación en Render

El proyecto es un sitio estático sin proceso de compilación. Render publica la
raíz del repositorio y reescribe las rutas hacia `index.html` para conservar la
navegación por láminas.

La configuración está declarada en `render.yaml`.

## Flujo de revisión

1. Trabajar y revisar cada bloque localmente.
2. Subir el bloque aprobado al repositorio.
3. En Render, ejecutar **Manual Deploy → Deploy latest commit**.

Los despliegues automáticos están desactivados para evitar publicar cada
movimiento o corrección intermedia.
