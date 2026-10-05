/*
 *     MAPA
 */
// DECLARACION DE VARIABLES
  
  let map;  
  let AdvancedMarkerElement;
  
 
//async function initMap() {
window.initMap = async function () {
    // Importar solo una vez las librerías necesarias
    const { Map } = await google.maps.importLibrary("maps");
    const markerLib = await google.maps.importLibrary("marker");
    AdvancedMarkerElement = markerLib.AdvancedMarkerElement; // ← guardamos en global


    // --- Mapa principal ---
    map = new Map(document.getElementById("map"), {
        center: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
        zoom: 12,
        mapId: "4504f8b37365c3d0",
    });
    //map.setCenter({ lat: -34.6037, lng: -58.3816 }); // Buenos Aires
    // --- Mapa en ventana modal ---
    map_modal = new Map(document.getElementById("modal-map"), {
        center: { lat: -34.6037, lng: -58.3816 },
        zoom: 18,
        mapId: "4504f8b37365c3d1",
        draggable: true,
        zoomControl: false,
        scrollwheel: true,
        disableDoubleClickZoom: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });
}


// 👉 Refresca los puntos (cargar cuando vos quieras)
function refreshMap(lista) {
     

    lista.forEach(item => {
        addMarker(item);
    });

    // Agrupar marcadores con MarkerClusterer
    new markerClusterer.MarkerClusterer({ map, markers });


}

// 👉 Centra el mapa en una posición específica
function centrarMapa(lat, lng, zoom = 14) {
    var posicion = new google.maps.LatLng(lat, lng);
    map.setCenter(posicion);
    map.setZoom(zoom); // opcional, por defecto te acerco al nivel 14
}


// 👉 direccion => coordenadas

function obtenerCoordenadas(recorrido) {
    return new Promise((resolve, reject) => {
        var geocoder = new google.maps.Geocoder();

         

        geocoder.geocode(
            {
                'address': recorrido.direccion + ', ' + recorrido.localidad + ', ' + recorrido.provincia,
                componentRestrictions: { country: recorrido.pais }
            }, function (results, status) {
                if (status === 'OK') {
                    var coords = {
                        lat: results[0].geometry.location.lat(),
                        lon: results[0].geometry.location.lng()
                    };
                     
               resolve(coords);
                } else {
                    reject("Error en geocodificación: " + status);
                }
            });
    });
}

// 👉 validamos las coordenadas

function isValidCoord(coord) {
    if (!coord || typeof coord.lat !== "number" || typeof coord.lng !== "number") {
        return false;
    }
    if (isNaN(coord.lat) || isNaN(coord.lng)) {
        return false;
    }
    if (coord.lat < -90 || coord.lat > 90) {
        return false;
    }
    if (coord.lng < -180 || coord.lng > 180) {
        return false;
    }
    // Evitar valores no válidos específicos si quieres
    const invalidValues = [0, 1, 2, 3];
    if (invalidValues.includes(coord.lat) || invalidValues.includes(coord.lng)) {
        return false;
    }
    return true;

    //return coord
    //    && typeof coord.lat === "number"
    //    && typeof coord.lng === "number"
    //    && !isNaN(coord.lat)
    //    && !isNaN(coord.lng)
    //    && !(coord.lat === 0 && coord.lng === 0);
}

  
function filterRouteCards() {
    const recorrido = routeSearchInput.value.toLowerCase();
    const ruta = routeSearchInput.value.toLowerCase();

    document.querySelectorAll('.route-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(recorrido) || text.includes(ruta)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterParadasCards() {
    const parada = detailsSearchInput.value.toLowerCase();
    // const ruta = detailsSearchInput.value.toLowerCase();

    document.querySelectorAll('.stop-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(parada) ) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });



}

