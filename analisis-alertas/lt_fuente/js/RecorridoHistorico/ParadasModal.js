/*
 *       ParadasModal
 *       Muestra ventana modal para de determinada parada
 */

let map_modal; 
var modalMarker = []; 
 
async function getByIdParada(clave) {

  

    // Recentrar al último marker(s) cargado(s)
    if (modalMarker.length > 0) {
        let bounds = new google.maps.LatLngBounds();
        modalMarker.forEach(m => bounds.extend(m.getPosition()));
        map_modal.fitBounds(bounds);

        // opcional: limitar el zoom máximo
        if (map_modal.getZoom() > 17) {
            map_modal.setZoom(17);
        }
    }


    clearModalMarkers();

    //let recorrido = listaRecorrido[idParada];
    let recorrido = listaRecorrido.find(item => item.clave === clave);
    let bultosCargaMasiva = "";
  
    $("#modal_Piezas").text(`-`);
    let piezas = await getBultParadaMaciva(recorrido.idRecorrido, recorrido.idParada);


    //console.log(`PIEZAS:   ${piezas}`);
    //console.log(JSON.stringify(recorrido));
     

    recorrido.lecturadeDNI = (recorrido.lecturadeDNI) ? recorrido.lecturadeDNI : '';
    recorrido.documento = (recorrido.documento) ? recorrido.documento : '';
    recorrido.HoraDeGestion = (recorrido.HoraDeGestion) ? recorrido.HoraDeGestion : '';
    recorrido.Receptor = (recorrido.receptor) ? recorrido.receptor : '';
    recorrido.vinculo = (recorrido.vinculo) ? recorrido.vinculo : '';

    recorrido.Motivo = (recorrido.motivo) ? recorrido.motivo : '';
    recorrido.Submotivo = (recorrido.submotivo) ? recorrido.submotivo : '';
    recorrido.AvisoEnCamino = (recorrido.avisoEnCamino) ? recorrido.avisoEnCamino : '';
    recorrido.Piezas = (recorrido.Piezas) ? recorrido.Piezas : '';
    recorrido.ComentarioAlChofer = (recorrido.comentarioChofer) ? recorrido.comentarioChofer : '';
    recorrido.geolocalizaionCorrecta = (recorrido.geolocalizaionCorrecta) ? recorrido.geolocalizaionCorrecta : '';

    $("#modal-ruta-planificada").text(`${recorrido.position.lat}, ${recorrido.position.lng}`);
    if (recorrido.position.lat !== undefined && recorrido.position.lat !== '' &&
        recorrido.position.lng !== undefined && recorrido.position.lng !== '' &&
        recorrido.positionReal.lat !== undefined && recorrido.positionReal.lat !== '' && recorrido.positionReal.lat !== 3 &&
        recorrido.positionReal.lng !== undefined && recorrido.positionReal.lng !== '' && recorrido.positionReal.lng !== 3
    ) {
        
        let distance = getCoordinateDistance(recorrido.position.lat, recorrido.position.lng, recorrido.positionReal.lat, recorrido.positionReal.lng)
        $('#modal-distancia_mts').text(
            distance.toFixed(0)
            + ' mts'
        );
        if (distance > 700)
            $('#modal-distancia_mts').css('color', '#ff0000');
        else
            $('#modal-distancia_mts').css('color', '#6c757d');
        
    }
    else
        $('#modal-distancia_mts').text('No disponible');

    $('#stopDetailsModalLabel').text('Detalles de la Parada Nº ' + recorrido.idParada);
    // primer tab del modal
    $("#modal_direcion").text(`${recorrido.direccion}, ${recorrido.codigoPostal} ${recorrido.localidad} Provincia de ${recorrido.provincia}`);
    $("#modal_bultos").text(`${recorrido.cantBultos}`);
    $("#modal_servicio").text(`${recorrido.tipodeServicio}`);
     
    $("#modal_destinatario").text(`${recorrido.destinatario}`); 
    $("#modal_observaciones").text(`${recorrido.observacion}`);

    $("#modal_LECTURA_DNI").text(`${recorrido.lecturadeDNI==''?'NO':recorrido.lecturadeDNI}`);
    $("#modal_Receptor").text(`${recorrido.Receptor}`);
    $("#modal_vinculo").text(`${recorrido.vinculo}`);
      

    $("#modal_motivo").text(`${recorrido.motivo}`);
    $("#modal_Submotivo").text(`${recorrido.Submotivo}`);
    $("#modal_Geo").text(`${recorrido.geolocalizaionCorrecta}`); 
    $("#modal_DNI").text(`${recorrido.documento}`);

    $("#modal_AvisoEnCamino").text(`${recorrido.AvisoEnCamino==''?'NO':recorrido.AvisoEnCamino}`);
     
    $("#modal_ComentarioAlChofer").text(`${recorrido.ComentarioAlChofer}`);

    $('#parada-modal-body').attr('data-clave', recorrido.clave);

    $('#horario-gestion').text(`${recorrido.horaDeGestion}`);

    if (recorrido.reasonCode) {
        
            $('#fotos_digitales').show();
            $("#fotos_digitales").css("display", "flex");

            $('#fotos-dni-dorso').show();
            $('#fotos-dni-frente').show();
            $('#fotos-firma').show();

            $('#download-constancia-btn').show();
        
    }
    else {
        $('#fotos_digitales').hide();
        $("#fotos_digitales").css("display", "none");
        $('#fotos-dni-dorso').hide();
        $('#fotos-dni-frente').hide();
        $('#fotos-firma').hide();

        $('#download-constancia-btn').hide();
    }
 
    // Marcador planificado
    modalMarker.push( new google.maps.Marker({
        position: recorrido.position,
        map: map_modal,
        title: 'Parada planificada',
        icon: {
            url: recorrido.imagenMarcador,
            scaledSize: new google.maps.Size(40, 40)
        }
    } )  ); 

    // Marcador real (si existe)
    if (isValidCoord(recorrido.positionReal) && recorrido.positionReal) {
        let svgURL = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker('R', colorOCASA.rojo));

        $("#modal-ruta-real").text(`${recorrido.positionReal.lat}, ${recorrido.positionReal.lng}`);


         
        modalMarker.push(new google.maps.Marker({
            position: recorrido.positionReal,
            map: map_modal,
            title: 'Parada real',
            icon: {
                url: svgURL,
                scaledSize: new google.maps.Size(40, 40)
            }
        }));
        

    }
    else {

        $("#modal-ruta-real").text(` No disponible `);

    }
    // --- Centrado dinámico ---
    let bounds = new google.maps.LatLngBounds();
    modalMarker.forEach(marker => bounds.extend(marker.getPosition()));

    if (modalMarker.length === 1) {
        // Una sola parada → zoom fijo
        map_modal.setCenter(modalMarker[0].getPosition());
        map_modal.setZoom(16);

    } else if (modalMarker.length === 2) {
        // Dos paradas → calculamos distancia
        let p1 = modalMarker[0].getPosition().toJSON();
        let p2 = modalMarker[1].getPosition().toJSON();
        let distKm = getDistanceKm(p1, p2);

        // FitBounds para asegurar que ambas entren
        map_modal.fitBounds(bounds);

        google.maps.event.addListenerOnce(map_modal, "bounds_changed", function () {
            let zoom = getZoomForDistance(distKm);
            map_modal.setZoom(zoom);
        });

    } else if (modalMarker.length > 2) {
        // Más de 2 → fitBounds normal
        map_modal.fitBounds(bounds);

        google.maps.event.addListenerOnce(map_modal, "bounds_changed", function () {
            if (map_modal.getZoom() > 15) map_modal.setZoom(15);
        });
    }

    // --- Forzamos redibujado del mapa (importante en modals) ---
    setTimeout(() => {
        google.maps.event.trigger(map_modal, "resize");

        if (modalMarker.length === 1) {
            map_modal.setCenter(modalMarker[0].getPosition());
        } else if (modalMarker.length > 1) {
            map_modal.fitBounds(bounds);
        }
    }, 300);

    
    //if (['Z4', 'Z1', 'RE'].includes(recorrido.reasonCode)) {
        // Cargar fotos
    //$('#DigitalPhotoSector').css('visibility', 'visible');        
        showPhotoDetail(clave)
    //} else {
    //    $('#DigitalPhotoSector').css('visibility', 'hidden');
    //}
    
}

