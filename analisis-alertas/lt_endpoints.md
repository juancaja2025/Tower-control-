# Live Tracking · endpoints

**Relevamiento:** 05/10/2026, en `https://livetracking.ocasa.com` con el usuario del pedido.

**Cómo se hizo:**
- Navegador headless con un candado de red: solo pasaron GET, HEAD y OPTIONS, y un único POST, el del login (`POST /Login`).
- Todo otro POST, PUT o DELETE fue cortado por el navegador antes de salir.
- No se hizo clic en ningún botón de acción.
- Las credenciales se usaron solo como variables de entorno y no se guardaron.

## Resultado principal

**LT no expone ningún endpoint GET que devuelva JSON con datos operativos.** El código de las pantallas (`lt_fuente/js/`) pide **todo** por `POST` con un cuerpo JSON: centros, estadísticas, recorridos, paradas, posiciones GPS y siniestros. Esas llamadas quedaron bloqueadas por la regla de solo GET, así que las pantallas se ven vacías en las capturas.

- **Respuestas JSON observadas en vivo: ninguna de LT.** Las únicas fueron de Google Maps, que no son relevantes.
- **Endpoints GET de LT que figuran en el código** (ninguno se disparó durante la navegación):
  - `GET /StaticManager/GetPerfiles` (`js/Shared/Common.js:401-403`).
  - `GET /api/Recorrido/ReporteRecorridos`: la descarga de un informe (`js/dashboard/dashboard.js:86-88`, `js/Recorrido/Recorridos.js:310`).

Los campos de abajo salen de lo que el JavaScript lee de cada respuesta. **No hay ejemplos de respuesta reales** porque las llamadas no se ejecutaron. Para obtenerlos hace falta autorizar estos POST de lectura (ver "Decisión pendiente").

## Endpoints de lectura (todos POST)

