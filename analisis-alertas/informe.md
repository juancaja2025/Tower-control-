# Alertas LT + Torre de Control: diagnóstico

**Alcance y límites.**
- **Torre:** se analizó el código completo publicado (`./torre`, 16 archivos).
- **Live Tracking:** **no se pudo abrir.** La red del entorno bloquea `livetracking.ocasa.com` (403). De LT solo se analizó la copia del Dashboard que trae la Torre. Las alertas en desarrollo y los agentes n8n quedan como "A CONFIRMAR".
- **Datos:** todos los números de la Torre son **DEMO**. Los umbrales sí son reglas del código y se citan con `archivo:línea` en `inventario_alertas.csv`.

## 1. Cantidades

**Inventario: 83 ítems.**

| Plataforma | Total | DUPLICADA | COMPLEMENTARIA | HUÉRFANA | CONFLICTO | FALTANTE | A CONFIRMAR |
|---|---|---|---|---|---|---|---|
| Torre | 63 | 7 | 10 | 33 | 12 | 1 | – |
| LT (copia del Dashboard + n8n) | 12 | 1 | 1 | 2 | – | 1 | 7 |
| Ninguna (faltan) | 8 | – | – | – | – | 8 | – |
| **Total** | **83** | **8** | **11** | **35** | **12** | **10** | **7** |

**Catálogo propuesto: 63 códigos.**
- **13 se detectan en LT** (unidad, viaje, troncal, parada, chofer).
- **50 se detectan en la Torre** (sucursal, cliente, CPT, red, fuente). De esos, 5 se alimentan de eventos de LT.
- **Todos se gestionan en la Bitácora.**

**El hallazgo central:**
- La Torre tiene muchos semáforos pero **no tiene un motor de reglas que los conecte con la Bitácora.**
- Las 15 excepciones de ejemplo están escritas a mano en el código (`index.html:1067-1083`). Llevan la etiqueta "Detectada por regla automática", pero esa regla no existe.
- La única que entra sola es la troncal detenida que se simula a los 25 s de abrir la página (`:2645`).
- Por eso **33 de los 63 ítems de la Torre son HUÉRFANAS:** cambian de color y nadie las toma.

## 2. Resolver primero: duplicadas y conflictos

1. **Demora de troncal: CONFLICTO + DUPLICADA** (T27, T28, T29, T30, A02).
   - La definición de "Troncales a tiempo" mide el arribo (ATA vs ETA, `:1223`), pero el código mide la salida (ATD vs ETD, `:806`).
   - La tolerancia es de 15 min por troncal (`:806`, `:1615`), pero el KPI de demora promedio tiene objetivo de 20 min (`:890`).
   - Según el principio, la detección por troncal pasa a LT. Hay que confirmar que no la detecta también el agente n8n de troncales.
   - "Sin salir" se marca crítico sin mirar la hora actual (`:1581`).
   - El color de la troncal en el mapa depende solo de las excepciones abiertas (`:1098`), no de la demora.
2. **GPS sin reporte: CONFLICTO** (T32, T33). La definición dice "más de 30 min / 1 h" (`:1253`) y la excepción de ejemplo se dispara a los 25 min (`:1077`). Hay que fijar un solo umbral en LT.
3. **SLA por sucursal o provincia: CONFLICTO** (T02, T03). La matriz usa 3 niveles (crítico <93%) y el mapa 4 niveles (crítico <91%) para el mismo SLA.
4. **Antigüedad / backlog: CONFLICTO** (T13, T14, T20).
   - Hay cuatro cortes para el mismo desvío: +48 h > 1.000 piezas, "15 días" (definición), +3/+7/+15/+30 días, y "+48 h" en las alertas de la jornada.
   - La excepción de Córdoba (620 piezas) está abierta aunque queda bajo el límite de 1.000.
5. **Visitas fallidas: DUPLICADA** (L04 con T17 y T24). LT y la Torre muestran lo mismo con **listas de motivos distintas**. Queda la Torre como alerta agregada; LT aporta el evento.
6. **CBT: CONFLICTO + posibles DUPLICADAS** (T51, T54, A03, A04). El SLA de 24 h choca con el tiempo de liberación de 8/12 h. Hay que confirmar si los agentes n8n de CBT y Direxa ya alertan lo mismo.
7. **Vencimiento de la excepción: CONFLICTO** (T63). La tabla dice P1 2 h / P2 4 h / P3 8 h, pero los ejemplos no la respetan (E-2288 es P1 y vence en 210 min) y nada escala al vencer.

