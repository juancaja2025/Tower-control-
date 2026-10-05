/*
 *            Paradas
 */
var listaRecorrido = [];



// Cargar paradas
async function mostrarParadas(recorrido) {

     

    //console.log(`[HORA:${muestraReloj()}]`);
    await CargarParadas(recorrido); 
    //console.log(`[HORA:${muestraReloj()}]`);
    await showParadas(recorrido);
     //console.log(`[HORA:${muestraReloj()}]`);

    $('#spinnerCargarRecorridos').remove();

}



async function CargarParadas(recorrido) {

    $('#section-search-recorridos').hide();
    
    const $curso = $('#myTabContentCurso').html('<div id="spinnerCargarRecorridos">cargando Paradas <i class="fas fa-spinner fa-spin"></i></div>');
    const $trans = $('#myTabContentTransaccionadas').html('<div id="spinnerCargarRecorridos">cargando Paradas <i class="fas fa-spinner fa-spin"></i></div>');
    const $fallidas = $('#myTabContentFallidas').html('<div id="spinnerCargarRecorridos">cargando Paradas <i class="fas fa-spinner fa-spin"></i></div>');

    fragmentMarkers = [];
    listaRecorrido = [];
    var listaRecorridoPrecesadas = [];

    var listaParadasExitosas = [];
    var listaParadasFallidas = [];
    var listaParadasPendientes = [];
     
    const filtros = { IdParada: recorrido };
    const directionsService = new google.maps.DirectionsService();
    ListaParadas_GEO_Planificada = [];

    try {
        const response = await $.ajax({
            url: '/api/Recorrido/GetParadasTables',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(filtros),
            dataType: 'json'
        });

        ListaParadas_GEO_Planificada = response.data; // Guardar paradas planificadas globalmente
        // Prepara promesas de coordenadas
        const paradasConCoords = await Promise.all(response.data.map(async (recorrido, idx) => {
            let lat = parseFloat(recorrido.sistema_1);
            let lng = parseFloat(recorrido.sistema_2);
            const [latReal, lngReal] = recorrido.latylong.split(',').map(Number);

            // Validar coordenadas
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                try {

                     
                    const coords = await obtenerCoordenadas(recorrido);
                    lat = parseFloat( coords.lat );
                    lng = parseFloat( coords.lon );

                     //lat = parseFloat(  0 );
                    //lng = parseFloat(  0  );
                     
                     
                } catch {
                    lat = 0; lng = 0;
                }
            }

            return { recorrido, lat, lng, latReal, lngReal, index: idx + 1 };
        }));

        // Construir HTML de tarjetas y lista de marcadores
        let cards = '';
        //let cardsProcesadas = '';


        /*
         *    CARGAR PARADAS
         */

        for (const item of paradasConCoords) {
            const { recorrido, lat, lng, latReal, lngReal, index } = item;

            if (lat === 0) continue;

            // Determinar estado
            let estadoIcon = '';

            let estadoColor = colorOCASA.calipso;
            let estadoColor2 = colorOCASA.calipsoClaro;
            let estadoclaseCSS = 'fondo-calipso '; 
            let estadoDescripcion = 'En curso';
            let estadoParada = recorrido.reasonCode || '';

            if (recorrido.reasonCode) {
                if (['Z4', 'Z1', 'RE'].includes(recorrido.reasonCode)) {
                    estadoColor = colorOCASA.verde;
                    estadoColor2 = colorOCASA.verdeClaro;
                    estadoDescripcion = 'Exitosa';
                    estadoclaseCSS = 'fondo-verde ';
                    estadoIcon = 'fa-circle-check';
                    listaParadasExitosas.push(recorrido);

                } else {
                    estadoColor = colorOCASA.rojo;
                    estadoColor2 = colorOCASA.rojoClaro;
                    estadoclaseCSS = 'fondo-rojo ';
                    estadoDescripcion = 'Fallida';
                    estadoIcon = 'fa-circle-xmark';
                    listaParadasFallidas.push(recorrido);
                }
            } else {
                switch (recorrido.env_recb) {
                    case 0: case 1: estadoColor = colorOCASA.naranja; estadoclaseCSS = 'fondo-naranja ';; estadoColor2 = colorOCASA.naranjaClaro; estadoIcon = 'fa-clock'; break;
                    case 2: estadoColor = colorOCASA.calipso; estadoclaseCSS = 'fondo-calipso '; estadoColor2 = colorOCASA.calipsoClaro; estadoDescripcion = 'En curso'; estadoIcon = 'fa-clock'; break;
                    case 3: estadoColor = colorOCASA.verde; estadoclaseCSS = 'fondo-verde '; estadoColor2 = colorOCASA.verdeClaro; estadoDescripcion = 'Finalizada'; estadoIcon = 'fa-circle-check'; break;
                }
                listaParadasPendientes.push(recorrido);
            }

            let urlImagenServicio
            let stopTitle = recorrido.idSistemaPropio;

            

            //TIPO DE SERVICIO
            switch (recorrido.tipodeServicio) {
                case "RETIRO":
                    urlImagenServicio = "/img/Retiro.png";
                        break;
                case "ENTREGA":
                    urlImagenServicio = "/img/Entrega.PNG";
                        break;
                case "MASIVO":
                    urlImagenServicio = "/img/Macivo.png";
                    stopTitle = "MASIVO";
                        break;
                    default:
                        urlImagenServicio = "/img/Entrega.PNG";
                        break;
            }   

            //console.log(`tipo de servicio ${recorrido.tipodeServicio} | la URL ${urlImagenServicio}`);

            //Genera el icono de recorrido para mostrar en mapa
            const svgURL = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker(String(recorrido.idParada), estadoColor));




            let cardHTML = `
                <div class="stop-card m-0 p-0" style="border-left:5px solid ${estadoColor}; margin-bottom:10px;"
                     data-idSistema="${recorrido.idSistemaPropio}" 
                     data-stop-id="${recorrido.idParada - 1}"
                     data-idparada="${recorrido.recorrido}" 
                     data-tipo-parada="${recorrido.tipodeServicio}"
                     data-estado-descripcion="${estadoDescripcion}"
                     data-reasonCode="${recorrido.reasonCode}"
                     data-clave="${recorrido.clave}" 

                     id="idParada_${recorrido.idParada}"  
                     data-bs-toggle="modal" data-lat="${lat}" data-log="${lng}" data-bs-target="#stop-details-modal">
                     <div class="row w-100 m-0 p-1" style="min-height:90px;">
                         <div class="col-2 m-0 p-0 d-flex flex-column justify-content-center align-items-center gap-2">
                             <div class="step-square" style="background-color:${colorOCASA.calipso};">${recorrido.idParada}</div>
                             <div class="icono-entrega"><img src="${urlImagenServicio}" style="width:35px; margin-bottom:5px;" /></div>
                         </div>
                         <div class="col-8 m-0 p-0 d-flex flex-column">
                             <div class="stop-info">
                                 <p class="stop-title">${stopTitle}</p>
                                 <small class="stop-subtitle">${recorrido.localidad} - ${recorrido.direccion}</small>`;

            if(estadoParada)
                cardHTML += `<small class="stop-subtitle">Hora de Gestión: ${recorrido.horaDeGestion}</small>`;

            cardHTML += `</div>
                            <div class="mt-auto">
                                <small class="stop-subtitle" style="justify-content: end;font-weight: 500;">Bultos: ${recorrido.cantBultos}</small>
                            </div>
                        </div>

                        <div class="col-2 m-0 p-0 d-flex flex-column justify-content-center align-items-center" style="color:${estadoColor};">
                            <span class="status-badge" style="background-color:${estadoColor2};"> 
                                ${estadoDescripcion}
                                <i class="fa-solid ${estadoIcon}"></i>
                            </span>
                        </div>
                    </div>
                </div>`;

            if (estadoParada) {
                recorrido.html = cardHTML;
                listaRecorridoPrecesadas.push(recorrido);

                // Esta linea se coloca una vez ordenadas las precesadas
                //cardsProcesadas += cardHTML;
            }
            else cards += cardHTML;

            // Agregar marcador al fragment
            fragmentMarkers.push({
                idParada: recorrido.idParada,
                position: { lat, lng },
                title: recorrido.direccion,
                imagenMarcador: svgURL,
                direccion: recorrido.direccion,
                codigoPostal: recorrido.codigoPostal,
                localidad: recorrido.localidad,
                provincia: recorrido.provincia,
                estadoclaseCSS: estadoclaseCSS,
                estadoColor: estadoColor 
            });

            // Guardar en listaRecorrido
             
            recorrido.position = { lat, lng };
            recorrido.positionReal = { lat: latReal, lng: lngReal };
            recorrido.title = recorrido.direccion;
            recorrido.index = index,
            recorrido.imagenMarcador = svgURL;
            recorrido.Piezas= ''; 
             

            listaRecorrido.push( recorrido );
        }



        // Ordenamiento de la lista exitosas una vez que esta completa
        listaRecorridoPrecesadas.sort((a, b) => {
            const timeA = a.horaDeGestion.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const timeB = b.horaDeGestion.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

            return timeB - timeA; // orden descendente, mayor primero
        });
        listaParadasExitosas.sort((a, b) => {
            const timeA = a.horaDeGestion.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const timeB = b.horaDeGestion.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

            return timeB - timeA; // orden descendente, mayor primero
        });



        // Ordenamiento de la lista fallidas una vez que esta completa
        listaParadasFallidas.sort((a, b) => {
            const timeA = a.horaDeGestion.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const timeB = b.horaDeGestion.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

            return timeB - timeA; // orden descendente, mayor primero
        });



        //let html_cards_procesadas = listaRecorridoPrecesadas.map(recorrido => recorrido.html).join('');
        let html_cards_exitosas = listaParadasExitosas.map(recorrido => recorrido.html).join('');
        let html_cards_fallidas = listaParadasFallidas.map(recorrido => recorrido.html).join('');
         
        //$trans.html(cardsProcesadas || '<p>Sin Paradas</p>');

        //$trans.html(html_cards_procesadas || '<p>Sin Paradas</p>');
        $trans.html(html_cards_exitosas || '<p>Sin Paradas</p>');
        $curso.html(cards || '<p>Sin Paradas</p>');
        $fallidas.html(html_cards_fallidas || '<p>Sin Paradas</p>');

        addEventParadasClick();
        
        return;
         
    } catch (err) {
        console.error(err);
        alert('Ocurrió un error al obtener los datos. Por favor, inténtelo de nuevo más tarde.');
        return;
    } 
     
     
}

