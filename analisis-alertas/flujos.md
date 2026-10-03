# Flujos de alertas por proceso

Cómo leer los diagramas:
- **Celeste:** lo que detecta LT (unidad, viaje, troncal; minutos).
- **Violeta:** lo que detecta la Torre (agregados y cruce de fuentes).
- **Gris:** la Bitácora, que es la única cola de gestión.
- **Línea punteada:** lo que falta (FALTANTE) o lo que no está confirmado.
- Los códigos son los de `catalogo_propuesto.csv`. Los IDs entre corchetes (T29, L07…) remiten a `inventario_alertas.csv`.

Reglas comunes a todos los procesos (hoy en `torre/index.html`):
- **Vencimiento:** P1 2 h, P2 4 h, P3 8 h (`:1978`).
- **Estados:** nueva → reconocida → en gestión → resuelta → cerrada con causa (`:1955`).
- **Contingencia:** escala las P1 al Jefe de turno (`:2513`).
- **Lo que falta en todos:** el autocierre y el escalado por vencimiento (F04, F07).

---

## 1. Troncales

```mermaid
flowchart LR
  subgraph LT["Live Tracking · detecta"]
    A1["TRONCAL_SIN_SALIR [T30]<br/>sin ATD pasado el ETD"]
    A2["TRONCAL_DEMORADA_SALIDA [T29]<br/>+15 aviso / +45 crítico"]
    A3["UNIDAD_DETENIDA [T31]<br/>más de 20 min (DEMO)"]
    A4["UNIDAD_SIN_GPS [T33]<br/>25 vs 30/60 min"]
    A5["INCIDENCIA_TRONCAL [T34]<br/>mail de monitoreo, por patente"]
    A6["TRONCAL_ARRIBO_TARDE [F02]<br/>ATA mayor que ETA"]
    A7["TRONCAL_FUERA_DE_RUTA [F03]"]
    N8N["Agente n8n Troncales [A02]<br/>reglas NO ENCONTRADO"]
  end
  subgraph TC["Torre · agrega"]
    B1["TRONCALES_A_TIEMPO_BAJO [T27]<br/>92% / 85%"]
    B2["PIEZAS_EN_VIAJE_POR_VENCER [T36]"]
    B3["SUCURSAL_EN_RIESGO [F01]"]
    B4["RIESGO_EXTERNO [T37]<br/>capa manual"]
  end
  BIT[("Bitácora<br/>dueño: Tráfico")]
  A1 -->|P1| BIT
  A2 -->|"P2 / P1 si más de 45"| BIT
  A3 -->|P1| BIT
  A4 -->|P3| BIT
  A5 --> BIT
  A6 -.-> BIT
  A7 -.-> BIT
  N8N -.->|"¿duplica A1–A5?"| BIT
  A1 & A2 --> B1
  A2 & A6 --> B2
  A3 -.->|"N unidades en la misma sucursal"| B3
  B4 -.->|"explica, sin vínculo"| BIT
  B1 & B2 & B3 -->|P2| BIT
  BIT --> R1{{"Se cierra sola si:<br/>hay ATD · la unidad se mueve ·<br/>vuelve el GPS · ETA en tolerancia"}}
  classDef lt fill:#d6f0f5,stroke:#0099a8,color:#0e1214
  classDef tc fill:#e8e0fb,stroke:#6f4fd1,color:#0e1214
  classDef bit fill:#eceff1,stroke:#4e595d,color:#0e1214
  class A1,A2,A3,A4,A5,A6,A7,N8N lt
  class B1,B2,B3,B4 tc
  class BIT,R1 bit
```

**Lectura:**
- Todo lo que pasa sobre una troncal o una unidad lo tiene que detectar LT. Hoy la Torre calcula la demora por troncal (T29, T30) y además el color de la troncal en el mapa depende solo de las excepciones abiertas (`:1098`), no de la demora.
- Antes de unificar hay que resolver dos conflictos. La tolerancia es de 15 min en el código y de 20 min en el KPI. La definición de "a tiempo" mide el arribo (ATA) y el código mide la salida (ATD).
- La única alerta que hoy entra sola a la Bitácora es la unidad detenida (E-2293, simulada en `:2645`). Ese es el patrón a replicar.

---

## 2. Admisión