## 3. Huérfanas y faltantes

**Huérfanas (35).**
- **Torre: casi todos los semáforos de Distribución, Crossdock y CBT** (T11–T26, T38–T57). Les falta la regla "cruza el umbral → abre una excepción".
- **Torre, otros casos:**
  - Frescura de GPS/TMS, WMS, MELI y OMS (T09): solo Aduana tiene excepción.
  - Las excepciones del crossdock por volumen y ETA (T48) viven en una lista aparte.
  - La capa de riesgo externo (T37) no está vinculada a sus excepciones.
- **LT:** direcciones sin geo (L05) y geo incorrecta (L06). Nadie las gestiona.

**Faltantes (10).**
- **Lo que pide el principio y no existe:**
  - SUCURSAL_EN_RIESGO a partir de eventos de LT (F01).
  - Arribo tarde de troncal (F02).
  - Troncal fuera de ruta (F03).
  - Chofer con muchas visitas fallidas (F05).
  - Recorrido que no salió (F06).
  - Uso de EN CAMINO (L03).
  - Umbral de "sin canalizar" en XD propio (T50).
- **Lo que falta en la Bitácora:**
  - Escalado por vencimiento (F04).
  - **Autocierre** cuando el desvío se normaliza (F07).
  - Deduplicación por ID de evento de origen (F08).

## 4. Próximo paso sugerido
1. Acordar los umbrales en conflicto (punto 2) y cargarlos en `catalogo_propuesto.csv`.
2. Definir el contrato del evento LT → Bitácora: código, objeto, patente o troncal, sucursal, severidad, timestamp, `id_evento_origen` y condición de cierre.
3. Implementar en la Torre las reglas "semáforo → excepción" y la agregación de eventos de LT por sucursal.

## 5. Preguntas abiertas para el equipo de LT
1. ¿Qué alertas están en desarrollo? Para cada una: código, condición, umbral, granularidad, frecuencia de cálculo y canal (pantalla, mail, n8n).
2. **Unidad detenida:** ¿a partir de cuántos minutos? ¿Es igual para troncal que para última milla? ¿Cómo se excluyen las paradas planificadas?
3. **Sin GPS:** ¿el umbral es de 25 min, 30 min o 1 h? ¿Aplica solo a transportes despachados no finalizados?
4. **Troncales:**
   - ¿Qué tolerancia se usa para la demora de salida (15 o 20 min)?
   - ¿LT calcula la ETA dinámica y el arribo tarde (ATA vs ETA)?
   - ¿De dónde sale el ETD: TMS o Transportes?
5. **Agentes n8n** (admisión, troncales, MELI Courier/Direxa, CBT): ¿qué detecta cada uno, con qué umbral, sobre qué fuente, y adónde envía hoy el aviso? ¿Leen los mails de monitoreo que también consolida el datalake (T34)?
6. **"Desvíos 700 mts":** ¿se calcula contra la dirección geocodificada o contra la marca del chofer? ¿Hay umbral por chofer o por centro? ¿Es el mismo dato que los "desvíos en calle UM" del mapa de la Torre?
7. **Motivos de visita fallida:** ¿cuál es la lista oficial? La de LT y la de la Torre no coinciden.
8. **Calidad de datos:** ¿quién gestiona hoy las direcciones sin geo y las de geo incorrecta?
9. **API:** ¿qué endpoints GET (JSON) expone LT para las estadísticas por centro y para los eventos? ¿Con qué autenticación y frecuencia, y existe un `id_evento`? ¿Se pueden consumir por webhook?
10. ¿Hay una correspondencia oficial sucursal ↔ centro LT? La de la Torre (`LTC`, `:1061`) repite centros: A003 para Aduana Ezeiza y Echeverría, A044 para Avellaneda Tráfico y Avellaneda WH. Además, Villa Soldati y Flores quedan sin centro, y sin centro el panel muestra A001 por defecto (`:1294`).
11. ¿LT puede dejar una alerta "resuelta" sola cuando la condición vuelve a la normalidad? ¿Con qué histéresis?
12. **Acceso para el relevamiento:** ¿se puede habilitar el host en la red del entorno, o un usuario de solo lectura para este análisis?