async function showParadas(recorrido) {
 
    clearMarkers();
    
    
    // Crear marcadores en lote
    const markersArray = fragmentMarkers.map(item => {

        const label = document.createElement("div");
        label.className = "marker-label color-blanco ";
        label.textContent = item.idParada;


        // 🔹 Fondo del marcador
        label.style.backgroundColor = item.estadoColor;

        // 🔹 Triángulo (punta del marcador)
        label.style.setProperty('--punta-color', item.estadoColor);


        const marker = new AdvancedMarkerElement({
            map,
            position: item.position,
            content: label,
            title: label.textContent,
        });



        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="min-width:200px;style='border:2px dashed red;'">
                        <b>${item.direccion}</b><br/>
                        ${item.codigoPostal} ${item.localidad}<br/>
                        Provincia de ${item.provincia}<br/>
                        </div>`,
                 
        });
             

        // Eventos marcadores
        marker.addListener("click", () => infoWindow.open(map, marker));

  
        return marker;


    });

    markers.push(...markersArray);
    markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

    //console.log(`[HORA:${muestraReloj()}] * --> Se cargaro showParadas(recorrido) `);

    
    //trazarRecorrido(listaRecorrido); 
    centerMaps();
    //trazarRecorrido_soloPuntos(listaRecorrido);
    
}


//  Añadir marcador de almacén
async function addWarehouseMarker(latitud, longitud, title_marker) {

    
    if (title_marker == undefined) {
        title = "Almacén OCASA";
    }
    // Limpia la lista de sucursales
    ListaPosicion_GEO_sucursales = [];

    clearWarehouseMarkers();
    //const warehouseLocation = { lat: latitud, lng: longitud };
    // definir el ícono personalizado para el almacén
    //const warehouseIcon = {
    //    url: 'img/OcasaWH80x80.png', // URL de la imagen personalizada,
    //    scaledSize: new google.maps.Size(40, 40), // Tamaño escalado del icono,
    //};

    
    const contentDiv = document.createElement('div');
    //contentDiv.style.background = 'white';
    //contentDiv.style.border = '2px solid #0C9D61';
    //contentDiv.style.borderRadius = '15px';
    contentDiv.style.padding = '5px';
    contentDiv.style.display = 'flex';
    contentDiv.style.alignItems = 'center';

    // Agregar imagen al div
    const img = document.createElement('img');
    img.src = '/img/pin_ocasa.svg';
    img.style.width = '57px';
    img.style.height = '64px';
    img.style.marginRight = '5px';

    // Agregar texto al div
    //const span = document.createElement('span');
    //span.textContent = 'Depósito Ocasa';

    const infoWindow = new google.maps.InfoWindow({
        content: `<div style="min-width:200px;style='border:2px dashed red;'">
                        <b>${title_marker}</b><br/>                        
                  </div>`,

    });


    // Armar el contenido
    contentDiv.appendChild(img);
    //contentDiv.appendChild(span);


    const marker = new AdvancedMarkerElement({
        map: map,
        position: { lat: latitud, lng: longitud }, // posición del marcador
        title: title_marker,
        content: contentDiv
    }); 
    Marcadores_GoogleGEO_sucursales.push(marker);
    ListaPosicion_GEO_sucursales.push(marker);

    // Eventos marcadores
    marker.addListener("click", () => infoWindow.open(map, marker));
    
    centrarMapa(latitud, longitud);
    

}
 
async function clearWarehouseMarkers() {

    Marcadores_GoogleGEO_sucursales.forEach(marker => marker.setMap(null)); // Quita cada marcador del mapa
    Marcadores_GoogleGEO_sucursales = []; // Limpia el array para liberar referencias
}
/// FILTRAR PARADAS

function filtrarParadas(filtro) {
    
    var Mensaje = `
        <div id="no-results-alert" class="alert alert-warning text-center mt-3" role="alert">
            <span class="material-symbols-outlined align-middle me-1">warning</span>
            No existe parada que coincida con la búsqueda.
        </div>`;

    //data-parada="${ruta.ruta}" data-id-parada="${ruta.recorrido}"

    let searchText = filtro.toLowerCase().trim();
    let encontrados = 0;

    // Recorre todas las tarjetas
    $('.route-card').each(function () {
        let idParada = $(this).data('idparada').toString().toLowerCase();
        let parada = $(this).data('parada').toString().toLowerCase();

        if (idParada.includes(searchText) || parada.includes(searchText)) {
            $(this).show();
            encontrados++;
        } else {
            $(this).hide();
        }
    });

    // Elimina alertas previas
    $('#no-results-alert').remove();

    // Si no encontró resultados, agrega el mensaje al final del contenedor
    if (encontrados === 0) {
        $('#myTabContent').append(Mensaje);
    }

    // console.log(`[HORA:${muestraReloj()}] * --> Se cargaro filtrarParadas(filtro) `);

}



/// EVENTOS /////
function addEventParadasClick() { 
    $(".stop-card").on("click", function () {
        // this es la tarjeta clickeada
        let idParada = $(this).attr("data-stop-id");
        let claveParada = $(this).attr("data-clave");
        let lat = $(this).data("lat");
        let log = $(this).data("log");

        centrarMapa(lat, log, 20);
        //getByIdParada(idParada);
        getByIdParada(claveParada);

        // Busca datos de la novedad para extraer las fotos
        //GetNovedad();
        google.maps.event.trigger(map_modal, "resize");

        
    });
}



/*
 *     MOSTAR HORA 
 */
function muestraReloj() {
    let ahora = new Date();
    let horas = String(ahora.getHours()).padStart(2, '0');
    let minutos = String(ahora.getMinutes()).padStart(2, '0');
    let segundos = String(ahora.getSeconds()).padStart(2, '0');
    let milisegundos = String(ahora.getMilliseconds()).padStart(3, '0');
    return `${horas}:${minutos}:${segundos}.${milisegundos}`;
}

