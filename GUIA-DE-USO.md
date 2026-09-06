# Mi entrenamiento

Aplicación diaria para Android: <https://cursosjorgeiafinance-beep.github.io/mi-entrenamiento/>. Guarda tus resultados en el navegador del dispositivo y funciona sin conexión. El dashboard de Sites es una vista independiente del histórico.

## Entrenar en orden

- Pulsa **Actualizar plan** con conexión para descargar una sesión preparada o las tres sesiones de un ciclo.
- En un ciclo, A está disponible primero. B se desbloquea al finalizar y guardar A; C, al guardar B. Las demás rutinas no pueden iniciarse mientras ese ciclo esté pendiente.
- Las guías A-B-C también respetan el orden del historial cuando todavía no se ha cargado un ciclo. Sin historial, empiezan por A.
- Puedes cambiar ejercicios y valores dentro del entrenamiento. Editar un campo o iniciar su descanso confirma la serie; los valores precargados sin confirmar se guardan vacíos. Escribe repeticiones y esfuerzo reales, sin rangos.
- Cerrar el móvil guarda un borrador. **Descartar sesión** mantiene el turno. Una sesión sin series realizadas no avanza.
- Al terminar C aparece **Compartir ciclo para analizar**. Durante el descanso, envía el archivo y pide preparar las siguientes A, B y C juntas. El siguiente ciclo se carga tras revisar y autorizar las tres fichas.
- Actualizar el plan no sustituye una sesión en curso ni un ciclo incompleto, y volver a descargar un ciclo terminado no lo reinicia.

## Compartir sin descargar el mes

Al guardar una sesión, pulsa **Compartir sesión**: métricas y observaciones viajan juntas en un único archivo JSON. Puedes recuperarlo abriendo cualquier sesión del historial.

En **Historial → Compartir para analizar** puedes escoger el último ciclo, la última sesión o todo el historial. Un ciclo puede abarcar dos meses. Si todavía está incompleto, el archivo lo indica. En historiales antiguos sin ID de ciclo se toma el tramo más reciente desde A hasta la última sesión A/B/C registrada.

Android abre el selector de aplicaciones cuando admite compartir archivos. Si no está disponible, se descarga el JSON; adjúntalo a la conversación. También tienes **Descargar archivo**. No necesitas añadir el mensual ni descargar observaciones aparte. **Solo observaciones** sigue disponible.

Compartir no ejecuta un análisis automáticamente. Codex analiza el archivo que adjuntes y prepara las siguientes sesiones cuando se lo pidas. No se envían resultados a GitHub.

## Archivo y copias

- **Archivo mensual**: métricas JSON o CSV para conservar el histórico y hacer el cierre del mes.
- **Descargar copia**: rutinas, historial, plan descargado, progreso y sesión activa. Guárdala periódicamente.
- **Importar copia**: restaura ese contenido sustituyendo los datos del dispositivo. Las copias antiguas también sirven; si no incluyen plan, tendrás que pulsar **Actualizar plan**.

El historial del móvil y el del ordenador no se sincronizan solos. Borrar los datos del sitio elimina los registros locales; una actualización del código mantiene el almacenamiento. Una copia anterior restaura el estado de aquella fecha.

## Instalar en Android

1. Abre la URL de GitHub Pages en Chrome, fuera de incógnito.
2. Pulsa **Instalar** o elige **Instalar aplicación / Añadir a pantalla de inicio** en el menú de Chrome.
3. Abre una vez con conexión y pulsa **Actualizar plan**. Después puedes entrenar sin Internet.

Para recibir una actualización del código, abre con conexión, cierra la aplicación y vuelve a abrirla. No borres los datos del sitio.

El repositorio y las prescripciones de `proxima-sesion.json` son públicos. Solo contienen código, ejercicios y cargas autorizadas. Métricas, comentarios, sueño y molestias permanecen en tus dispositivos y en los archivos que decidas compartir.