```mermaid
flowchart LR
  subgraph LT["Live Tracking · detecta"]
    A1["Unidad arriba tarde a planta<br/>(evento de citación) [T25]"]
    A2["DIRECCION_SIN_GEO [L05]"]
    N8N["Agente n8n Admisión [A01]<br/>reglas NO ENCONTRADO"]
  end
  subgraph TC["Torre · agrega"]
    B1["CIRCUITO_TRANSPORTE_DEMORADO [T25]<br/>cita→arribo ≤30 min · arribos menos de 90% del plan"]
    B2["ADMISION_CORTE_EN_RIESGO [T58]<br/>umbral NO ENCONTRADO"]
    B3["ECOMMERCE_PICKING_ATRASADO [T59]"]
    B4["EQUIPO_SIN_MOVIMIENTO [T14]<br/>+15 / +30 días"]
    B5["FUENTE_SIN_DATOS · WMS [T09]<br/>5 min"]
    B6["FALLA_EQUIPAMIENTO [T60]<br/>carga manual"]
  end
  BIT[("Bitácora<br/>dueño: Admisión Pacheco / Sucursal")]
  A1 --> B1
  N8N -.->|"¿duplica B2?"| B2
  A2 -.->|"huérfana hoy"| BIT
  B1 -->|P3| BIT
  B2 -->|P2| BIT
  B3 -->|P2| BIT
  B4 -.->|"hoy solo semáforo"| BIT
  B5 -->|P2| BIT
  B6 -->|P3| BIT
  BIT --> R1{{"Se cierra sola si:<br/>100% escaneado antes del corte ·<br/>arribos vuelven al plan · WMS actualiza"}}
  classDef lt fill:#d6f0f5,stroke:#0099a8,color:#0e1214
  classDef tc fill:#e8e0fb,stroke:#6f4fd1,color:#0e1214
  classDef bit fill:#eceff1,stroke:#4e595d,color:#0e1214
  class A1,A2,N8N lt
  class B1,B2,B3,B4,B5,B6 tc
  class BIT,R1 bit
```

**Lectura:**
- Admisión depende de cortes y volumen por cliente, así que lo detecta la Torre. LT solo aporta la llegada de la unidad a planta.
- El corte de admisión (E-2286) no tiene regla ni umbral: es un ejemplo cargado a mano. Hay que confirmar si el agente n8n de admisión ya lo detecta (posible DUPLICADA).

---

## 3. Última milla

```mermaid
flowchart LR
  subgraph LT["Live Tracking · detecta"]
    A1["UNIDAD_DETENIDA [T31]"]
    A2["UNIDAD_SIN_GPS [T33]"]
    A3["ENTREGA_FUERA_DE_GEO [L07]<br/>más de 700 m"]
    A4["CHOFER_VISITAS_FALLIDAS [F05]<br/>30% (texto de E-2283)"]
    A5["RECORRIDO_SIN_INICIAR [F06]"]
    A6["GEO_INCORRECTA [L06]"]
    A7["Visita fallida por motivo [L04]"]
  end
  subgraph TC["Torre · agrega"]
    B1["SUCURSAL_EN_RIESGO<br/>SLA 95/93 + N eventos de LT"]
    B2["PRIMER_INTENTO_BAJO [T12]<br/>88 / 85"]
    B3["VISITAS_NO_EFECTIVAS_ALTAS [T17, T24]<br/>10 / 14 · motivo más de 35%"]
    B4["DESVIOS_EN_CALLE_ZONA [T05]<br/>20 o más por provincia"]
    B5["AVANCE_DIA_BAJO [T15] · PIEZAS_SLA_EN_RIESGO [T19]<br/>BACKLOG_ANTIGUO [T13] · REENCAMINADOS_ALTOS [T18]"]
  end
  BIT[("Bitácora<br/>dueño: Última milla AMBA / Sucursal")]
  A1 & A2 -->|"P2 / P3"| BIT
  A1 & A5 -.->|"3 o más en la misma sucursal"| B1
  A4 -.-> B2
  A7 --> B3
  A3 --> B4
  A6 -.->|"huérfana hoy"| BIT
  B1 -->|"P1 / P2"| BIT
  B2 & B3 & B4 & B5 -->|"P2 / P3"| BIT
  BIT --> R1{{"Se cierra sola si:<br/>la unidad se mueve · el recorrido inicia ·<br/>el indicador vuelve a objetivo"}}
  classDef lt fill:#d6f0f5,stroke:#0099a8,color:#0e1214
  classDef tc fill:#e8e0fb,stroke:#6f4fd1,color:#0e1214
  classDef bit fill:#eceff1,stroke:#4e595d,color:#0e1214
  class A1,A2,A3,A4,A5,A6,A7 lt
  class B1,B2,B3,B4,B5 tc
  class BIT,R1 bit
```

**Lectura:**
- Es el proceso con más indicadores con semáforo en la Torre (T11–T26) y casi ninguno abre una excepción: son HUÉRFANAS.
- LT tiene el dato por parada y por chofer (visitas fallidas, geo, desvío de 700 m) pero no lo alerta. Ese dato debería alimentar la alerta agregada SUCURSAL_EN_RIESGO, que hoy no existe (F01).
- Hay que unificar la lista de motivos de no entrega entre LT y la Torre.

---

## 4. Crossdock