async function showPhotoDetail(clave) {
    let result = "";

    $('#fotos_digitales').empty();
    $('#fotos_digitales').append('<div id="spinnerCargarImagenesDetalle">cargando imágenes <i class="fas fa-spinner fa-spin"></i></div>');


    // Lógica para cargar las fotos
    $.ajax({
        url: '/api/Recorrido/GetDigitalPhoto',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ ClaveMovilNovedad: clave }),
        dataType: 'json',
        success: function (response) {

            $('#fotos_digitales').empty();
            let tipoFormateado = '';
            let imgId = '';
            let divId = '';
            let textoAlternativoFoto = '';
            let nombreArchivo = '';
            if (response.fotos && response.fotos.length > 0) {
                response.fotos.forEach(function (_foto) {

                    tipoFormateado = _foto.tipo.toString().padStart(3, '0');
                    textoAlternativoFoto = _foto.tipo.toString() === "2" ? "Firma" : `Foto Nº ${tipoFormateado}`;
                    nombreArchivo = _foto.tipo.toString() === "2" ? "Firma" : _foto.nombre;

                    imgId = `Foto_${tipoFormateado}`;
                    divId = `fotos-${tipoFormateado}`;
                   

                    const fotoHtml = `
                        <div id="${divId}" class="text-center">
                            <img id="${imgId}" alt="Imagen" style="width:120px; height:120px; cursor: pointer; border-radius: 4px; transition: transform 0.2s;" title="Click para ampliar">
                            <div class="small">${nombreArchivo}</div>
                        </div>
                    `;
                    $('#fotos_digitales').append(fotoHtml);

                    setBase64Image(imgId, _foto.foto.file);

                    // EVENTO CLICK PARA MODAL DE FOTO AMPLIADA
                    $(`#${imgId}`).on('click', function () {
                        $('#imgAmpliada').attr('src', $(this).attr('src'));
                        $('#modalFotoLabel').text(nombreArchivo);
                        new bootstrap.Modal(document.getElementById('modalFotoAmpliada')).show();
                    });
                });
            } else {
                $('#fotos_digitales').html('<div id="spinnerCargarImagenesDetalle">No se han encontrado imágenes</i></div>');
            }

        },
        error: function (xhr, status, error) {
            console.error('Error en la llamada AJAX:', status, error);
            $('#fotos_digitales').html('<div id="spinnerCargarImagenesDetalle">Problemas en las imágenes</i></div>');
        }
        
        
    });

}

