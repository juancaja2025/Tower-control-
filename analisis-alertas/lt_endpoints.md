# Live Tracking · endpoints GET con respuesta JSON

## Estado de la captura: BLOQUEADA

No se pudo abrir `https://livetracking.ocasa.com/Login` desde este entorno.

- **Causa:** la política de red del entorno cloud rechaza el host (`CONNECT tunnel failed, response 403`, registrado por el proxy como `connect_rejected` para `livetracking.ocasa.com:443`, 2026-10-03 04:12 UTC).
- **Qué no se hizo:**
  - No se inició sesión.
  - No se usaron ni se guardaron las credenciales en ningún archivo.
  - No se hizo ninguna llamada a la web, ni GET ni de otro tipo.
- **Para habilitarlo:** agregar `livetracking.ocasa.com` en *Network access → Allowed domains* del entorno (https://code.claude.com/docs/en/cloud-environments#network-access) y volver a pedir el recorrido.

**Endpoints GET observados en vivo: ninguno (NO ENCONTRADO).**

---

## Lo único disponible: la copia del Dashboard de LT dentro de la Torre

La Torre trae una copia del Dashboard de LT: `torre/livetracking/livetracking_torre.html`.

- El encabezado de la copia (líneas 2–4) dice que viene de `https://livetracking.ocasa.com/Dashboard/Dashboard`.
- Según el mismo archivo, se quitaron el menú, el login y **las llamadas al servidor**, y los datos son ilustrativos.
- Por eso, lo que sigue está **INFERIDO del código de la copia y NO VERIFICADO** contra la web real.

| # | Pantalla / acción | URL del endpoint | Método | Evidencia | Estado |
|---|---|---|---|---|---|
| 1 | Dashboard: estadísticas del centro (`LoadStatistics(centro)`) | NO ENCONTRADO | NO ENCONTRADO | `livetracking_torre.html:38` (onchange), `:378` ("misma lógica de cálculo que LoadStatistics del original"), `:396-408` | Inferido |
| 2 | Botón "Obtener estadísticas" (`#btnGetStatistics`, oculto) | NO ENCONTRADO | NO ENCONTRADO | `livetracking_torre.html:44` | Sin dato |
| 3 | Descargar informe de recorridos | NO ENCONTRADO | NO ENCONTRADO | `livetracking_torre.html:77` | Sin dato |
| 4 | Descargar sin geo / visitas fallidas / geo incorrecta / desvío geo | NO ENCONTRADO | NO ENCONTRADO | `livetracking_torre.html:164, 184, 207, 226` | Sin dato |
| 5 | Clic en un segmento de torta: abre `link` en otra pestaña | NO ENCONTRADO (el campo `link` viene en los datos) | — | `livetracking_torre.html:363-367` | Sin dato |

### Parámetro de entrada inferido
- `centro`: código de centro LT, de `A001` (Plaza Logística) a `A055` (CBN I). La lista está en `livetracking_torre.html:39`.
- La Torre traduce su sucursal al centro de LT con `LTC` (`torre/index.html:1061`).

### Estructura de respuesta inferida (campos que consume `LoadStatistics`)

```json
{
  "cantidades": [{
    "cantidadRecorridos": 0,
    "totalEntregas": 0,
    "totalRetiros": 0,
    "visitadasEnCamino": 0,
    "visitadasTotales": 0,
    "visitadosEntregas": 0,
    "visitadosRetiro": 0,
    "geoIncorrecta": 0,
    "direccionesSinGeo": 0,
    "visitadasFallidasTotales": 0,
    "desvioGeo": 0,
    "porcentajeConGEOIncorrecta": 0.0,
    "porcentajeConDesvioGeo": 0.0
  }],
  "materiales": [{ "descripcion": "PAQUETERIA", "cantidad": 0 }],
  "motivosFallidas": [{ "descripcionMotivo": "AUSENTE", "cantidad": 0 }]
}
```

- **Origen de la estructura:** `livetracking_torre.html:390-392`.
- **Valores:** en 0 a propósito. El ejemplo de la copia es **DEMO**, generado con una semilla en `datosCentro()`, y no se transcribe como dato real.
- **Materiales de ejemplo:** PAQUETERIA, SOBRES, POSTAL, E-COMMERCE, DOCUMENTACION.
- **Motivos de ejemplo:** NO SE UBICA DOMICILIO, AUSENTE, RECHAZADO POR DESTINATARIO, DIRECCION INCOMPLETA, COMERCIO CERRADO, ZONA DE RIESGO (`:379-380`).

### Cálculos que hace la pantalla con esos campos (copia)
- **% Uso de EN CAMINO** = `visitadasEnCamino × 100 / visitadasTotales` (`:399`).
- **% avance de entregas** = `100 − (totalEntregas − visitadosEntregas) × 100 / totalEntregas` (`:400`). El de retiros se calcula igual.
- **"Desvío GEO 700 mts"** = `porcentajeConDesvioGeo`. El umbral de 700 m está solo en el texto de la pantalla (`:235, :407`); el cálculo es del servidor (NO ENCONTRADO).

## Pendiente cuando haya acceso
1. Registrar con Playwright las XHR/fetch **GET** con `content-type: application/json`. Para cada una: URL sin tokens, parámetros, campos y un ejemplo recortado y anonimizado.
2. Ver si las pantallas de alertas en desarrollo exponen endpoints de eventos: unidad detenida, sin GPS, desvío de troncal. Para cada uno, anotar sus umbrales.
3. Cortar a nivel de red todo POST, PUT o DELETE, salvo el POST del login.