```mermaid
flowchart LR
  subgraph LT["Live Tracking · detecta"]
    A1["TRONCAL_ARRIBO_TARDE [F02]<br/>troncal o colecta hacia el XD"]
    A2["TRONCAL_SIN_SALIR [T30]<br/>salida desde el XD"]
  end
  subgraph TC["Torre · detecta y agrega"]
    B1["XD_ARRIBO_ATRASADO [T48]<br/>umbral NO ENCONTRADO"]
    B2["XD_CPT_EN_RIESGO [T44]<br/>proyección 100 / 97 / 94%"]
    B3["XD_OLA_EN_RIESGO [T47]<br/>KPI 95/90; por ola NO ENCONTRADO"]
    B4["XD_RFD_BAJO · XD_DOT_BAJO · XD_PLAYA_ALTA<br/>XD_ARMADO_PENDIENTE · XD_AVANCE_HU_BAJO [T38–T45]"]
    B5["XD_VOLUMEN_ANOMALO [T48]"]
    B6["XD_CUELLO_DE_BOTELLA · CBN [T49]"]
    B7["FUENTE_SIN_DATOS · API MELI [T09]<br/>5 min"]
  end
  BIT[("Bitácora<br/>dueño: Crossdock Pacheco")]
  A1 --> B1
  B1 --> B2 & B3
  A2 -->|P1| BIT
  B4 --> B2
  B2 -->|"P1 a menos de 1 h del corte"| BIT
  B3 -->|P2| BIT
  B5 -.->|"hoy en una lista aparte"| BIT
  B6 -.-> BIT
  B7 -->|P2| BIT
  BIT --> R1{{"Se cierra sola si:<br/>arriba la unidad · proyección ≥100% ·<br/>la ola se despacha"}}
  classDef lt fill:#d6f0f5,stroke:#0099a8,color:#0e1214
  classDef tc fill:#e8e0fb,stroke:#6f4fd1,color:#0e1214
  classDef bit fill:#eceff1,stroke:#4e595d,color:#0e1214
  class A1,A2 lt
  class B1,B2,B3,B4,B5,B6,B7 tc
  class BIT,R1 bit
```

**Lectura:**
- El crossdock es casi todo de la Torre: cortes, CPT y volumen. La relación clave es que una troncal o colecta atrasada (LT) eleva el riesgo del CPT y de la ola.
- Las "excepciones del crossdock" (subidas o bajas de volumen, atraso de ETA, `:1804`) hoy viven en una lista separada y no entran en la Bitácora. Hay que llevarlas a la cola única.

---

## 5. Courier / CBT (incluye MELI Courier / Direxa)

```mermaid
flowchart LR
  subgraph LT["Live Tracking / n8n · detecta"]
    N1["Agente n8n MELI Courier / Direxa [A03]<br/>NO ENCONTRADO"]
    N2["Agente n8n CBT [A04]<br/>NO ENCONTRADO"]
    A1["UNIDAD_DETENIDA / SIN_GPS<br/>en la UM de CBT"]
  end
  subgraph TC["Torre · detecta y agrega"]
    B1["FUENTE_SIN_DATOS · Aduana [T09]<br/>10 min"]
    B2["CBT_LOTE_RETENIDO [T56]<br/>canal rojo"]
    B3["CBT_LIBERACION_LENTA [T54]<br/>8 h / 12 h"]
    B4["CBT_SLA_BAJO [T51, T52]<br/>24 h 95/93 · 48 h 98/96"]
    B5["CBT_STOCK_ADUANA_ALTO [T53] · CBT_VENCIMIENTO_EN_RIESGO [T57]"]
    B6["CBT_UM_BAJO [T55]<br/>96 / 94"]
  end
  BIT[("Bitácora<br/>dueño: Sistemas / Despachante / Atención")]
  N1 & N2 -.->|"¿duplican B2–B4?"| B4
  B1 -->|P2| BIT
  B2 -->|"P3 / P2 si vence hoy"| BIT
  B3 --> B4
  B4 -->|P2| BIT
  B5 -->|"P2 / P3"| BIT
  A1 --> B6
  B6 -->|P3| BIT
  BIT --> R1{{"Se cierra sola si:<br/>vuelve el feed de Aduana · se libera el lote ·<br/>el SLA vuelve a objetivo"}}
  classDef lt fill:#d6f0f5,stroke:#0099a8,color:#0e1214
  classDef tc fill:#e8e0fb,stroke:#6f4fd1,color:#0e1214
  classDef bit fill:#eceff1,stroke:#4e595d,color:#0e1214
  class N1,N2,A1 lt
  class B1,B2,B3,B4,B5,B6 tc
  class BIT,R1 bit
```

**Lectura:**
- CBT cruza aduana, cliente y vencimiento, así que se detecta en la Torre. LT solo aporta la última milla.
- Hay que confirmar si los agentes n8n de CBT y MELI Courier/Direxa miden lo mismo que T51 a T56. Si es así, son DUPLICADAS y debería quedar una sola fuente de la alerta.
- El conflicto a resolver es el SLA 24 h (T51) contra el tiempo de liberación de 8/12 h (T54).
