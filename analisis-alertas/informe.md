# Alertas LT + Torre de Control: diagnóstico

**Alcance y límites.**
- **Torre:** se analizó el código completo publicado (`./torre`). Todos sus números son **DEMO**; los umbrales sí son reglas del código.
- **Live Tracking:** la web real se recorrió el 05/10/2026 en solo lectura (capturas en `capturas/`).
  - LT pide **todos sus datos por POST**, así que con la regla de solo GET las pantallas se ven vacías.
  - Las reglas de LT salen de su código (`lt_fuente/js/`) y del manual oficial.
- **Agentes n8n:** sin evidencia. Quedan "A CONFIRMAR".
- **Citas:** cada ítem lleva su `archivo:línea` en `inventario_alertas.csv`.

## 1. Cantidades

**Inventario: 87 ítems.**

| Plataforma | Total | DUPLICADA | COMPLEMENTARIA | HUÉRFANA | CONFLICTO | FALTANTE | A CONFIRMAR |
|---|---|---|---|---|---|---|---|
| Torre | 63 | 7 | 10 | 33 | 12 | 1 | – |
| LT (web + n8n) | 16 | 1 | 1 | 3 | 2 | 2 | 7 |
| Ninguna (faltan) | 8 | – | – | – | – | 8 | – |
| **Total** | **87** | **8** | **11** | **36** | **14** | **11** | **7** |

**Catálogo propuesto: 65 códigos.**
- **15 se detectan en LT** (unidad, viaje, troncal, parada, chofer, recorrido).
- **50 se detectan en la Torre.** De esos, 5 se alimentan de eventos de LT.
- **Todos se gestionan en la Bitácora.**

**Hallazgos centrales.**
1. **La Torre tiene semáforos pero no un motor de reglas hacia la Bitácora.**
   - Las 15 excepciones de ejemplo están escritas a mano (`index.html:1067-1083`).
   - La única que entra sola es una troncal detenida simulada (`:2645`).
   - Por eso 33 de 63 ítems de la Torre son HUÉRFANAS.
2. **LT no tiene alertas.** No hay menú, pantalla ni regla de alerta en la web. LT muestra KPIs de calidad (sin geo, geo incorrecta, desvío de 700 m, visitas fallidas) y semáforos de efectividad, pero nada se envía ni se gestiona.
3. **LT hoy no puede detectar "unidad detenida" ni "sin GPS":**
   - La posición en vivo trae solo latitud y longitud, **sin la hora del último reporte** (`Recorrido/Recorridos.js:1453-1480`).
   - El refresco automático del mapa está **comentado** (`:118, :121`).
   - Las dos alertas centrales del principio dependen de que LT agregue ese dato.

## 2. Resolver primero: duplicadas y conflictos

1. **Efectividad: CONFLICTO** (L08 con T12 y T16).
   - LT pinta el recorrido verde con ≥95%, naranja con 90–95% y rojo con <90% (`Recorrido/Recorridos.js:745-764`).
   - La Torre usa 88/85 para el 1er intento y 90/87 para la entrega sobre visitados.
2. **Visita fallida: CONFLICTO + DUPLICADA** (L04, L09 con T17 y T24).
   - LT cuenta como fallida todo lo que no es Z4, Z1 o RE (`Recorrido/Paradas.js:106`).
   - La Torre excluye siniestro y devolución.
   - Las listas de motivos no coinciden.
   - Queda la Torre como alerta agregada; LT aporta el evento.
3. **Demora de troncal: CONFLICTO + DUPLICADA** (T27, T28, T29, T30, A02).
   - La definición mide el arribo (ATA vs ETA, `:1223`) y el código mide la salida (`:806`).
   - La tolerancia es de 15 min por troncal contra 20 min del KPI de demora promedio.
   - LT web no tiene troncales: hay que confirmar si los mide el agente n8n.
4. **GPS sin reporte: CONFLICTO** (T32, T33, L11). El umbral figura como 25 min, 30 min o 1 h, y LT no tiene la hora del reporte para calcularlo.
5. **SLA por sucursal o provincia: CONFLICTO** (T02, T03). La matriz usa 3 niveles (crítico <93%) y el mapa 4 (crítico <91%).
6. **Antigüedad / backlog: CONFLICTO** (T13, T14, T20). Hay cuatro cortes distintos para el mismo desvío: +48 h, 15 días, +3/+7/+15/+30 días, y "+48 h".
7. **CBT: CONFLICTO + posibles DUPLICADAS** (T51, T54, A03, A04). El SLA de 24 h choca con el tiempo de liberación de 8/12 h.
8. **Vencimiento de la excepción: CONFLICTO** (T63). La tabla P1 2 h / P2 4 h / P3 8 h no se respeta en los ejemplos y nada escala al vencer.