| Endpoint | Pantalla | Cuerpo que envía | Campos que lee la pantalla | Evidencia |
|---|---|---|---|---|
| `POST /StaticManager/GetCentros` | Todas (combo de centros) | perfil / usuario | lista de centros | `js/Shared/Common.js:314-360` |
| `POST /Dashboard/GetStatistics` | Dashboard | `{Centro, IdPerfil, IdUsuario}` | `cantidades[0]`: `cantidadRecorridos`, `totalEntregas`, `totalRetiros`, `visitadasEnCamino`, `visitadasTotales`, `visitadosEntregas`, `visitadosRetiro`, `geoIncorrecta`, `direccionesSinGeo`, `visitadasFallidasTotales`, `desvioGeo`, `porcentajeConGEOIncorrecta`, `porcentajeConDesvioGeo`; `materiales[]`; `motivosFallidas[]` | `js/dashboard/dashboard.js:150-270` |
| `POST /Dashboard/GetMaterialReport` | Dashboard: descarga "Sin geo" | centro | detalle para CSV | `dashboard.js:495-510` |
| `POST /Dashboard/GetFailedVisitReport` | Dashboard: descarga "Visitas fallidas" | centro | detalle para CSV | `dashboard.js:524-540` |
| `POST /Dashboard/GetGeoErrorReport` | Dashboard: descarga "Geo incorrecta" | centro | detalle para CSV | `dashboard.js:557-572` |
| `POST /Dashboard/GetGeoDeviationReport` | Dashboard: descarga "Desvío 700 m" | centro | columnas del CSV: Distancia (metros), Centro, Geo Planificada, Geo Real, Recorrido, Ruta, Nro Parada, ID y nombre del transportista, Equipo, Guía, Destinatario, Tipo de servicio, Material… | `dashboard.js:590-604, 669-679` |
| `POST /api/Recorrido/GetRecorridosTables` | Recorridos | `{Fecha_Planif, Sucursal}` | `ruta`, `recorrido`, `chofer`, `nom_Transportis`, `unidad`, `desc_Tractor`, `sucursal`, `fecha_Planif`, `porcentaje`, **`efectividad`**, `liveTracking`, `km_Fin`, `dateSys_Inicio`, `dateSys_Fin`, `sistema_1/2` (lat/lng) | `js/Recorrido/Recorridos.js:680-790` |
| `POST /api/Recorrido/GetParadasTables` | Recorridos: paradas | recorrido | `idParada`, **`reasonCode`**, **`env_recb`**, `horaDeGestion`, `position`, `positionReal`, `geolocalizaionCorrecta`, `avisoEnCamino`, `lecturadeDNI`, `motivo`, `submotivo`, `receptor`, `vinculo`, `documento`, `cantBultos`, `direccion`, `localidad`, `provincia`, `tipodeServicio`, `comentarioChofer` | `js/Recorrido/Paradas.js:40-130`, `Recorridos.js:984` |
| `POST /api/Recorrido/GetParadasDetallesTables` | Detalle de parada | parada | detalle de la gestión | `js/Recorrido/ParadasModal.js:334-336` |
| `POST /api/Recorrido/GetDigitalPhoto` · `GetConstanciaDigital` · `GetNovedad` | Detalle de parada | parada | foto, constancia, novedad | `ParadasModal.js:221`, `Recorridos.js:465, 516` |
| `POST /StaticManager/GetGEOData` | Recorridos: mapa en vivo | `{path:"OcasaLiveTracking/<fecha>/<centro>[/<chofer>]"}` (Firebase) | `lastTracking.lat`, `lastTracking.lng` por chofer y recorrido. **No trae la hora del reporte** | `Recorridos.js:1299-1349, 1453-1480` |
| `POST /api/RecorridoHistorico/ObtenerRecorridoHistorico` · `ObtenerParadasHistorico` · `ObtenerTrakingHistorico` | Históricos | filtros | los mismos campos que Recorridos; traza GPS (`OcasaLiveTrackingHistory/...`) | `js/RecorridoHistorico/Recorridos.js:596, 857, 1354` |
| `POST /api/Siniestros/ObtenerSiniestros` | Siniestros | fechas, recorrido, dominio | `recorrido`, `descripcionSiniestro`, `patente`, `vehiculo`, `nombreChofer`, `centro`, `observaciones`, `adjuntos`, `fotos` | `js/Siniestros/Siniestros.js:160-175, 319-394` |
| `POST /StaticManager/GetMessageToDriver` | Mensajes al chofer (historial) | recorrido | mensajes | `Recorridos.js:1198` |

## Endpoints que escriben (no se tocaron)
- `POST /StaticManager/SaveMessageToDriver`: envía un mensaje al chofer (`Recorridos.js:1149`).
- `POST /Perfiles/ChangePasswordProfile`: cambio de clave (`js/site.js:293`).
- `POST /Home/Logout` (`Common.js:224`).

## Frecuencia de actualización (latencia)
- **Dashboard:** se refresca cada **2 minutos** (`dashboard.js:6, 130`).
- **Recorridos:** el refresco automático (2 min para la lista y 1 min para las posiciones, `Recorridos.js:34-37`) está **comentado** (`:118, :121, :647`). Las posiciones se cargan solo cuando el usuario elige un centro o un chofer.

## Pantallas sin acceso con este usuario
Replanificar, Usuarios WEB, ABM Logos y Transportistas redirigen al inicio (`/Home`), por permisos del perfil. Transportistas además devolvió "upstream request failed" en el primer intento.

## Observación de seguridad
El JavaScript público de Recorridos incluye una **clave de API de Google escrita en el código** (`js/Recorrido/Recorridos.js:1644` y `js/RecorridoHistorico/Recorridos.js:1588`, para la Routes API). En las copias de `lt_fuente/` quedó tapada. Conviene que el equipo de LT confirme que tiene restricción por dominio y por API.

## Decisión pendiente
Para ver datos reales (cantidades, estados de paradas, efectividad, siniestros) y sacar ejemplos de respuesta, habría que permitir estos POST **de lectura**:
- `GetCentros`
- `GetStatistics`
- `GetRecorridosTables`
- `GetParadasTables`
- `GetGEOData`
- `ObtenerSiniestros`

Seguirían bloqueados los de escritura: `SaveMessageToDriver`, `ChangePasswordProfile` y `Logout`.