function setBase64Image(imgId, base64Data) {
    const $img = $(`#${imgId}`);

    // Verificar si es base64 válido
    if (base64Data && base64Data.indexOf('data:image') === 0) {
        $img.attr('src', base64Data);
    } else if (base64Data) {
        $img.attr('src', 'data:image/jpeg;base64,' + base64Data);
    } else {
        $img.attr('src', 'https://placehold.co/93x87'); // Fallback
    }
}

function clearModalMarkers() {
    if (modalMarker.length > 0) { 
        modalMarker.forEach(marker => {
            marker.setMap(null);
        });

        modalMarker.length = 0;
    }
}

function getDistanceKm(coord1, coord2) {
    const R = 6371; // radio de la Tierra en km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distancia en km
}

function getZoomForDistance(km) {
    if (km < 0.5) return 18;   
    if (km < 2) return 17;     
    if (km < 5) return 16;     
    if (km < 20) return 15;   
    if (km < 50) return 14;   
    if (km < 100) return 13;   
    return 12;                 
}
 
async function getBultParadaMaciva(recorrido, parada) {

    let result = "";

    //Objeto con los filtros que vas a enviar
    var filtros = {
        recorrido: recorrido,
        Idparada:  parada 
    };

    $.ajax({
        url: '/api/Recorrido/GetParadasDetallesTables',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filtros),
        dataType: 'json',
        success: function (response) {
            // {"numeroItem":1,"idsistemapropio":"7WOXVVJ4"}

            var lista_piezas = [];
            
            var piezas_text = '';
            response.data.forEach(function (ruta) {

                var pieza = {
                    idsistemapropio: ruta.idsistemapropio,
                    clave: ruta.clave
                };

                //if (ruta.numeroItem > 1) {
                //    result = result + ', ' + JSON.stringify(ruta.idsistemapropio);
                //} else {
                //    result =  JSON.stringify(ruta.idsistemapropio);
                //}
                piezas_text += pieza.idsistemapropio.replace('"', '') + (ruta.length > 1 ? ' - ' : ' ');
                lista_piezas.push(pieza);
            });
            //result.replace('"','');

            //console.log(result);
            if (lista_piezas.length > 1)
                showPhotoDetail(lista_piezas[0].clave);
            
            $("#modal_Piezas").text(`${piezas_text}`);

            return lista_piezas;

        }  
    });
 
}
 
 








