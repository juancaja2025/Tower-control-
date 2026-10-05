let lista = [];
let lista_recorridos = [];
let lista_recorridos_livetracking = [];

let Marcadores_GoogleGEO_por_centro = [];
let Marcadores_GoogleGEO_por_chofer = [];
let Marcadores_GoogleGEO_sucursales = [];


let ListaPosicion_GEO_por_centro = [];
let ListaPosicion_GEO_por_chofer = [];
let ListaPosicion_GEO_sucursales = [];

let ListaParadas_GEO_Planificada = [];
let Id_GEO_Centro_Seleccionado;

let routeRenderers = [];
let routeMarkers = [];

let routeData = [];
let routeCounter = 0;

let IdRoutePlanned = 0;
let IdRouteReal = 0;

let ListToCleanRoutePlanned = [];
let ListToCleanRouteReal = [];
let trackingHistoricoRequest = null;

let Id_refreshRouteInterval = 0;
let refreshRouteInterval = 120 * 1000;

let Id_refreshGeoTransportInterval = 0;
let refreshGeoTransportInterval = 60 * 1000

let fragmentMarkers = [];

let lista_de_paradas = [];

let $input = $('#parada-autocomplete');
let $hidden = $('#parada');
let $list = $('#parada-list');

function ObtenerFechaPlanificadaISO(fechaRaw) {
    if (fechaRaw === undefined || fechaRaw === null) return '';

    const fecha = String(fechaRaw).trim();
    if (fecha === '') return '';

    if (fecha.includes('T') && fecha.length >= 10) {
        return fecha.substring(0, 10);
    }

    if (fecha.includes('/')) {
        return CambiarFormatoFecha(fecha, '/', 'YYYY-MM-DD') || '';
    }

    if (fecha.includes('-')) {
        const partes = fecha.split('-');
        if (partes.length === 3) {
            if (partes[0].length === 4) {
                return `${partes[0]}-${partes[1].toString().padStart(2, '0')}-${partes[2].toString().padStart(2, '0')}`;
            }

            return `${partes[2]}-${partes[1].toString().padStart(2, '0')}-${partes[0].toString().padStart(2, '0')}`;
        }
    }

    return '';
}

function getRutaValue(ruta, keys, defaultValue = '') {
    for (const key of keys) {
        if (ruta[key] !== undefined && ruta[key] !== null && ruta[key] !== '') {
            return ruta[key];
        }
    }

    return defaultValue;
}

$(function () {

    InitializeControls();

});

function InitializeControls() {


    let focusedIndex = -1;

    var redirect = 1;

    if (perfilUsuario !== undefined && perfilUsuario !== null && perfilUsuario !== '') {
        var perfil = JSON.parse(perfilUsuario);

        perfil.Permisos.forEach(function (permiso) {
            if (permiso.IdPermiso === "RECORRIDO") { redirect = 0; }
        });

    }
    if (redirect === 1) {
        window.location.href = '/Home';
    }


    $('#title-page').html("Historicos");
    $('#menu_Recorrido').addClass("active");

    ActivarLiveControls(false);

    cargarCentros('cmbCentroRecorridos', login_usuario, false);

    // Evento para mostrar el pin del centro cuando se selecciona en el desplegable
    $(document).on('change', '#cmbCentro', function () {
        var centro_seleccionado = $(this).find('option:selected');
        var latitud = centro_seleccionado.data('latitud');
        var longitud = centro_seleccionado.data('longitud');
        
        if (latitud !== undefined && latitud !== '' && longitud !== undefined && longitud !== '') {
            Id_GEO_Centro_Seleccionado = {
                idParada: 0,
                position: {
                    lat: latitud,
                    lng: longitud
                }
            };
            
            addWarehouseMarker(latitud, longitud, centro_seleccionado.text());
        }
    });

    $('#download-constancia-btn').on('click', function () {

        var clave = $('#parada-modal-body').attr('data-clave');

        if (clave !== undefined && clave !== '') {
            let mensaje = '';
            showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Descargando constancia digital, aguarde un momento'), 2);
            DownloadConstanciaDigital(clave);

        }
    })

    $('#btnBuscarRecorridoHistorico').on('click', function () {
        BuscarRecorridosHistorico();
    });

    $('#routeSearchInput').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            BuscarRecorridosHistorico();
        }
    });
    $('#detailsSearchInput').on('input', function () {
        filterParadasCards();
    });

    ActivateMenu('Menu_RecorridoHistoricos');




    $('#texto_mensaje').on('input', function () {
        let count = 200 - $(this).val().length;
        $('#mensaje-counter').text(count);

        if ($(this).val().length > 200) {
            $(this).val($(this).val().substring(0, 200));
            count = 0;
            $('#mensaje-counter').text(count);
        }
    });
    $('#saveMessage_to_Driver').on('click', function () {

        const btn = $(this);

        if (btn.prop('disabled')) return; 

        btn.prop('disabled', true);

        saveMessageToDriver(btn);
    });

    $('#tab-history').on('click', function () {

        getMessagesToDriver();
    });


    $('#swTrazaRecorridoReal').on('change', function () {
        if ($(this).prop('checked')) {

            const selectedCard = $('.route-card.selected');
            const recorrido = Number(selectedCard.data('recorrido') || 0);

            if (recorrido <= 0) {
                showPopupTimer('popup_timer', 'Seleccione un recorrido para trazar el recorrido real', 4);
                $(this).prop('checked', false);
                return;
            }

            ShowRouteTransportHistorico(recorrido, 'swTrazaRecorridoReal');


        } else {
            ClearRouteMapById(ListToCleanRouteReal);
        }
    });

    $('#swTrazaRecorridoPlanificado').on('change', function () {
        if ($(this).prop('checked')) {

            ListaParadas_GEO_Planificada.push(Id_GEO_Centro_Seleccionado);
            IdRoutePlanned = DrawUnlimitedRouteMap(ListaParadas_GEO_Planificada, '#ff0000', '', 'swTrazaRecorridoPlanificado', false);
            ListToCleanRoutePlanned.push(IdRoutePlanned);

        } else {

            ClearRouteMapById(ListToCleanRoutePlanned);
        }
    });



    $input.on('input', function () {
        const q = $(this).val().toLowerCase();
        if (!q) {
            $list.addClass('d-none');
            $hidden.val('');
            focusedIndex = -1;
            return;
        }
        const filtradas = lista_de_paradas.filter(p =>
            p.texto.toLowerCase().includes(q)
        );
        renderList(filtradas);
    });

    $input.on('keydown', function (e) {
        if ($list.hasClass('d-none')) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                moveFocus(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                moveFocus(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0) {
                    const $focused = $list.find('.parada-item').eq(focusedIndex);
                    const item = { id: $focused.data('id'), texto: $focused.text() };
                    selectItem(item);
                }
                break;
            case 'Escape':
                e.preventDefault();
                $list.addClass('d-none');
                focusedIndex = -1;
                break;
        }
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#parada-autocomplete, #parada-list').length) {
            $list.addClass('d-none');
            focusedIndex = -1;
        }
    });

    $input.on('focus', function () {
        const q = $(this).val().toLowerCase();
        if (q) {
            const filtradas = lista_de_paradas.filter(p =>
                p.texto.toLowerCase().includes(q)
            );
            if (filtradas.length > 0) {
                renderList(filtradas);
            }
        }
    });

    $(document).on("click", "#btn_notificaciones", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const recorrido = $(this).data("recorrido");
        $('#recorrido-id').html(recorrido.recorrido);
        $('#ruta-id').html(recorrido.ruta);
        $('#msj_nombre_chofer').text(recorrido.nom_Transportis);
        $('#msj_id_chofer').text(recorrido.chofer);
        $("#mensajes-container").html('<span>0 mensajes</span>');

        getMessagesToDriver();


        $('#driver-message-modal').modal('show');

        CargarDatosDeParadas(recorrido.recorrido);

        return false;
    });

    $(document).on("click", "#btn_chat", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const recorrido = $(this).data("recorrido");
        alert('A chatear se ha dicho');
        return false;
    });
}

