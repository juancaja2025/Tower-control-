/*
 *    MARCADORES EN EL MAPA
 */
var markers = [];
var markerCluster = null; // Variable global para el clúster de marcadores
var directionsRenderer = null;

// 👉 Función para limpiar marcadores + cluster
function clearMarkers() {
    // Eliminar marcadores del mapa
    
    markers.forEach(m => m.setMap(null));
    markers = [];

    // Eliminar cluster viejo
    if (markerCluster) {
        markerCluster.clearMarkers(); // limpia todos los marcadores agrupados
        markerCluster = null;
    }

    if (directionsRenderer) {

        // console.log(JSON.stringify(directionsRenderer))

        directionsRenderer.setMap(null); // eliminar trazado anterior
        directionsRenderer = null;
    }

}

// 👉 Agrega un marcador individual
function addMarker(item) {
     
    // Escapamos los caracteres especiales y creamos un data URL
    const svgURL = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker('R', '#0099A8'));

 
    var marker = new google.maps.Marker({
        position: item.position,
        title: item.title,
        map: map,
        icon: {
            url: svgURL,
            scaledSize: new google.maps.Size(40, 40) // tamaño del ícono
        }
    });

 
    var infoWindow = new google.maps.InfoWindow({
        content: `<div style="min-width:200px;">${item.title}</div>`
    });

    marker.addListener("click", function () {
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

 
 
/*
 *    EVENTOS
 */

$("#toggleBtnRuta").click(function () {

    $("#Ruta_sidebar").removeClass("OCULTO");
    $("#Ruta_sidebar").toggleClass("active"); 

    if ($("#Ruta_sidebar").hasClass("active")) {
        $("#toggleBtnRuta").html('<i class="fa-solid fa-caret-left"></i>');

    } else {
        $("#toggleBtnRuta").html('<i class="fa-solid fa-caret-right"></i>');
    }
});


///////////////////////////////////////////////////////////////////////////////
//                            SVG MARCADORES                                 //
///////////////////////////////////////////////////////////////////////////////

function svgMarker(texto,color){

return `
    <svg width="120" height="140" xmlns="http://www.w3.org/2000/svg">  
    <rect
      x="10"
      y="10"
      width="100"
      height="100"
      rx="15"
      ry="15"
      fill="${color}"
      stroke="${color}"
      stroke-width="2"/> 
    <polygon
      points="45,110 75,110 60,140"
      fill="${color}"
      stroke="${color}"
      stroke-width="2"/> 
    <text
      x="60"
      y="65"
      text-anchor="middle"
      alignment-baseline="middle"
      font-size="50"
      font-family="Arial, sans-serif"
      fill="white"
      font-weight="bold">
      ${texto}
    </text> 
</svg> 
`;
}
