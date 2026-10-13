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

## Despliegue desde Terminal

Guarda una sola vez el Deploy Hook secreto de Render en tu sesión y ejecuta:

```bash
export RENDER_DEPLOY_HOOK_URL='PEGA_AQUI_EL_DEPLOY_HOOK'
./deploy-manual.sh
```

El script rechaza cambios sin commit, sube `main` y solicita a Render que
publique exactamente el commit aprobado.