function BuscarRecorridosHistorico() {
    let centro = $('#cmbCentro').val();

    if (centro === undefined || centro === '' || centro === null) {
        showPopupTimer('popup_timer', 'Seleccione un centro para buscar', 3);
        return;
    }

    CargaRecorridos('', centro);
}

function renderList(items) {

    $list.empty().removeClass('d-none');
    if (!items.length) {
        $list.addClass('d-none');
        return;
    }

    items.forEach((item, index) => {
        const $li = $('<li>')
            .addClass('list-group-item parada-item')
            .text(item.texto)
            .data('id', item.id)
            .attr('tabindex', '0')
            .on('click', function () {
                selectItem(item);
            })
            .on('mouseenter', function () {
                $list.find('.parada-item').removeClass('focused');
                $(this).addClass('focused');
                focusedIndex = index;
            });
        $list.append($li);
    });

    $list.removeClass('d-none');
    $list[0].offsetHeight;
    focusedIndex = -1;
}

function selectItem(item) {
    $input.val(item.texto);
    $hidden.val(item.id);
    $list.addClass('d-none');
    $input.focus();
    focusedIndex = -1;


}

function moveFocus(direction) {
    const $items = $list.find('.parada-item');
    if ($items.length === 0) return;

    focusedIndex = Math.max(-1, Math.min($items.length - 1, focusedIndex + direction));

    $items.removeClass('focused');
    $items.attr('tabindex', '-1');

    if (focusedIndex >= 0) {
        const $focusedItem = $items.eq(focusedIndex);
        $focusedItem.addClass('focused').attr('tabindex', '0').focus();

        const listHeight = $list[0].clientHeight;
        const itemTop = $focusedItem[0].offsetTop;
        const itemHeight = $focusedItem[0].clientHeight;
        const scrollTop = $list.scrollTop();

        if (itemTop < scrollTop) {
            $list.scrollTop(itemTop);
        } else if (itemTop + itemHeight > scrollTop + listHeight) {
            $list.scrollTop(itemTop + itemHeight - listHeight);
        }
    }
}


function ActivarLiveControls(active) {
    if (active == true) {
        $('#liveTrackingMessage').css('visibility', 'visible');
        $('#form-check-recorrido-real').css('visibility', 'visible');
        $('#form-check-recorrido-planificado').css('visibility', 'visible');

    } else {
        $('#liveTrackingMessage').css('visibility', 'hidden');
        $('#form-check-recorrido-real').css('visibility', 'hidden');
        $('#form-check-recorrido-planificado').css('visibility', 'hidden');

        $('#swTrazaRecorridoPlanificado').prop('checked', false);
        $('#swTrazaRecorridoReal').prop('checked', false);

    }
}

function RefreshRoute() {
    var center = $('#cmbCentro').val();
    if (center !== undefined)
        if (center !== '' && center !== null) {
            showPopupTimer('popup_timer', 'Recargando recorridos', 3);
            CargaRecorridos('', center);
        }
}

function RefreshGEOTransport() {
    if (ListaPosicion_GEO_por_centro.length > 0) {
        ;
    }
}

function DownloadConstanciaDigital(clave) {


    let request = {
        ClaveMovilNovedad: clave
    }

    $.ajax({
        url: '/api/Recorrido/GetConstanciaDigital',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (data) {

            if (data != "") {

                let exists = Object.keys(data).includes('statusCode');
                if (!exists) {

                    if (data.file != null)
                        DownloadPDF(data.id, data.file);
                    else
                        showPopupTimer('popup_timer', 'No se ha encontrado una constancia para esta parada', 5);

                } else {
                    let mensaje = 'Se produjo un error al descargar la constancia digital';
                    showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);
                }
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);
        }
    });
}

