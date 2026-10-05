/*
 *     Trazabilidad de Recorridos
 */
var directionsRenderer = null;
/*
*
*
*    TODO  HAY QUE VER POR QUE NO BORRA EL TRAZO ANTERIOR  CUANDO SE TRAZA UNO NUEVO
* 
*
*
*
*/
async function trazarRecorrido(listaRecorrido) {

  


    if (listaRecorrido.length < 2) return;

    const directionsService = new google.maps.DirectionsService();
    const allPolylines = [];

    const chunks = dividirChunks(listaRecorrido, 10); 
     
    

 
    for (let i = 0; i < chunks.length; i++) {
        const tramo = chunks[i];
        const origin = tramo[0].position;
        const destination = tramo[tramo.length - 1].position;
        const waypoints = tramo.slice(1, -1).map(p => ({
            location: p.position,
            stopover: true
        }));

         
        const request = {
            origin,
            destination,
            waypoints,
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        };

         
        try {
             
            const result = await new Promise((resolve, reject) => {
                directionsService.route(request, (res, status) => {
                    if (status === "OK") {
                        
                        resolve(res); 

                    } else { 
                        reject(status); 
                    } 
                });
            }); 
            
            //const directionsRenderer = new google.maps.DirectionsRenderer({
            //    suppressMarkers: true,
            //    polylineOptions: {
            //        strokeColor: colorOCASA.calipso,
            //        strokeWeight: 5 
   
            //    }
            //});
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
            
            //allPolylines.push(result);
             
        } catch (err) {
            console.error("Error en Directions API tramo [!!!!]" + i, err);
        }
    }


    // console.log('******allPolylines *******');
    // console.log(JSON.stringify(allPolylines));
    // console.log('**************************');


     
}

function dividirChunks(listaRecorrido, maxWaypoints = 20) {
    const chunks = [];
    let start = 0;

    while (start < listaRecorrido.length) {
        const end = Math.min(start + maxWaypoints + 1, listaRecorrido.length); // +1 para incluir destino
        chunks.push(listaRecorrido.slice(start, end));
        start += maxWaypoints;
    }

    return chunks;
}


async function trazarRecorrido_soloPuntos(listaRecorrido) {
    // Primero limpiar marcadores previos si usas esa funcionalidad
    clearMarkers();

    const markersArray = listaRecorrido.map(item => {
        // Crear un marcador simple por cada punto
        const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: item.position, // Asumiendo que item tiene lat/lng en position
            title: `Punto ${item.idParada || ''}`, // Etiqueta opcional
        });
        return marker;
    });

    // Guardar los nuevos marcadores en el arreglo global
    markers.push(...markersArray);

    // Opcional: si usas agrupador de marcadores, actualizarlo así:
    if (markerCluster) {
        markerCluster.clearMarkers();
        markerCluster.addMarkers(markersArray);
    } else {
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers: markersArray });
    }
    centerMaps();
}

function centerMaps() {
    
    // Si no hay puntos recientes para centrar, evitar error
    if (!fragmentMarkers || fragmentMarkers.length === 0) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    // Extender bounds con cada posición de punto (fragmentMarkers es el arreglo de puntos actuales)
    fragmentMarkers.forEach(item => {
        bounds.extend(item.position);
    });

    // Ajustar el mapa para que todos los puntos queden en vista
    map.fitBounds(bounds);
}

function centerMapsWithMarkers(markersList) {
    // Si no hay puntos recientes para centrar, evitar error
    if (!markersList || markersList.length === 0) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    // Extender bounds con cada posición de punto (fragmentMarkers es el arreglo de puntos actuales)
    //markersList.forEach(item => {
    //    bounds.extend(item.position);
    //});
    markersList.forEach(marker => {
        marker.forEach(m => {
            bounds.extend(m.position);
        });
    });

    // Ajustar el mapa para que todos los puntos queden en vista
    map.fitBounds(bounds);
}


function mostrarPuntosEnMapaConClustering(lista_paradas) {
    // Crea array de marcadores

    const puntos = lista_paradas
                    .filter(item => item.position && item.position.lat && item.position.lng)  // Filtra solo items con position válida
                    .map(item => ({
                        lat: item.position.lat,
                        lng: item.position.lng,
                        title: `Punto ${item.idParada}`,
                        direccion: item.direccion,              // Opcional: datos adicionales
                        idParada: item.idParada,                // Opcional: para referencia
                        //imagenMarcador: item.imagenMarcador   // icono personalizado
                    }));




    const markers = puntos.map(function (punto) {
        return new google.maps.Marker({
            position: { lat: punto.lat, lng: punto.lng },
            map: map,
            title: punto.title || 'Punto',
            icon: null,
            optimized: true
        });
    });

    // Inicializa el clusterer (ajusta gridSize y maxZoom según necesidades)
    const clusterer = new markerClusterer.MarkerClusterer({
        map: map,
        markers: markers,
        renderer: {
            render: ({ count, position }) =>
                new google.maps.Marker({
                    label: { text: String(count), color: 'white', fontSize: '12px' },
                    position,
                    icon: undefined,  // Usa icono por defecto del clusterer
                    zIndex: 1000 + count
                })
        }
    });
}



/**
 * Dibuja una ruta en el mapa de Google a partir de una lista ordenada de puntos geográficos.
 * @param {Array} geoPoints - Lista ordenada de puntos con formato [{ position: { lat: ..., lng: ... } }, ...]
 */
function DrawGeoRoute(geoPoints) {
    if (!geoPoints || geoPoints.length < 2) return;

    // Limpiar ruta anterior si existe
    if (window.geoRoutePolyline) {
        window.geoRoutePolyline.setMap(null);
    }

    // Extraer coordenadas en formato google.maps.LatLng
    const routePath = geoPoints.map(p => new google.maps.LatLng(p.position.lat, p.position.lng));

    // Crear la Polyline
    window.geoRoutePolyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#007bff',
        strokeOpacity: 0.8,
        strokeWeight: 5
    });

    // Dibujar en el mapa
    window.geoRoutePolyline.setMap(map);

    // Ajustar el mapa para mostrar toda la ruta
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);
}