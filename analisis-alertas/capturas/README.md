# Capturas de Live Tracking (05/10/2026)

Las capturas son de la web real, tomadas en solo lectura.

**Las pantallas se ven sin datos.** LT carga todo su contenido por POST, y esas llamadas quedaron bloqueadas por la regla de solo GET (ver `../lt_endpoints.md`). Los estilos de Bootstrap se sirvieron desde una copia local del mismo paquete, porque la red del entorno bloquea `cdn.jsdelivr.net`.

| Archivo | Pantalla | URL |
|---|---|---|
| `00_login.png` | Login, sin datos cargados | `/Login` |
| `01_inicio_tras_login.png` | Inicio después del login | `/Dashboard/Dashboard` |
| `02_dashboard.png` | Dashboard: KPIs y gráficos, vacíos | `/Dashboard/Dashboard` |
| `03_recorridos.png` | Recorridos en tiempo real: lista y mapa ("Sin Centros") | `/Recorrido/Index` |
| `04_sin_permiso_redirige_a_home.png` | Replanificar, Usuarios WEB, ABM Logos y Transportistas: sin permiso, redirigen a `/Home` | `/RecorridoReplanificar/...`, `/Perfiles/Perfil`, `/api/Logos`, `/Usuario` |
| `05_historicos.png` | Históricos | `/RecorridoHistorico/Historicos` |
| `06_siniestros.png` | Gestión de siniestros ("No se pudieron cargar") | `/api/Siniestros` |
| `07_ayuda_manual.png` | Ayuda / Manual | `/Ayuda/Manual` |

En ninguna captura aparece la contraseña.