function GetNovedad() {
    var clave = $('#parada-modal-body').attr('data-clave');
    if (clave === undefined || clave === '') return;

    let request = {
        ClaveMovilNovedad: clave
    }


    $.ajax({
        url: '/api/Recorrido/GetNovedad',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (data) {

            if (data != "") {

                let exists = Object.keys(data).includes('statusCode');
                if (!exists) {

                    if (data != null) {

                        let listacomprobantes = [];
                        if (data.comprobantes !== undefined) {
                            data.forEach(function (comprobantes, index) {

                                listacomprobantes.push(comprobantes[index])
                                index++;
                            });
                        }

                        let novedad = {
                            idNovedad: 21442660,
                            idCliente: "0102004906",
                            recorrido: "9740526",
                            ap: null,
                            alternativoCliente: "0012527278",
                            codigoEcommerce: null,
                            codigoSolicitudSAP: "",
                            codigoEquipoSAP: "000000000002531161",
                            tipoServicio: null,
                            fechaHoraNovedad: "2025-10-27T13:03:03",
                            fechaNovedadSapFormat: "2025/10/27",
                            horaNovedadSapFormat: "13:03:03",
                            estado: "POD",
                            motivo: "Z4",
                            generarConstanciaDigital: true,
                            detalle: {
                                nombreCliente: "REGISTRO NACIONAL DE LAS PERSO",
                                nombreDestinatario: "RC CD CBA VILLA RUMIPAL",
                                direccion: "AV RIEMANN N 326 0",
                                localidad: "CORDOBA",
                                cp: "5864",
                                receptor: "ROMINA PISANI",
                                dni: "28734270",
                                vinculo: "",
                                validacion_QR_DNI: "",
                                paradaCertificadaIncorrecta: null,
                                coordenadaLatitudPlanificada: "-31.4195661",
                                coordenadaLongitudPlanificada: "-64.1660908",
                                coordenadaLatitudNovedad: "-32.1893324",
                                coordenadaLongitudNovedad: "-64.4714997",
                                coordenadaPrecisionNovedad: "3.79"
                            },
                            comprobantes: listacomprobantes
                        }
                    }

                } else {
                    let mensaje = 'Se produjo un error al descargar la constancia digital';
                    showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);
                }
            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);
        }
    });
}

async function CargaRecorridos(fecha, centro) {

    var today = new Date();
    let yyyy = today.getFullYear();
    let MM = today.getMonth() + 1;
    let dd = today.getDate();
    let hh = today.getHours();
    let mm = today.getMinutes();
    let ss = today.getSeconds();

    let formattedDate = yyyy + '/' + MM + '/' + dd;

    var contenido = $('#cards-section').html();
    $('#cards-section').empty();
    $('#cards-section').append(`<div id="spinnerCargarRutas">cargando recorridos <i class="fas fa-spinner fa-spin"></i></div>`);

    if (fecha === undefined || fecha === '') fecha = formattedDate

    var centro_seleccionado = $('#cmbCentro').find('option:selected');
    var latitud = centro_seleccionado.data('latitud');
    var longitud = centro_seleccionado.data('longitud');
    if (latitud !== undefined && latitud !== '' && longitud !== undefined && longitud !== '') {

        Id_GEO_Centro_Seleccionado = {
            idParada: 0,
            position: {
                lat: latitud,
                lng: longitud
            }
        }

        addWarehouseMarker(latitud, longitud, centro_seleccionado.text());

    }

    lista_recorridos = [];
    lista_recorridos_livetracking = [];


    const recorridoBuscado = parseInt(($.trim($('#routeSearchInput').val()) || '0'), 10);
    var filtros = {
        Centro: centro,
        Recorrido: isNaN(recorridoBuscado) ? 0 : recorridoBuscado
    };


    $.ajax({
        url: '/api/RecorridoHistorico/ObtenerRecorridoHistorico',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filtros),
        dataType: 'json',
        success: function (response) {

            const recorridosData = Array.isArray(response?.data)
                ? response.data
                : (Array.isArray(response)
                    ? response
                    : (response && Object.keys(response).length > 0 ? [response] : []));


            $('#cards-section').empty();
            let efectividadIcon = '';
            let efectividadIconColor = '';

            if (recorridosData.length == 0) {

                $('#cards-section').append("<span class='col-12 text-center'>Sin recorridos</span>");

            } else {

                lista_recorridos = recorridosData;
                lista_recorridos_livetracking = recorridosData.filter(ruta => Number(ruta.liveTracking) === 1);

                let efectividadBackColor = colorOCASA.verdeClaro;
                let efectividadTextColor = colorOCASA.verde;

                recorridosData.forEach(function (ruta, index) {

                    index++;
                    let latitud = parseFloat(ruta.sistema_1);
                    let longitud = parseFloat(ruta.sistema_2);



                    estadoColor = colorOCASA.calipso;
                    estadoColor2 = colorOCASA.calipsoClaro;
                    estadoDescripcion = 'En curso';



                    switch (ruta.porcentaje) {
                        case 100:
                            estadoColor = colorOCASA.verde;
                            estadoColor2 = colorOCASA.verdeClaro;
                            estadoDescripcion = 'Finalizado';
                            break;

                        default:
                            estadoColor = colorOCASA.calipso;
                            estadoColor2 = colorOCASA.calipsoClaro;
                            estadoDescripcion = 'En curso';

                            break;
                    }
                    if (ruta.efectividad >= 95) {
                        efectividadBackColor = colorOCASA.verdeClaro;
                        efectividadTextColor = colorOCASA.verde;

                        efectividadIcon = 'fa-circle-check';
                    }

                    if (ruta.efectividad >= 90 && ruta.efectividad < 95) {
                        efectividadBackColor = colorOCASA.naranjaClaro;
                        efectividadTextColor = colorOCASA.naranja;

                        efectividadIcon = 'fa-clock';
                    }

                    if (ruta.efectividad < 90) {
                        efectividadBackColor = colorOCASA.rojoClaro;
                        efectividadTextColor = colorOCASA.rojo;

                        efectividadIcon = 'fa-circle-xmark';
                    }

                    const kmFin = getRutaValue(ruta, ['km_Fin', 'Km_Fin', 'kmFin', 'KmFin'], 0);
                    const dateSysInicio = getRutaValue(ruta, ['dateSys_Inicio', 'DateSys_Inicio', 'dateSysInicio', 'DateSysInicio'], '');
                    const dateSysFin = getRutaValue(ruta, ['dateSys_Fin', 'DateSys_Fin', 'dateSysFin', 'DateSysFin'], '');

                    var card = `<div id="" class="card route-card w-90" data-route="${ruta.ruta}" data-recorrido="${ruta.recorrido}" data-chofer="${ruta.nom_Transportis}" data-livetracking="${ruta.liveTracking}" data-IdChofer="${ruta.chofer}" data-fecha-planif="${ruta.fecha_Planif}">

                                    <!-- Encabezado  -->
	                                <div class="d-flex justify-content-between align-items-center">
		                                <div>
			                                <!-- Títulos del Recorrido -->
			                                <div class="recorrido-title">Recorrido: ${ruta.recorrido}</div>
			                                <div class="recorrido-subtitle">Ruta: ${ruta.ruta}</div>
		                                </div>
		
		                                <!-- Badge de Efectividad -->
		                      
                                        <div class="p-2 text-center rounded-3 fw-bold status-badge"
                                            style="background-color: ${efectividadBackColor} !important; color: ${efectividadTextColor} !important;"> 
                                            <div class="text-uppercase d-flex align-items-center justify-content-center gap-2">
                                                    EFECTIVIDAD 
                                                <i class="fa-solid ${efectividadIcon} ${efectividadIconColor}"></i>
                                            </div>
                                            <div class="fs-6">
                                                %&nbsp; ${ruta.efectividad}
                                            </div>
                                        </div>
	                                </div>


                                    <!-- LÍNEA SEPARADORA -->
	                                <hr class="my-1">

                                    <!-- Sección de Información en Grilla de 2 Columnas -->
	                                <div class="row g-1 small"> 
		
		                                <!-- Transportista  -->
		                                <div class="col-12 mb-1"> 
			                                <span class="info-value">
				                                <span class="info-label text-muted small">Transportista:</span> 
				                                <span class"small fw-bold">${ruta.nom_Transportis} - ${ruta.chofer}</span>
			                                </span>
		                                </div>
		
		                                <!-- Información en dos columnas  -->
		                                <div class="col-6">			                               
				                             <span class="info-label text-muted small">Centro:</span> 
                                             <span class"small fw-bold">${ruta.sucursal}</span>			                                
		                                </div>
		                                <div class="col-6">
			                                <span class="info-label text-muted small">Fecha:</span>
                                            <span class"small fw-bold">${CambiarFormatoDDMMYYYY(ruta.fecha_Planif)}</span>			                                
		                                </div>
		                                <div class="col-6">
                                            <span class="info-label text-muted small">Vehículo:</span>
                                            <span class"small fw-bold">${ruta.desc_Tractor}</span>	
		                                </div>
		                                <div class="col-6">
                                            <span class="info-label text-muted small">Dominio:</span>
                                            <span class"small fw-bold">${ruta.unidad}</span>	

		                                </div>
                                      <div class="col-6">
                                            <img src="/img/route.png" alt="Ruta" style="width: 18px; height: 18px; object-fit: contain;">
                                            <span class="small fw-bold">&nbsp;${formatKmValue(kmFin)}</span>
                                            <span class="info-label text-muted small">&nbsp;Km recorridos</span>                                                
		                                </div>
	                                </div>

                                    
                                    <div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <small class="text-muted">Progreso</small>
                                            <small class="text-muted">${ruta.porcentaje}%</small>
                                        </div>
                                        <div class="progress-container">
                                            <div class="progress-bar" style="width: ${ruta.porcentaje}%;"></div>
                                        </div>
                                    </div>

                                    <!-- LÍNEA SEPARADORA para Live Tracking -->
	                                <hr class="my-1">
 <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex flex-column justify-content-between align-items-flex-start">
                                            <small class="text-muted">Hora de inicio</small>
                                            <small class="fw-bold">${formatHourMinute(dateSysInicio)}</small>
                                        </div>
                                        <div class="d-flex flex-column justify-content-between align-items-flex-end">
                                            <small class="text-muted">Hora de cierre</small>
                                            <small class="fw-bold" style="text-align: right;">${formatHourMinute(dateSysFin)}</small>
                                        </div>
                                        </div>
	                                <!-- Sección de Live Tracking con Iconos de Acción -->
	
	                                <div class="geolocation-section d-flex align-items-center"> <!-- d-none -->`;

                    if (Number(ruta.liveTracking) === 1) {
                        card += `            <div class="d-flex align-items-center gap-2" id="live-tracking-trigger"
                                            data-recorrido="${ruta.recorrido}">
			                                <!-- Icono de Geolocalización (Live tracking) -->
			                                <i class="bi bi-geo-alt-fill fs-5 text-success"></i>
			                                <small class="small fw-medium text-dark">
				                                Live tracking ACTIVADA
			                                </small>
		                                </div>`;

                    }

                    card += `           <!-- Grupo de Iconos de Acción (Notificación y Chat) -->
		                                <div class="d-flex gap-1 ms-auto">
			                           
			                                <button type="button" class="btn btn-icon-footer p-1 d-none" id="btn_chat" title="Notificaciones"
                                            data-recorrido='${JSON.stringify(ruta)}'>
				                                <i class="bi bi-bell fs-5"></i>
			                                </button>
		                                </div>
	                                </div>
	                                <!-- FIN: Sección de Live Tracking -->
                                </div>`;
                    $('#cards-section').append(card);

                });

                let fecha_planificada = CambiarFormatoFecha(fecha, '/', 'YYYY-MM-DD')
                ShowLiveTransports(centro, fecha_planificada, '');

                addEventRecorridosClick(centro, fecha_planificada);
            }
            $('#spinnerCargarRutas').remove();
        },
        error: function (xhr, status, error) {
            console.error('Error en la llamada AJAX:', status, error);
            $('#spinnerCargarRutas').remove();
        }
    });
}