## 3. Huérfanas y faltantes

**Huérfanas (36).**
- **Torre:**
  - Casi todos los semáforos de Distribución, Crossdock y CBT.
  - La frescura de GPS/TMS, WMS, MELI y OMS.
  - Las excepciones del crossdock.
  - La capa de riesgo externo.
- **LT:**
  - Paradas sin geo (L05) y geo incorrecta (L06).
  - **Siniestros (L10)**: se gestionan dentro de LT ("Gestión de siniestros") y no llegan a la Bitácora.

**Faltantes (11).**
- **Lo que pide el principio y no existe:**
  - SUCURSAL_EN_RIESGO a partir de eventos de LT (F01).
  - Arribo tarde de troncal (F02).
  - Troncal fuera de ruta (F03).
  - Chofer con muchas visitas fallidas (F05).
  - Recorrido que no salió (F06).
  - Uso de EN CAMINO (L03).
  - Umbral de "sin canalizar" en XD propio (T50).
  - Hora del último reporte GPS en LT (L11).
- **Lo que falta en la Bitácora:**
  - Escalado por vencimiento (F04).
  - **Autocierre** (F07).
  - Deduplicación por ID de evento de origen (F08).

## 4. Próximo paso sugerido
1. Acordar los umbrales en conflicto (punto 2).
2. Pedir a LT que agregue la hora en `lastTracking` y que publique eventos por recorrido y parada (efectividad, fallida, desvío de 700 m, siniestro).
3. Definir el contrato del evento LT → Bitácora: código, objeto, patente o recorrido, sucursal, severidad, timestamp, `id_evento_origen` y condición de cierre.
4. Implementar en la Torre las reglas "semáforo → excepción" y la agregación por sucursal.

## 5. Preguntas abiertas para el equipo de LT
1. ¿Qué alertas están "en desarrollo"? En la web no aparece ninguna. ¿Viven fuera de la web (n8n, app) o en pantallas que este perfil no ve (Replanificar, Transportistas)?
2. **GPS:** ¿Firebase guarda la hora de cada `lastTracking`? ¿Con qué frecuencia reporta la app? ¿Por qué está desactivado el refresco automático del mapa?
3. **Unidad detenida:** ¿a partir de cuántos minutos? ¿Cómo se excluyen las paradas planificadas?
4. **Efectividad:** ¿cómo se calcula `efectividad`? ¿Los cortes 95/90 son oficiales? ¿Cuál vale, este o el 88/85 de la Torre?
5. **Códigos de motivo:** ¿cuál es la tabla oficial de `reasonCode`? ¿Por qué solo Z4, Z1 y RE cuentan como exitosas? ¿Qué es `env_recb`?
6. **Desvío de 700 m:** ¿es ≥700 (manual) o >700 (código del detalle)? ¿Se calcula contra la coordenada planificada o la geocodificada?
7. **Siniestros:** ¿qué tipos hay? ¿Quién los gestiona hoy y en qué plazo? ¿Se pueden enviar a la Bitácora?
8. **Troncales:** LT web no muestra troncales. ¿Las mide el agente n8n de troncales? ¿Con qué tolerancia (15 o 20 min) y contra qué (ATD o ATA)?
9. **Agentes n8n** (admisión, troncales, MELI Courier/Direxa, CBT): ¿qué detecta cada uno, con qué umbral, sobre qué fuente y adónde avisa?
10. **API para la Torre:** las lecturas son POST con cuerpo JSON. ¿Hay una API de integración, con token de servicio y GET o webhook de eventos con `id_evento`?
11. **Centros:** ¿hay una tabla oficial sucursal ↔ centro? La de la Torre (`LTC`, `:1061`) repite A003 y A044 y deja sin centro a Soldati y Flores. Además, el combo de LT muestra A024 "Salta Insumos", que la Torre no tiene.
12. **Seguridad:** la clave de Google Maps/Routes está escrita en el JS público (`Recorrido/Recorridos.js:1644`). ¿Tiene restricción de dominio y API?