function filtrarRecorridos(filtro) {

    var Mensaje = `
        <div id="no-results-alert" class="alert alert-warning text-center mt-3" role="alert">
            <span class="material-symbols-outlined align-middle me-1">warning</span>
            No existe recorrido que coincida con la búsqueda.
        </div>`;

    let searchText = filtro.toLowerCase().trim();
    let encontrados = 0;

    $('.route-card').each(function () {
        let route = $(this).data('route').toString().toLowerCase();
        let recorrido = $(this).data('recorrido').toString().toLowerCase();
        let chofer = $(this).data('chofer').toString().toLowerCase();



        if (route.includes(searchText) || recorrido.includes(searchText) || chofer.includes(searchText)) {
            $(this).show();
            encontrados++;
        } else {
            $(this).hide();
        }
    });

    $('#no-results-alert').remove();

    if (encontrados === 0) {
        $('#cards-section').append(Mensaje);
    }


}

function CargarDatosDeParadas(recorrido) {

    var filtros = {
        Centro: $('#cmbCentro').val(),
        Recorrido: recorrido
    };
    var data_parada;

    try {

        $.ajax({
            url: '/api/RecorridoHistorico/ObtenerParadasHistorico',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(filtros),
            dataType: 'json',
            success: function (response) {
                lista_de_paradas = [];
                const paradasData = Array.isArray(response?.data)
                    ? response.data
                    : (Array.isArray(response) ? response : []);

                paradasData.forEach(function (parada) {
                    data_parada = {
                        id: parada.idParada,
                        texto: 'Parada [' + parada.idParada + '] ' + parada.direccion.substring(0, 50)
                    }
                    lista_de_paradas.push(data_parada);

                });

            },
            error: function (xhr, status, error) {
                console.error('Error en la llamada AJAX:', status, error);
                $('#spinnerCargarRutas').remove();
            }

        });


    } catch (e) {

    }
}


function addEventRecorridosClick(centro, fecha_planificada) {

    $(".route-card").on("click", function (e) {



        if (
            $(e.target).closest('#btn_notificaciones, #btn_chat').length
        ) {
            return;
        }

        let chofer = $(this).data("idchofer");
        let valor = $(this).data("recorrido");
        let livetracking = $(this).data("livetracking");
        let fecha_planificada_recorrido = ObtenerFechaPlanificadaISO($(this).data('fechaplanif'));

        $('#tituloMapaRecorridos').html(
            `Detalles del recorrido <span class="recorrido-id">${valor}</span>`
        );
        $('#idChoferSeleccionado').text(chofer);

        $(".route-card").removeClass("selected");

        $(this).addClass("selected");

        $("#lists-panel").addClass("details-active");
        $("#map-section").addClass("details-active");

        if (Number(livetracking) === 1) {

            ShowLiveTransports(centro, (fecha_planificada_recorrido || fecha_planificada), chofer);
            ActivarLiveControls(true);

        } else {
            ClearGeoTransports();
            ActivarLiveControls(false);

        }
        ClearRouteMapById(IdRoutePlanned);
        ClearRouteMapById(IdRouteReal);

        mostrarParadas(valor);
    });

    $("#close-details-btn").on("click", function () {

        const selectedCard = $('.route-card.selected');
        const fecha_planificada_recorrido = ObtenerFechaPlanificadaISO(selectedCard.data('fechaplanif'));

        ActivarLiveControls(false);
        clearMarkers();
        ClearRouteMapById(IdRoutePlanned);
        $("#lists-panel").removeClass("details-active");
        $("#map-section").removeClass("details-active");
        $(".route-card").removeClass("selected");

        $('#section-search-recorridos').show();

        centro = $('#cmbCentro').val();
        ShowLiveTransports(centro, (fecha_planificada_recorrido || fecha_planificada), '');
    });

}

function DownloadPDF(ID, fileBase64) {

    let nombreArchivo = 'Constancia_Digital_' + ID + '_';
    let data = '';
    var today = new Date();
    let yyyy = today.getFullYear();
    let MM = today.getMonth() + 1;
    let dd = today.getDate();
    let hh = today.getHours();
    let mm = today.getMinutes();
    let ss = today.getSeconds();

    let formattedDate = yyyy + '' + MM + dd + hh + mm + ss;



    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const blob = new Blob([byteArray], { type: 'application/pdf' });

    invokeSaveAsDialog(blob, nombreArchivo + formattedDate + '.pdf' || "archivo.pdf");

}

function saveMessageToDriver(btn) {

    let id_chofer = $('#msj_id_chofer').text();
    let nro_recorrido = $('#recorrido-id').text();
    let id_parada = $('#parada').val();
    let subjet = $('#texto_asunto').val();
    let text_message = $('#texto_mensaje').val();

    let id_usuario = login_usuario;

    if (id_chofer === undefined || id_chofer === '') { showPopupTimer('popup_timer', 'No fue identificado el chofer para este mensaje, cierre y vuelva a abrir el formulario', 3); return; }
    if (nro_recorrido === undefined || nro_recorrido === '') { showPopupTimer('popup_timer', 'El recorrido no fue identificado, cierre y vuelva a abrir el formulario', 3); return; }
    if (id_parada === undefined || id_parada === '') { showPopupTimer('popup_timer', 'Seleccione una parada del la lista para enviar el mensaje', 3); return; }
    if (subjet === undefined || subjet === '') { showPopupTimer('popup_timer', 'Indique al menos un asunto para el mensaje', 3); return; }
    if (text_message === undefined || text_message === '') { showPopupTimer('popup_timer', 'Escriba un texto para enviar a esta parada', 3); return; }


    let request = {
        idUsuario: id_usuario,
        recorrido: nro_recorrido,
        idparada: id_parada,
        idChofer: id_chofer,
        asunto: subjet,
        mensaje: text_message
    }
    $.ajax({
        url: '/StaticManager/SaveMessageToDriver',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (response) {


            $('#parada').val('');
            $('#texto_asunto').val('');
            $('#texto_mensaje').val('');
            let count = 200 - $('#texto_mensaje').val().length;
            $('#mensaje-counter').text(count);

            showPopupTimer('popup_timer', 'Se ha enviado el mensaje al chofer, esto puede tardar unos segundos.', 3);

        },
        error: function (jqXHR, textStatus, errorThrown) {
            showPopupTimer('popup_timer', 'Se produjo un error al enviar el mensaje', 3);

        },
        complete: function () {
            btn.prop('disabled', false);
        }
    });
}

function getMessagesToDriver() {


    let id_chofer = $('#msj_id_chofer').text();
    let nro_recorrido = $('#recorrido-id').text();
    let id_parada = $('#parada').val();


    let id_usuario = login_usuario;

    if (id_chofer === undefined || id_chofer === '') { showPopupTimer('popup_timer', 'No fue identificado el chofer para este mensaje, cierre y vuelva a abrir el formulario', 3); return; }
    if (nro_recorrido === undefined || nro_recorrido === '') { showPopupTimer('popup_timer', 'El recorrido no fue identificado, cierre y vuelva a abrir el formulario', 3); return; }

    let request = {

        recorrido: nro_recorrido,
        idChofer: id_chofer
    }

    $.ajax({
        url: '/StaticManager/GetMessageToDriver',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (response) {


            $("#mensajes-container").html('<span>0 mensajes</span>');
            let message_data = JSON.parse(response.response);
            if (response.operation && message_data.length > 0) {

                $("#mensajes-container").html('<span class="small text-muted">Se encontraron&nbsp;' + message_data.length + '&nbsp;mensajes</span>');
                message_data.forEach(m => addMessageCard(m));
            }





        },
        error: function (jqXHR, textStatus, errorThrown) {
            showPopupTimer('popup_timer', 'Se produjo un error al descargar la constancia', 3);

        }
    });



}

function formatTime(fechaIso) {
    const d = new Date(fechaIso);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}${ampm}`;
}

// Devuelve hora y minutos (HH:mm) para valores Date/ISO/texto con hora.
function formatHourMinute(value) {
    if (value === undefined || value === null || value === '') return '--:--';

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        if (date.getFullYear() <= 1900) return '--:--';
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    const valueText = String(value);
    const match = valueText.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
    }

    return valueText;
}

function formatKmValue(value) {
    if (value === undefined || value === null || value === '') return '-';

    const number = Number(value);
    if (isNaN(number)) {
        return value;
    }

    return number.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function addMessageCard(msg) {

    const hora = formatTime(msg.Fecha_sys);
    const preview = msg.Asunto;
    const body = msg.Mensaje;

    const cardId = `msg-${msg.Id}`;

    const $card = $(`
        <div class="message-wrapper">
            <div class="message-card d-flex align-items-center" data-target="#body-${cardId}">
                <!-- avatar -->
                <div class="message-avatar me-2 flex-shrink-0">
                    <span class="p-2 rounded-circle" id="span-icon">
                        <i class="bi bi-exclamation-circle-fill fs-4" id="icon"></i>
                    </span>
                </div>

                <!-- texto principal -->
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <div class="message-title">
                            N° de envío: <span class="message-id">${msg.Id}</span>
                        </div>
                        <div class="message-time ms-2">${hora}</div>
                    </div>
                    <div class="message-preview text-truncate">
                        ${preview}
                    </div>
                </div>
            </div>

            <!-- cuerpo desplegable -->
            <div id="body-${cardId}" class="message-body d-none">
                ${body}
            </div>
        </div>
    `);

    $card.find(".message-card").on("click", function () {
        const target = $(this).data("target");
        $(target).toggleClass("d-none");
    });

    $("#mensajes-container").append($card);
}



async function ShowLiveTransports(centro, fecha, chofer) {

    let full_path = 'OcasaLiveTracking/' + fecha + '/' + centro + (chofer !== undefined && chofer !== '' ? '/' + chofer : '');

    const request = {
        path: full_path
    };

    try {

        $.ajax({
            url: '/StaticManager/GetGEOData',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (response) {

                ClearGeoTransports();
                if (response !== undefined) {

                    ListaPosicion_GEO_por_centro = TransformFirebaseDataToGeoList(response, lista_recorridos_livetracking, (chofer == '' ? 2 : 1), chofer);


                    ListaPosicion_GEO_por_centro = CompleteDataRecorrido(ListaPosicion_GEO_por_centro, lista_recorridos_livetracking);
                    if (ListaPosicion_GEO_por_centro.length > 0) {
                        DrawTransports(ListaPosicion_GEO_por_centro);
                        var listado_macadores = [];
                        listado_macadores.push(ListaPosicion_GEO_por_centro);
                        listado_macadores.push(ListaPosicion_GEO_sucursales);

                        centerMapsWithMarkers(listado_macadores);
                    }




                }
                else {
                    
                    showPopupTimer('popup_timer', 'No se encuentran posiciones Geo de transportes', 5);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showPopupTimer('popup_timer', 'Se produjo un error al descargar la constancia', 3);

            }
        });

        return geoData;

    } catch (error) {
        return null;
    }
}

async function ShowRouteTransport(centro, fecha, chofer, idswitch) {
    let full_path = 'OcasaLiveTrackingHistory/' + fecha + '/' + centro + (chofer !== undefined && chofer !== '' ? '/' + chofer : '');

    const request = {
        path: full_path
    };

    try {

        $.ajax({
            url: '/StaticManager/GetGEOData',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (response) {


                if (response !== undefined) {

                    var lista_geo_history = TransformFirebaseHistoryGeo(response);
                    $('#' + idswitch).prop('checked', false);


                    var lista_geo_filtrada = filtrarPuntosPorDistancia(lista_geo_history, 100);


                    IdRouteReal = DrawUnlimitedRouteMap(lista_geo_filtrada, '#0000ff', null, idswitch, false);

                    ListToCleanRouteReal.push(IdRouteReal);

                    $('#' + idswitch).prop('checked', true);

                }
                else {
                    showPopupTimer('popup_timer', 'Este chofer no registra posiciones Geo de recorrido real', 5);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showPopupTimer('popup_timer', 'Se produjo un error al descargar la constancia', 3);

            }
        });

        return geoData;

    } catch (error) {
        return null;
    }

}

function ParseHistoricoTrackingToGeoList(trackingData) {
    if (!Array.isArray(trackingData) || trackingData.length === 0) {
        return [];
    }

    const parseCoordinate = (value) => {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : NaN;
        }

        if (value === null || value === undefined) {
            return NaN;
        }

        const normalized = String(value).trim().replace(',', '.');
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : NaN;
    };

    const ordered = trackingData
        .map((p, index) => {
            const lat = parseCoordinate(p.latitud ?? p.Latitud);
            const lng = parseCoordinate(p.longitud ?? p.Longitud);
            const fechaRaw = p.fecha ?? p.Fecha;
            const horaRaw = p.hora ?? p.Hora;
            const fecha = fechaRaw ? String(fechaRaw).substring(0, 10) : '';
            const hora = horaRaw ? String(horaRaw) : '00:00:00';
            const timestamp = Date.parse(`${fecha}T${hora}`);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return null;
            }

            return {
                lat,
                lng,
                index,
                timestamp: Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER
            };
        })
        .filter(p => p !== null)
        .sort((a, b) => {
            if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
            return a.index - b.index;
        });

    return ordered.map((p, idx) => ({
        idParada: idx + 1,
        position: {
            lat: p.lat,
            lng: p.lng
        }
    }));
}

function ShowRouteTransportHistorico(recorrido, idswitch) {
    const request = {
        Recorrido: Number(recorrido)
    };

    if (trackingHistoricoRequest && trackingHistoricoRequest.readyState !== 4) {
        trackingHistoricoRequest.abort();
        trackingHistoricoRequest = null;
    }

    try {
        trackingHistoricoRequest = $.ajax({
            url: '/api/RecorridoHistorico/ObtenerTrakingHistorico',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (response) {
                const trackingData = Array.isArray(response?.data)
                    ? response.data
                    : (Array.isArray(response) ? response : []);

                const lista_geo_history = ParseHistoricoTrackingToGeoList(trackingData);

                if (!lista_geo_history.length) {
                    $('#' + idswitch).prop('checked', false);
                    showPopupTimer('popup_timer', 'Este recorrido no registra posiciones Geo históricas', 5);
                    return;
                }

                ClearRouteMapById(ListToCleanRouteReal);
                ListToCleanRouteReal = [];

                const lista_geo_filtrada = filtrarPuntosPorDistancia(lista_geo_history, 100);

                IdRouteReal = DrawUnlimitedRouteMap(lista_geo_filtrada, '#0000ff', null, idswitch, false);

                if (IdRouteReal > 0) {
                    ListToCleanRouteReal.push(IdRouteReal);
                    $('#' + idswitch).prop('checked', true);
                } else {
                    $('#' + idswitch).prop('checked', false);
                    showPopupTimer('popup_timer', 'No fue posible trazar el recorrido real histórico', 4);
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                $('#' + idswitch).prop('checked', false);
                console.error('[TrackingHistorico] request error', {
                    status: xhr?.status,
                    textStatus,
                    error: errorThrown,
                    response: xhr?.responseText
                });
                showPopupTimer('popup_timer', 'Se produjo un error al consultar el tracking histórico', 4);
            },
            complete: function () {
                trackingHistoricoRequest = null;
            }
        });
    } catch (error) {
        $('#' + idswitch).prop('checked', false);
        console.error('[TrackingHistorico] exception', error);
        showPopupTimer('popup_timer', 'Se produjo un error al consultar el tracking histórico', 4);
    }
}






function TransformFirebaseDataToGeoList(list_geo_firebase, list, maxNiveles = 2, chofer) {
    const result = [];

    if (maxNiveles >= 1) {
        for (let clave1 in list_geo_firebase) {
            const nivel1 = list_geo_firebase[clave1];

            if (nivel1.lastTracking && nivel1.lastTracking.lat && nivel1.lastTracking.lng) {
                result.push({
                    position: { lat: nivel1.lastTracking.lat, lng: nivel1.lastTracking.lng },
                    chofer: chofer,
                    recorrido: clave1,
                    tipo: '', nombre: '', unidad: ''
                });
            }

            if (maxNiveles >= 2) {
                for (let clave2 in nivel1) {
                    const nivel2 = nivel1[clave2];

                    if (nivel2 && nivel2.lastTracking && nivel2.lastTracking.lat && nivel2.lastTracking.lng) {
                        result.push({
                            position: { lat: nivel2.lastTracking.lat, lng: nivel2.lastTracking.lng },
                            chofer: clave1,
                            recorrido: clave2,
                            tipo: '', nombre: '', unidad: ''
                        });
                    }
                }
            }
        }
    }

    return result;
}

function TransformFirebaseHistoryGeo(list_geo_firebase) {
    const result = [];

    Object.values(list_geo_firebase).forEach(vehicleData => {
        if (vehicleData.tracking) {
            Object.entries(vehicleData.tracking).forEach(([idParada, coords]) => {
                result.push({
                    idParada: idParada,
                    position: {
                        lat: parseFloat(coords.lat),
                        lng: parseFloat(coords.lng)
                    }
                });
            });
        }
    });

    result.sort((a, b) => {
        const numA = parseInt(a.idParada.replace('p_', ''));
        const numB = parseInt(b.idParada.replace('p_', ''));
        return numA - numB;
    });

    return result;
}

function CompleteDataRecorrido(JSON_1, JSON_2) {
    const resultado = [];

    JSON_1.forEach((item1, index) => {
        const match = JSON_2.find(item2 =>
            String(item2.recorrido) === String(item1.recorrido) &&
            String(item2.chofer) === String(item1.chofer) &&
            Number(item2.liveTracking) === 1
        );


        if (match) {
            resultado.push({
                position: item1.position,
                chofer: item1.chofer,
                recorrido: item1.recorrido,
                tipo: item1.tipo || "",
                nombre: match.nom_Transportis || "",
                unidad: match["unidad "]?.trim() || match.unidad || ""
            });
        }
    });

    return resultado;
}


function DrawRouteMap(listaParadas, color) {
    if (!map || listaParadas.length < 2) return -1;

    routeCounter++;
    const routeId = routeCounter;

    listaParadas.sort((a, b) => a.idParada - b.idParada);
    const waypoints = [];
    const positions = listaParadas.map(p => p.position);

    for (let i = 1; i < positions.length - 1; i++) {
        waypoints.push({ location: positions[i], stopover: true });
    }

    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: { strokeColor: color, strokeWeight: 4 }
    });

    const directionsService = new google.maps.DirectionsService();
    const request = {
        origin: positions[0],
        destination: positions[positions.length - 1],
        waypoints: waypoints,
        optimizeWaypoints: false,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            const routeMarkers = [];
            listaParadas.forEach((p, index) => {
                const marker = new google.maps.Marker({
                    position: p.position,
                    map: map,
                    title: `Parada ${p.idParada} (Ruta ${routeId})`,
                    label: (index + 1).toString()
                });
                routeMarkers.push(marker);
            });

            routeData.push({
                id: routeId,
                renderer: directionsRenderer,
                markers: routeMarkers
            });
        }
    });

    return routeId;
}


function DrawUnlimitedRouteMap(listaParadas, color, iconUrl, idSWControl, showMarks = true, showTraffic = true, hideRoads = true) {
    if (!window.google?.maps || !map || listaParadas.length < 2) return -1;

    const focusRouteInMap = () => {
        try {
            const bounds = new google.maps.LatLngBounds();
            positions.forEach(p => bounds.extend(p));
            map.fitBounds(bounds);
        } catch (e) {
            console.warn('No fue posible centrar el mapa en la ruta', e);
        }
    };

    $('#' + idSWControl).prop('disabled', true);
    routeCounter++;
    const routeId = routeCounter;

    let trafficLayer = false;

    listaParadas.sort((a, b) => a.idParada - b.idParada);
    const positions = listaParadas.map(p => p.position);

    const customIcon = iconUrl ? {
        url: iconUrl, scaledSize: new google.maps.Size(32, 32), anchor: new google.maps.Point(16, 32)
    } : null;
    const infoWindow = new google.maps.InfoWindow();
    const routeMarkers = showMarks ? createMarkers(listaParadas, routeId, customIcon, infoWindow, map) : [];

    const renderers = [];
    const API_KEY = '[CLAVE_GOOGLE_REDACTADA]';

    const arrowIcon = [{
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: color, fillOpacity: 1, strokeWeight: 0 },
        offset: '0%', repeat: '500px'
    }];





    drawRoutesChunks(positions, color, renderers, API_KEY, arrowIcon)
        .then(() => {
            if (renderers.length === 0) {
                const fallbackPolyline = new google.maps.Polyline({
                    path: positions,
                    map: map,
                    strokeColor: color,
                    strokeWeight: 4,
                    strokeOpacity: 0.50,
                    geodesic: true,
                    icons: arrowIcon
                });
                renderers.push(fallbackPolyline);
            }

            routeData.push({ id: routeId, renderers, markers: routeMarkers, trafficLayer });
            focusRouteInMap();
            $('#' + idSWControl).prop('disabled', false);
            return routeId;
        })
        .catch(error => {
            console.error('Error drawing routes:', error);

            const fallbackPolyline = new google.maps.Polyline({
                path: positions,
                map: map,
                strokeColor: color,
                strokeWeight: 4,
                strokeOpacity: 0.50,
                geodesic: true,
                icons: arrowIcon
            });
            renderers.push(fallbackPolyline);
            routeData.push({ id: routeId, renderers, markers: routeMarkers, trafficLayer });
            focusRouteInMap();

            $('#' + idSWControl).prop('disabled', false);
            return -1;
        });

    return routeId;
}

function drawRoutesChunks(positions, color, renderers, API_KEY, arrowIcon) {
    const MAX_WAYPOINTS = 23;

    function processChunk(startIndex) {
        return new Promise((resolve) => {
            if (startIndex + 1 >= positions.length) {
                resolve();
                return;
            }

            const endIndex = Math.min(startIndex + MAX_WAYPOINTS + 1, positions.length);
            const chunkPositions = positions.slice(startIndex, endIndex);

            if (chunkPositions.length >= 2) {
                const requestBody = {
                    origin: {
                        location: {
                            latLng: {
                                latitude: chunkPositions[0].lat,
                                longitude: chunkPositions[0].lng
                            }
                        }
                    },
                    destination: {
                        location: {
                            latLng: {
                                latitude: chunkPositions[chunkPositions.length - 1].lat,
                                longitude: chunkPositions[chunkPositions.length - 1].lng
                            }
                        }
                    },
                    intermediates: chunkPositions.slice(1, -1).map(p => ({
                        location: {
                            latLng: {
                                latitude: p.lat,
                                longitude: p.lng
                            }
                        }
                    })),
                    travelMode: 'DRIVE',
                    routingPreference: 'TRAFFIC_UNAWARE',
                    polylineQuality: 'HIGH_QUALITY',
                    computeAlternativeRoutes: false
                };

                fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': API_KEY,
                        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (!response.ok) {
                            const errorText = response.text();
                            console.error('Routes API error:', response.status, errorText);
                            resolve();
                            return;
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data?.routes?.[0]?.polyline?.encodedPolyline) {
                            const path = google.maps.geometry.encoding.decodePath(data.routes[0].polyline.encodedPolyline);
                            const chunkPolyline = new google.maps.Polyline({
                                path: path,
                                map: map,
                                strokeColor: color,
                                strokeWeight: 4,
                                strokeOpacity: 0.50,
                                geodesic: true,
                                icons: arrowIcon
                            });
                            renderers.push(chunkPolyline);
                        }
                        processNextChunk();
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                        processNextChunk();
                    });

                function processNextChunk() {
                    const nextIndex = endIndex - 1;
                    if (nextIndex + 1 < positions.length) {
                        processChunk(nextIndex).then(resolve);
                    } else {
                        resolve();
                    }
                }
            } else {
                resolve();
            }
        });
    }

    return processChunk(0);
}

function ClearSingleRouteMapById(routeId) {
    const index = routeData.findIndex(r => r.id === routeId);
    if (index !== -1) {
        const route = routeData[index];
        route.renderer.setMap(null);
        route.markers.forEach(marker => marker.setMap(null));
        routeData.splice(index, 1);
    }
}


function ClearRouteMapById(routeIds) {
    const ids = Array.isArray(routeIds) ? routeIds : [routeIds];

    const idsToFind = ids.map(id => Number(id)).filter(id => !isNaN(id));

    const routesToRemove = routeData
        .map((route, index) => ({ route, index }))
        .filter(({ route }) => {
            const match = idsToFind.includes(Number(route.id));
            return match;
        })
        .sort((a, b) => b.index - a.index);

    if (routesToRemove.length === 0) {
        console.warn('NO SE ENCONTRARON RUTAS para IDs:', idsToFind, 'routeData disponible:', routeData.map(r => r.id));
        return;
    }

    routesToRemove.forEach(({ route, index }) => {
        if (route.renderers && Array.isArray(route.renderers)) {
            route.renderers.forEach((renderer, i) => {
                if (renderer.setMap) {
                    renderer.setMap(null);
                }
            });
        }

        if (route.markers && Array.isArray(route.markers)) {
            route.markers.forEach(marker => {
                if (marker.setMap) marker.setMap(null);
            });
        }

        if (route.trafficLayer) {
            route.trafficLayer.setMap(null);
        }

        routeData.splice(index, 1);
    });
}

function ClearAllRoutes() {
    routeData.forEach(route => {
        if (route.renderers && Array.isArray(route.renderers)) {
            route.renderers.forEach(renderer => {
                if (renderer.setMap) renderer.setMap(null);
            });
        }

        if (route.markers && Array.isArray(route.markers)) {
            route.markers.forEach(marker => {
                if (marker.setMap) marker.setMap(null);
            });
        }

        if (route.trafficLayer) {
            route.trafficLayer.setMap(null);
        }
    });

    routeData = [];
    routeCounter = 0;

    if (window.infoWindows && Array.isArray(window.infoWindows)) {
        window.infoWindows.forEach(iw => iw.close());
    }
}


function DrawTransports(lista_geo) {
    if (!map) return;


    lista_geo.forEach(p => {
        const marker = new google.maps.Marker({
            position: p.position,
            map: map,
            title: 'Chofer: ' + p.chofer,
            icon: (p.unidad !== '' ? '/img/Camion_ocasa.svg' : '/img/Caminantes.svg') || null
        });

        const infoWindow = new google.maps.InfoWindow({
            content:
                `<div style="min-width:200px;style='border:2px dashed red;'">
                        <h5>Recorrido: ${p.recorrido}</h5>
                        <b>Chofer: ${p.nombre}</b><br/>
                        [${p.chofer}] Unidad: <b>${p.unidad}</b><br/>                        
                </div>`

        });

        marker.addListener('click', () => {
            infoWindow.open({
                anchor: marker,
                map: map,
            });
        });


        Marcadores_GoogleGEO_por_centro.push(marker);
    });
}

function ClearGeoTransports() {
    Marcadores_GoogleGEO_por_centro.forEach(m => m.setMap(null));
    Marcadores_GoogleGEO_por_centro = [];

}










