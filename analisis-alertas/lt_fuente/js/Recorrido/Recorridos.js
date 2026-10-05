/*
 *    RECORRIDOS
 */
let lista = [];
let lista_recorridos = [];                          // Lista de recorridos obtenidos al cargar un centro
let lista_recorridos_livetracking = [];             // Lista de recorridos con live tracking activado

let Marcadores_GoogleGEO_por_centro = [];           // Marcadores de geolocalizaciones de los recorridos por centro
let Marcadores_GoogleGEO_por_chofer = [];           // Marcadores de geolocalizaciones de un recorrido por chofer
let Marcadores_GoogleGEO_sucursales = [];           // Marcador del centro/s seleccionado/s


let ListaPosicion_GEO_por_centro = [];              // Lista de puntos geolocalizados de los recorridos por centro
let ListaPosicion_GEO_por_chofer = [];              // Lista de puntos geolocalizados de un recorrido por chofer
let ListaPosicion_GEO_sucursales = [];

let ListaParadas_GEO_Planificada = [];              // Lista de paradas geolocalizadas, para dibujo de traza
let Id_GEO_Centro_Seleccionado;

// Manejadore de rutas
let routeRenderers = [];                            // Array global para DirectionsRenderer
let routeMarkers = [];                              // Array global para marcadores de ruta

let routeData = [];                                 // [{id: 1, renderer: DirectionsRenderer, markers: []}, ...]
let routeCounter = 0;

let IdRoutePlanned = 0;                             // Id de la ruta planificada trazada en el mapa
let IdRouteReal = 0;                                // Id de la ruta real trazada en el mapa

let ListToCleanRoutePlanned = [];                   // Store de rutas planificadas a limpiar 
let ListToCleanRouteReal = [];                      // Store de rutas reales a limpiar

let Id_refreshRouteInterval = 0;		// Id para el manejo del Intervalo de refresco de indices
let refreshRouteInterval = 120 * 1000;	// 2 minutos = 120 * 1000

let Id_refreshGeoTransportInterval = 0;         // Id para el manejo del Intervalo de refresco GEO de transportes
let refreshGeoTransportInterval = 60 * 1000     // 1 minuto

let fragmentMarkers = [];

/// Modificar para cargar ni bien se abre el formulario.
//let lista_de_paradas = [
//    { id: 1, texto: 'Parada 1 - MARIANO FERREYRA 302' },
//    { id: 2, texto: 'Parada 2 - RAMÓN CARRILLO & MADRESELVA 0' },
//    { id: 3, texto: 'Parada 3 - ANTONIO CERVETTI 1345 0' },
//    // ...
//];
let lista_de_paradas = [];

let $input = $('#parada-autocomplete');
let $hidden = $('#parada');
let $list = $('#parada-list');
/*
*        EVENTOS
*/
//routeSearchInput.addEventListener('input', filterRouteCards);
//detailsSearchInput.addEventListener('input', filterParadasCards);

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


    $('#title-page').html("Recorridos");
    $('#menu_Recorrido').addClass("active");

    ActivarLiveControls(false);

    cargarCentros('cmbCentroRecorridos', login_usuario);

    $('#download-constancia-btn').on('click', function () {

        // Hay que obtener la clave que trae el modal
        var clave = $('#parada-modal-body').attr('data-clave');

        if (clave !== undefined && clave !== '') {
            let mensaje = '';
            showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Descargando constancia digital, aguarde un momento'), 2);
            DownloadConstanciaDigital(clave);

        }
    })

    $('#routeSearchInput').on('input', function () {

        let centro = $('#cmbCentro').val();
        if (centro !== undefined && centro !== '' && centro !== null)
            filterRouteCards();
    });
    $('#detailsSearchInput').on('input', function () {
        filterParadasCards();
    });

    ActivateMenu('Menu_Recorrido');

    // Refresco automatico de recorridos
    //Id_refreshRouteInterval = RestartInterval(RefreshRoute, Id_refreshRouteInterval, refreshRouteInterval);

    // Refresco automático de GEO
    //Id_refreshGeoTransportInterval = RestartInterval(RefreshGEOTransport,Id_refreshGeoTransportInterval, refreshGeoTransportInterval)

    //$('#tab-history').on('click', function () {
    //    getMessagesToDriver();
    //});

    $('#texto_mensaje').on('input', function () {
        let count = 200 - $(this).val().length;
        $('#mensaje-counter').text(count);

        // Opcional: prevenir más de 200 caracteres
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
            //console.log('Recorrido REAL activado');

            // Obtener fecha y sucursal seleccionados
            var today = new Date();
            let yyyy = today.getFullYear();
            let MM = today.getMonth() + 1; // Months start at 0!
            let dd = today.getDate();
            let hh = today.getHours();
            let mm = today.getMinutes();
            let ss = today.getSeconds();


            let fecha_planificada = yyyy + '-' + MM.toString().padStart(2, '0') + '-' + dd.toString().padStart(2, '0');
            let center = $('#cmbCentro').val();
            let chofer = $('#idChoferSeleccionado').text();
            // Busca todas las geos del centro y fecha planificada
            if (chofer !== '')
                ShowRouteTransport(center, fecha_planificada, chofer, 'swTrazaRecorridoReal');


        } else {
            //console.log('Recorrido REAL desactivado');
            //ClearRouteMapById(IdRouteReal);
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

    // Navegación con teclado
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

    // Ocultar lista al hacer click fuera
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#parada-autocomplete, #parada-list').length) {
            $list.addClass('d-none');
            focusedIndex = -1;
        }
    });

    // Focus en input muestra/oculta lista si hay resultados previos
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

    // Botón Notificaciones
    $(document).on("click", "#btn_notificaciones", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const recorrido = $(this).data("recorrido");
        //console.log(recorrido);
        $('#recorrido-id').html(recorrido.recorrido);
        $('#ruta-id').html(recorrido.ruta);
        $('#msj_nombre_chofer').text(recorrido.nom_Transportis);
        $('#msj_id_chofer').text(recorrido.chofer);
        $("#mensajes-container").html('<span>0 mensajes</span>');

        getMessagesToDriver();


        //alert('A notificar se ha dicho'); 
        $('#driver-message-modal').modal('show');

        //Cargar las paradas para el combo
        CargarDatosDeParadas(recorrido.recorrido);

        return false;        // frena cualquier otro handler asociado
    });

    // Botón Chat
    $(document).on("click", "#btn_chat", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const recorrido = $(this).data("recorrido");
        alert('A chatear se ha dicho');
        return false;        // frena cualquier otro handler asociado
    });

    // Botón Descargar Recorrido
    $(document).on("click", "#btn_descargar_recorrido", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const rec = $(this).data("recorrido");
        // Descargar
        //    window.alert('Descarga');
        var centerId = $('#cmbCentro').val();
        if (!centerId) return;
        showPopupTimer('popup_timer', 'Descargando la información aguarde un momento', 2);
        $.ajax({
            url: '/api/Recorrido/ReporteRecorridos',
            type: 'GET',
            dataType: 'json',
            data: { centro: centerId, recorrido: rec.recorrido },
            success: function (data) {
                if (!Array.isArray(data) || !data.length) return;
                var headers = Object.keys(data[0]);
                var rows = [headers].concat(data.map(function (r) { return headers.map(function (h) { return r[h] != null ? r[h] : ''; }); }));
                var contenido = '\uFEFF' + 'sep=,\r\n' + rows.map(function (cols) { return cols.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
                var blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'reporte_recorridos_' + centerId + '_' + rec.recorrido + '.csv';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });


    });
}

//////
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
    // Forzar reflow para activar scroll
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

        // Scroll suave
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


//////
function ActivarLiveControls(active) {

    let livetrackingVisible = false;
    //$('#livetracking_controls').css('visibility', 'hidden');
    var perfil = JSON.parse(perfilUsuario);
    perfil.Permisos.forEach(function (permiso) {
        if (permiso.IdPermiso === "GEO") { livetrackingVisible = true; }
    });


    if (active == true) {
        $('#liveTrackingMessage').css('visibility', 'visible');
        if (livetrackingVisible) {
            $('#form-check-recorrido-real').css('visibility', 'visible');
            $('#form-check-recorrido-planificado').css('visibility', 'visible');
        }

    } else {
        $('#liveTrackingMessage').css('visibility', 'hidden');
        $('#form-check-recorrido-real').css('visibility', 'hidden');
        $('#form-check-recorrido-planificado').css('visibility', 'hidden');

        $('#swTrazaRecorridoPlanificado').prop('checked', false);
        $('#swTrazaRecorridoReal').prop('checked', false);

    }
}

// FUNCION DE REFRESCO DE RECORRIDOS
function RefreshRoute() {
    // Hay que ver en donde esta parado... si en los recorridos o en las paradas.
    var center = $('#cmbCentro').val();
    //var latitud = $('#cmbCentro option:selected').data('latitud');
    //var longitud = $('#cmbCentro option:selected').data('longitud');


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
    //console.log('Descargando clave:' + clave);

    $.ajax({
        url: '/api/Recorrido/GetConstanciaDigital', // ruta al método del controlador
        type: 'POST',          // o 'POST' si está configurado así
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (data) {
            //showOverlay(false);

            if (data != "") {

                let exists = Object.keys(data).includes('statusCode');
                if (!exists) {

                    if (data.file != null)
                        DownloadPDF(data.id, data.file);
                    else
                        showPopupTimer('popup_timer', 'No se ha encontrado una constancia para esta parada', 5);

                    // Descargar el archivo
                } else {
                    let mensaje = 'Se produjo un error al descargar la constancia digital';
                    showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);
                }
                // console.log('descargando archivo:' + data.id);

            } else
                console.log('Sin datos:');

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //showOverlay(false);
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
        url: '/api/Recorrido/GetNovedad', // ruta al método del controlador
        type: 'POST',          // o 'POST' si está configurado así
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (data) {
            //showOverlay(false);

            if (data != "") {

                let exists = Object.keys(data).includes('statusCode');
                if (!exists) {

                    if (data != null) {

                        // Carga los comprobantes de la novedad
                        let listacomprobantes = [];
                        if (data.comprobantes !== undefined) {
                            data.forEach(function (comprobantes, index) {

                                // Filtrar por tipo de comprobantes
                                // Firma, Foto dorso DNI, Foto frente DNI
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
                    //else
                    //    showPopupTimer('popup_timer', 'No hay novedades', 5);

                    // Descargar el archivo
                } else {
                    let mensaje = 'Se produjo un error al descargar la constancia digital';
                    showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);
                }
                console.log('descargando archivo:' + data.id);

            } else
                console.log('Sin datos:');

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //showOverlay(false);
            showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Se produjo un error al descargar la constancia'), 3);

        }
    });

}

// Devuelve hora y minutos (HH:mm) para valores Date/ISO/texto con hora.
function formatHourMinute(value) {
    if (value === undefined || value === null || value === '') return '--:--';

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        // Evita mostrar fechas por defecto cuando el backend no envía valor real.
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

// Carga los recorridos
async function CargaRecorridos(fecha, centro) {

    var today = new Date();
    let yyyy = today.getFullYear();
    let MM = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();
    let hh = today.getHours();
    let mm = today.getMinutes();
    let ss = today.getSeconds();

    let formattedDate = yyyy + '/' + MM + '/' + dd;

    // Refresco automatico de recorridos
    //Id_refreshRouteInterval = RestartInterval(RefreshRoute, Id_refreshRouteInterval, refreshRouteInterval);

    var contenido = $('#cards-section').html();
    $('#cards-section').empty();
    $('#cards-section').append(`<div id="spinnerCargarRutas">cargando recorridos <i class="fas fa-spinner fa-spin"></i></div>`);
    //$('#cards-section').append(contenido);

    if (fecha === undefined || fecha === '') fecha = formattedDate

    //********************************************************************************* */
    // Centro
    // Obtiene coordenadas del centro
    var centro_seleccionado = $('#cmbCentro').find('option:selected');
    var latitud = centro_seleccionado.data('latitud');  // obtiene latitud
    var longitud = centro_seleccionado.data('longitud'); // obtiene longitud
    if (latitud !== undefined && latitud !== '' && longitud !== undefined && longitud !== '') {
        //console.log("Latitud :", latitud, "Longitud:", longitud);
        // Mostrar en el mapa el centro seleccionado

        Id_GEO_Centro_Seleccionado = {
            idParada: 0,
            position: {
                lat: latitud,
                lng: longitud
            }
        }

        addWarehouseMarker(latitud, longitud, centro_seleccionado.text());

    }

    // Limpiar lista de recorridos
    lista_recorridos = [];
    lista_recorridos_livetracking = [];


    //Objeto con los filtros que vas a enviar
    var filtros = {
        Fecha_Planif: fecha,
        Sucursal: centro
    };


    $.ajax({
        url: '/api/Recorrido/GetRecorridosTables',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filtros),
        dataType: 'json',
        success: function (response) {


            $('#cards-section').empty();
            let efectividadIcon = '';
            let efectividadIconColor = '';

            if (response.data.length == 0) {

                $('#cards-section').append("<span class='col-12 text-center'>Sin recorridos</span>");

            } else {

                // Se cargan los recorridos
                lista_recorridos = response.data;  // Guardamos los recorridos en la lista
                lista_recorridos_livetracking = response.data.filter(ruta => ruta.liveTracking == 1);  // Filtramos los recorridos con live tracking

                let efectividadBackColor = colorOCASA.verdeClaro;
                let efectividadTextColor = colorOCASA.verde;

                response.data.forEach(function (ruta, index) {
                    /// Mostramos los Recorridos en el menú lateral

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

                    //////////////////////////// TARJETA NUEVA /////////////////////
                    var card = `<div id="" class="card route-card w-90" data-route="${ruta.ruta}" data-recorrido="${ruta.recorrido}" data-chofer="${ruta.nom_Transportis}" data-livetracking="${ruta.liveTracking}" data-IdChofer="${ruta.chofer}">

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
                                            <span class="small fw-bold">&nbsp;${formatKmValue(ruta.km_Fin)}</span>
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
                                            <small class="fw-bold">${formatHourMinute(ruta.dateSys_Inicio)}</small>
                                        </div>
                                        <div class="d-flex flex-column justify-content-between align-items-flex-end">
                                            <small class="text-muted">Hora de cierre</small>
                                            <small class="fw-bold" style="text-align: right;">${formatHourMinute(ruta.dateSys_Fin)}</small>
                                        </div>
                                        </div>
                                     
                                        <!-- Sección de Live Tracking con Iconos de Acción -->
	
	                                <div class="geolocation-section d-flex align-items-center"> <!-- d-none -->`;

                    if (ruta.liveTracking === 1) {
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
			                                <button type="button" class="btn btn-icon-footer p-1" id="btn_notificaciones" title="Mensajes"
                                            data-recorrido='${JSON.stringify(ruta)}'>
				                                <i class="bi bi-chat-dots-fill fs-5" style="color: #0099a8;"></i>
			                                </button>
			                                <button type="button" class="btn btn-icon-footer p-1 d-none" id="btn_chat" title="Notificaciones"
                                            data-recorrido='${JSON.stringify(ruta)}'>
				                                <i class="bi bi-bell fs-5"></i>
			                                </button>
                                            <button type="button" class="btn btn-icon-footer p-1" id="btn_descargar_recorrido" title="Descargar Recorrido"
                                            data-recorrido='${JSON.stringify(ruta)}'>
	                                            <i class="bi bi-file-earmark-arrow-down fs-5" style="color: #0099a8;"></i> 
                                            </button>
		                                </div>
	                                </div>
	                                <!-- FIN: Sección de Live Tracking -->

                                </div>`;

                    //lista.push({ position: { lat: latitud, lng: longitud }, title: ruta.ruta, index: index });

                    $('#cards-section').append(card);

                });



                // Trae la geo de todos los recorridos del centro 
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


/// FILTRAR RECORRIDOS
function filtrarRecorridos(filtro) {

    var Mensaje = `
        <div id="no-results-alert" class="alert alert-warning text-center mt-3" role="alert">
            <span class="material-symbols-outlined align-middle me-1">warning</span>
            No existe recorrido que coincida con la búsqueda.
        </div>`;

    let searchText = filtro.toLowerCase().trim();
    let encontrados = 0;

    // Recorre todas las tarjetas
    $('.route-card').each(function () {
        let route = $(this).data('route').toString().toLowerCase();
        let recorrido = $(this).data('recorrido').toString().toLowerCase();
        let chofer = $(this).data('chofer').toString().toLowerCase();


        //chofer

        if (route.includes(searchText) || recorrido.includes(searchText) || chofer.includes(searchText)) {
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
        $('#cards-section').append(Mensaje);
    }


}

// Agregamos el evento CLICK() en las targetas de los recorridos
// Live tracking ACTIVADA (div)
//$(document).on("click", "#live-tracking-trigger", function (e) {
//    e.stopPropagation(); // para que no dispare el click de la card
//    const recorrido = $(this).data("recorrido");
//    alert('live tracking');
//});


function CargarDatosDeParadas(recorrido) {

    var filtros = { IdParada: recorrido };
    var data_parada;

    try {

        $.ajax({
            url: '/api/Recorrido/GetParadasTables',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(filtros),
            dataType: 'json',
            success: function (response) {
                lista_de_paradas = [];
                response.data.forEach(function (parada) {
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

    // Recorrido individual
    $(".route-card").on("click", function (e) {



        // Para que no se propague el click de los botones hijos en la card
        if (
            $(e.target).closest('#btn_notificaciones, #btn_chat, #btn_descargar_recorrido').length
        ) {
            return; // NO ejecutar el handler del card
        }

        let chofer = $(this).data("idchofer");
        let valor = $(this).data("recorrido");
        let livetracking = $(this).data("livetracking");

        //$('#tituloMapaRecorridos').text(`Detalles del recorrido ${valor}`);
        $('#tituloMapaRecorridos').html(
            `Detalles del recorrido <span class="recorrido-id">${valor}</span>`
        );
        $('#idChoferSeleccionado').text(chofer);

        // Quita selección previa
        $(".route-card").removeClass("selected");

        // Marca la card actual
        $(this).addClass("selected");

        // Activa paneles de detalle
        $("#lists-panel").addClass("details-active");
        $("#map-section").addClass("details-active");

        if (livetracking === 1) {

            ShowLiveTransports(centro, fecha_planificada, chofer);
            ActivarLiveControls(true);

        } else {
            ClearGeoTransports(); // Limpia los marcadores previos

        }
        //ClearAllRoutes();
        ClearRouteMapById(IdRoutePlanned);
        ClearRouteMapById(IdRouteReal);

        mostrarParadas(valor);
    });

    // Botón para cerrar detalles
    $("#close-details-btn").on("click", function () {

        ActivarLiveControls(false);
        clearMarkers();
        ClearRouteMapById(IdRoutePlanned);
        $("#lists-panel").removeClass("details-active");
        $("#map-section").removeClass("details-active");
        $(".route-card").removeClass("selected");

        $('#section-search-recorridos').show();

        centro = $('#cmbCentro').val();
        ShowLiveTransports(centro, fecha_planificada, '');

        // section-search-recorridos
        //$("#section-search-container")
        //    .html(`<span class="input-group-text bg-white border-end-0"><span class="material-symbols-outlined text-muted">search</span></span>
        //  <input type="text" class="form-control border-start-0" id="routeSearchInput" placeholder="Buscar recorridos...">`);

    });

}

function DownloadPDF(ID, fileBase64) {

    let nombreArchivo = 'Constancia_Digital_' + ID + '_';
    let data = '';
    var today = new Date();
    let yyyy = today.getFullYear();
    let MM = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();
    let hh = today.getHours();
    let mm = today.getMinutes();
    let ss = today.getSeconds();

    let formattedDate = yyyy + '' + MM + dd + hh + mm + ss;


    //var PdfFile = new Blob([FILE], { type: 'application/pdf' });
    //invokeSaveAsDialog(PdfFile, nombreArchivo + formattedDate + '.pdf');

    const byteCharacters = atob(fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Crear un Blob con el array y tipo PDF
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Invocar la función existente para guardar el Blob
    invokeSaveAsDialog(blob, nombreArchivo + formattedDate + '.pdf' || "archivo.pdf");

}

// Guarda los mensajes enviados a un chofer
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
        url: '/StaticManager/SaveMessageToDriver', // ruta al método del controlador
        type: 'POST',          // o 'POST' si está configurado así
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
            //showOverlay(false);
            showPopupTimer('popup_timer', 'Se produjo un error al enviar el mensaje', 3);

        },
        complete: function () {
            btn.prop('disabled', false);
        }
    });
}

// Obtiene todos los mensajes de un chofer para una fecha dada
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
        url: '/StaticManager/GetMessageToDriver', // ruta al método del controlador
        type: 'POST',          // o 'POST' si está configurado así
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (response) {


            $("#mensajes-container").html('<span>0 mensajes</span>');
            //&& Array.isArray(response.response)
            let message_data = JSON.parse(response.response);
            if (response.operation && message_data.length > 0) {

                $("#mensajes-container").html('<span class="small text-muted">Se encontraron&nbsp;' + message_data.length + '&nbsp;mensajes</span>');
                message_data.forEach(m => addMessageCard(m));
            }


            //mensajes.forEach(m => addMessageCard(m));



        },
        error: function (jqXHR, textStatus, errorThrown) {
            //showOverlay(false);
            showPopupTimer('popup_timer', 'Se produjo un error al descargar la constancia', 3);

        }
    });



}

// Formatear hora a algo tipo "12:01pm"
function formatTime(fechaIso) {
    const d = new Date(fechaIso);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}${ampm}`;
}

// Crea una tarjeta y la agrega al contenedor
function addMessageCard(msg) {

    const hora = formatTime(msg.Fecha_sys);
    const preview = msg.Asunto;      // texto que se ve en la línea inferior
    const body = msg.Mensaje;        // texto que se ve al expandir

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

    // Toggle expandir/contraer
    $card.find(".message-card").on("click", function () {
        const target = $(this).data("target");
        $(target).toggleClass("d-none");
    });

    $("#mensajes-container").append($card);
}


/////////////////////////////////////////////////////////////////
///
///                         G E O
///
/////////////////////////////////////////////////////////////////

async function ShowLiveTransports(centro, fecha, chofer) {

    let full_path = 'OcasaLiveTracking/' + fecha + '/' + centro + (chofer !== undefined && chofer !== '' ? '/' + chofer : '');

    const request = {
        path: full_path
    };

    try {

        // Consulta la geo al firebase
        $.ajax({
            url: '/StaticManager/GetGEOData',
            type: 'POST',                       // o 'POST' si está configurado así
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (response) {

                ClearGeoTransports(); // Limpia los marcadores previos
                //const array = Object.entries(response).map(([id, data]) => ({
                //    id: id,
                //    data: data
                //}));
                if (response !== undefined) {

                    // la lista_recorridos_livetracking es para saber si es un vehiculo o un caminante
                    ListaPosicion_GEO_por_centro = TransformFirebaseDataToGeoList(response, lista_recorridos_livetracking, (chofer == '' ? 2 : 1), chofer);

                    // Corregir tipo de transporte en la estructura ListaPosicion_GEO_por_centro

                    ListaPosicion_GEO_por_centro = CompleteDataRecorrido(ListaPosicion_GEO_por_centro, lista_recorridos_livetracking);
                    //const geoData = response.json();
                    //[{ position: { lat: ..., lng: ... } }, ...]
                    if (ListaPosicion_GEO_por_centro.length > 0) {
                        DrawTransports(ListaPosicion_GEO_por_centro);
                        var listado_macadores = [];
                        listado_macadores.push(ListaPosicion_GEO_por_centro);
                        listado_macadores.push(ListaPosicion_GEO_sucursales);

                        centerMapsWithMarkers(listado_macadores);
                    }




                }
                else {
                    
                    //centerMapsWithMarkers(Marcadores_GoogleGEO_sucursales);
                    showPopupTimer('popup_timer', 'No se encuentran posiciones Geo de transportes', 5);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //showOverlay(false);
                showPopupTimer('popup_timer', 'Se produjo un error al descargar la constancia', 3);

            }
        });

        return geoData;

    } catch (error) {
        //console.error('Error al obtener datos GEO:', error);
        return null;
    }
}

async function ShowRouteTransport(centro, fecha, chofer, idswitch) {
    let full_path = 'OcasaLiveTrackingHistory/' + fecha + '/' + centro + (chofer !== undefined && chofer !== '' ? '/' + chofer : '');

    const request = {
        path: full_path
    };

    try {

        // Consulta la geo al firebase
        $.ajax({
            url: '/StaticManager/GetGEOData',
            type: 'POST',                       // o 'POST' si está configurado así
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (response) {

                //ClearGeoTransports(); // Limpia los marcadores previos

                if (response !== undefined) {

                    var lista_geo_history = TransformFirebaseHistoryGeo(response);
                    $('#' + idswitch).prop('checked', false);


                    // Filtrar puntos a distancia de 100 metros
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
                //showOverlay(false);
                showPopupTimer('popup_timer', 'Se produjo un error al descargar la constancia', 3);

            }
        });

        return geoData;

    } catch (error) {
        //console.error('Error al obtener datos GEO:', error);
        return null;
    }

}

//function TransformFirebaseDataToGeoList(list_geo_firebase, list) {
//    const result = [];

//    // Primer nivel con for...in
//    for (let primerId in list_geo_firebase) {
//        if (list_geo_firebase.hasOwnProperty(primerId)) {
//            const primerNivel = list_geo_firebase[primerId];

//            // Segundo nivel con for...in
//            for (let segundoId in primerNivel) {
//                if (primerNivel.hasOwnProperty(segundoId)) {
//                    const tracking = primerNivel[segundoId].lastTracking;
//                    if (tracking && tracking.lat && tracking.lng) {
//                        result.push({
//                            position: { lat: tracking.lat, lng: tracking.lng },
//                            chofer: `${primerId}`,
//                            recorrido: `${segundoId}`,
//                            tipo: ''
//                        });
//                    }
//                }
//            }
//        }
//    }

//    return result;
//}


function TransformFirebaseDataToGeoList(list_geo_firebase, list, maxNiveles = 2, chofer) {
    const result = [];

    // NIVEL 1: Solo primer nivel (chofer vacío)
    if (maxNiveles >= 1) {
        for (let clave1 in list_geo_firebase) {
            const nivel1 = list_geo_firebase[clave1];

            // Verificar si tiene lastTracking directamente
            if (nivel1.lastTracking && nivel1.lastTracking.lat && nivel1.lastTracking.lng) {
                result.push({
                    position: { lat: nivel1.lastTracking.lat, lng: nivel1.lastTracking.lng },
                    chofer: chofer,           // ✅ Vacío para maxNiveles=1
                    recorrido: clave1,
                    tipo: '', nombre: '', unidad: ''
                });
            }

            // NIVEL 2: Segundo nivel (chofer = clave1, recorrido = clave2)
            if (maxNiveles >= 2) {
                for (let clave2 in nivel1) {
                    const nivel2 = nivel1[clave2];

                    if (nivel2 && nivel2.lastTracking && nivel2.lastTracking.lat && nivel2.lastTracking.lng) {
                        result.push({
                            position: { lat: nivel2.lastTracking.lat, lng: nivel2.lastTracking.lng },
                            chofer: clave1,       // ✅ Primer nivel
                            recorrido: clave2,    // ✅ Segundo nivel
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

    // Iterar sobre claves principales (ej: "9965600")
    Object.values(list_geo_firebase).forEach(vehicleData => {
        // Acceder a tracking
        if (vehicleData.tracking) {
            // Iterar sobre paradas p_0001, p_0002...
            Object.entries(vehicleData.tracking).forEach(([idParada, coords]) => {
                result.push({
                    idParada: idParada,  // "p_0001", "p_0002"...
                    position: {
                        lat: parseFloat(coords.lat),
                        lng: parseFloat(coords.lng)
                    }
                });
            });
        }
    });

    // Ordenar por idParada numéricamente
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
            item2.liveTracking === 1  // ← NUEVA CONDICIÓN
        );

        //console.log(`Item ${index}:`, {
        //    recorrido: item1.recorrido,
        //    chofer: item1.chofer,
        //    livetracking: match ? match.livetracking : 'no match',
        //    encontrado: !!match,
        //    matchData: match
        //});

        // ← SOLO agregar si hay match VÁLIDO (incluyendo livetracking === 1)
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


//************************************************************************
// Dibuja la ruta en el mapa usando DirectionsService y DirectionsRenderer
//************************************************************************
function DrawRouteMap(listaParadas, color) {
    if (!map || listaParadas.length < 2) return -1;

    routeCounter++;
    const routeId = routeCounter;

    // Ordenar por idParada
    listaParadas.sort((a, b) => a.idParada - b.idParada);
    const waypoints = [];
    const positions = listaParadas.map(p => p.position);

    for (let i = 1; i < positions.length - 1; i++) {
        waypoints.push({ location: positions[i], stopover: true });
    }

    // DirectionsRenderer único para esta ruta
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

            // Marcadores únicos para esta ruta
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

            // Guardar datos de esta ruta
            routeData.push({
                id: routeId,
                renderer: directionsRenderer,
                markers: routeMarkers
            });
        }
    });

    return routeId;  // Retorna ID para control individual
}

//**************************************************************************//
//                                                                          //
//                                                                          //

function DrawUnlimitedRouteMap(listaParadas, color, iconUrl, idSWControl, showMarks = true, showTraffic = true, hideRoads = true) {
    if (!window.google?.maps || !map || listaParadas.length < 2) return -1;

    $('#' + idSWControl).prop('disabled', true);
    routeCounter++;
    const routeId = routeCounter;

    //let trafficLayer = showTraffic ? new google.maps.TrafficLayer({ map }) : null;
    let trafficLayer = false;

    listaParadas.sort((a, b) => a.idParada - b.idParada);
    const positions = listaParadas.map(p => p.position);

    // Marcadores
    const customIcon = iconUrl ? {
        url: iconUrl, scaledSize: new google.maps.Size(32, 32), anchor: new google.maps.Point(16, 32)
    } : null;
    const infoWindow = new google.maps.InfoWindow();
    const routeMarkers = showMarks ? createMarkers(listaParadas, routeId, customIcon, infoWindow, map) : [];

    const renderers = [];
    const API_KEY = '[CLAVE_GOOGLE_REDACTADA]';

    // Flecha para sentido
    const arrowIcon = [{
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: color, fillOpacity: 1, strokeWeight: 0 },
        offset: '0%', repeat: '500px'
    }];





    // SOLO Routes API chunks (sigue calles, respeta sentido)
    drawRoutesChunks(positions, color, renderers, API_KEY, arrowIcon)
        .then(() => {
            routeData.push({ id: routeId, renderers, markers: routeMarkers, trafficLayer });
            $('#' + idSWControl).prop('disabled', false);
            return routeId;
        })
        .catch(error => {
            console.error('Error drawing routes:', error);
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
                    // CORREGIDO: Solo location, SIN travelAction
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
                            // console.log(`✅ Chunk ${startIndex}-${endIndex}: ${path.length} puntos sobre calles`);
                        }
                        // Procesar siguiente chunk
                        processNextChunk();
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                        // Procesar siguiente chunk incluso con error
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

//function DrawUnlimitedRouteMap(listaParadas, color, iconUrl, idSWControl, showMarks = true, showTraffic = true) {
//    if (!window.google?.maps || !map || listaParadas.length < 2) return -1;

//    $('#' + idSWControl).prop('disabled', true);
//    routeCounter++;
//    const routeId = routeCounter;

//    let trafficLayer = showTraffic ? new google.maps.TrafficLayer({ map }) : null;

//    listaParadas.sort((a, b) => a.idParada - b.idParada);
//    const positions = listaParadas.map(p => p.position);

//    // Marcadores
//    const customIcon = iconUrl ? {
//        url: iconUrl, scaledSize: new google.maps.Size(32, 32), anchor: new google.maps.Point(16, 32)
//    } : null;
//    const infoWindow = new google.maps.InfoWindow();
//    const routeMarkers = showMarks ? createMarkers(listaParadas, routeId, customIcon, infoWindow, map) : [];

//    const renderers = [];
//    const API_KEY = '[CLAVE_GOOGLE_REDACTADA]';

//    // Flecha para sentido
//    const arrowIcon = [{
//        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: color, fillOpacity: 1, strokeWeight: 0 },
//        offset: '0%', repeat: '500px'
//    }];

//    // SOLO Routes API chunks (sigue calles, respeta sentido)
//    drawRoutesChunks(positions, color, renderers, API_KEY, arrowIcon);

//    routeData.push({ id: routeId, renderers, markers: routeMarkers, trafficLayer });
//    $('#' + idSWControl).prop('disabled', false);
//    return routeId;
//}


//async function drawRoutesChunks(positions, color, renderers, API_KEY, arrowIcon) {
//    const MAX_WAYPOINTS = 23;

//    async function processChunk(startIndex) {
//        if (startIndex + 1 >= positions.length) return;

//        const endIndex = Math.min(startIndex + MAX_WAYPOINTS + 1, positions.length);
//        const chunkPositions = positions.slice(startIndex, endIndex);

//        if (chunkPositions.length >= 2) {
//            const requestBody = {
//                origin: {
//                    location: {
//                        latLng: {
//                            latitude: chunkPositions[0].lat,
//                            longitude: chunkPositions[0].lng
//                        }
//                    }
//                },
//                destination: {
//                    location: {
//                        latLng: {
//                            latitude: chunkPositions[chunkPositions.length - 1].lat,
//                            longitude: chunkPositions[chunkPositions.length - 1].lng
//                        }
//                    }
//                },
//                // CORREGIDO: Solo location, SIN travelAction
//                intermediates: chunkPositions.slice(1, -1).map(p => ({
//                    location: {
//                        latLng: {
//                            latitude: p.lat,
//                            longitude: p.lng
//                        }
//                    }
//                })),
//                travelMode: 'DRIVE',
//                routingPreference: 'TRAFFIC_UNAWARE',
//                polylineQuality: 'HIGH_QUALITY',
//                computeAlternativeRoutes: false
//            };

//            try {
//                const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
//                    method: 'POST',
//                    headers: {
//                        'Content-Type': 'application/json',
//                        'X-Goog-Api-Key': API_KEY,
//                        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
//                    },
//                    body: JSON.stringify(requestBody)
//                });

//                if (!response.ok) {
//                    const errorText = await response.text();
//                    console.error('Routes API error:', response.status, errorText);
//                    return;
//                }

//                const data = await response.json();
//                if (data.routes?.[0]?.polyline?.encodedPolyline) {
//                    const path = google.maps.geometry.encoding.decodePath(data.routes[0].polyline.encodedPolyline);
//                    const chunkPolyline = new google.maps.Polyline({
//                        path: path,
//                        map: map,
//                        strokeColor: color,
//                        strokeWeight: 4,
//                        strokeOpacity: 0.50,
//                        geodesic: true,
//                        icons: arrowIcon
//                    });
//                    renderers.push(chunkPolyline);
//                    console.log(`Chunk ${startIndex}-${endIndex}: ${path.length} puntos sobre calles`);
//                }
//            } catch (error) {
//                console.error('Fetch error:', error);
//            }
//        }

//        // Siguiente chunk con solapamiento mínimo
//        await processChunk(endIndex - 1);
//    }

//    await processChunk(0);
//}



// USA DIRECTION SERVICE PARA RUTAS CON MÁS DE 10 PARADAS
//function DrawUnlimitedRouteMap(listaParadas, color, iconUrl, idSWControl, showMarks = true) {
//    if (!map || listaParadas.length < 2) return -1;

//    $('#' + idSWControl).prop('disabled', true);

//    routeCounter++;
//    const routeId = routeCounter;

//    // Ordenar por idParada
//    listaParadas.sort((a, b) => a.idParada - b.idParada);
//    const positions = listaParadas.map(p => p.position);

//    // Configuración del icono personalizado
//    const customIcon = iconUrl ? {
//        url: iconUrl,
//        scaledSize: new google.maps.Size(32, 32),   // Tamaño escalado (ajusta según necesites)
//        anchor: new google.maps.Point(16, 32)       // Ancla en la base/centro para pin-like
//    } : null;
//    const infoWindow = new google.maps.InfoWindow();

//    // Marcadores personalizados (creados inmediatamente)
//    const routeMarkers = [];
//    if (showMarks) {
//        listaParadas.forEach((p, index) => {
//            const marker = new google.maps.Marker({
//                position: p.position,
//                map: map,
//                title: `GEO: ${p.idParada} (Grp: ${routeId})`,
//                label: (index + 1).toString(),
//                icon: customIcon
//            });
//            marker.addListener('click', () => {
//                const lat = p.position.lat.toFixed(6);
//                const lng = p.position.lng.toFixed(6);
//                const content = `
//                    <div>
//                        <strong>GEO: ${p.idParada} (Grp: ${routeId})</strong><br>
//                        Lat: ${lat}<br>
//                        Lng: ${lng}
//                    </div>
//                `;
//                infoWindow.setContent(content);
//                infoWindow.open({
//                    anchor: marker,
//                    map,
//                    shouldFocus: false
//                });
//            });

//            routeMarkers.push(marker);
//        });
//    }



//    const MAX_WAYPOINTS = 10;
//    const renderers = []; // ← Array que se llenará

//    // ← CAMBIO CLAVE: Callback cuando TODO termine
//    function onAllRoutesComplete() {
//        // AHORA sí guardar en routeData con renderers completos
//        routeData.push({
//            id: routeId,
//            renderers: renderers, // ← Array lleno
//            markers: routeMarkers
//        });
//    }

//    let pendingChunks = 0; // Contador de chunks pendientes

//    function processChunk(startIndex) {
//        pendingChunks++; // ← Incrementar contador

//        if (startIndex >= positions.length) {
//            pendingChunks--; // ← Decrementar
//            if (pendingChunks === 0) {
//                onAllRoutesComplete(); // ← Solo cuando TODO termine
//            }
//            return;
//        }

//        const endIndex = Math.min(startIndex + MAX_WAYPOINTS + 1, positions.length);
//        const chunkPositions = positions.slice(startIndex, endIndex);

//        const origin = chunkPositions[0];
//        const destination = chunkPositions[chunkPositions.length - 1];
//        const waypoints = chunkPositions.slice(1, -1).map(loc => ({
//            location: loc,
//            stopover: true
//        }));

//        // Renderer creado inmediatamente
//        const directionsRenderer = new google.maps.DirectionsRenderer({
//            map: map,
//            suppressMarkers: true,
//            preserveViewport: true,
//            polylineOptions: { strokeColor: color, strokeWeight: 4 }
//        });
//        renderers.push(directionsRenderer); // ← Se agrega AQUÍ

//        const directionsService = new google.maps.DirectionsService();
//        const request = {
//            origin: origin,
//            destination: destination,
//            waypoints: waypoints,
//            optimizeWaypoints: false,
//            travelMode: google.maps.TravelMode.DRIVING
//        };

//        directionsService.route(request, (result, status) => {
//            if (status === 'OK') {
//                directionsRenderer.setDirections(result);
//            }
//            pendingChunks--; // ← Decrementar cuando termine este chunk
//            if (pendingChunks === 0) {
//                onAllRoutesComplete(); // ← Solo cuando TODO termine
//            }
//            // Siguiente chunk
//            processChunk(endIndex - 1);
//        });
//    }

//    processChunk(0);
//    $('#' + idSWControl).prop('disabled', false);
//    return routeId;
//}
function ClearSingleRouteMapById(routeId) {
    const index = routeData.findIndex(r => r.id === routeId);
    if (index !== -1) {
        const route = routeData[index];
        route.renderer.setMap(null);
        route.markers.forEach(marker => marker.setMap(null));
        routeData.splice(index, 1);
    }
}

//function ClearRouteMapById(routeId) {

//    const index = routeData.findIndex(r => r.id === routeId);
//    if (index !== -1) {
//        const route = routeData[index];

//        // Manejar tanto renderer singular (original) como array múltiple (nueva)
//        if (route.renderers) {
//            // Nueva función: múltiples renderers
//            route.renderers.forEach(renderer => renderer.setMap(null));
//        } else if (route.renderer) {
//            // Función original: renderer único
//            route.renderer.setMap(null);
//        }

//        // Eliminar marcadores
//        route.markers.forEach(marker => marker.setMap(null));

//        // Remover de routeData
//        routeData.splice(index, 1);
//    }
//}

//function ClearRouteMapById(routeIds) {
//    // Convertir a array si es un solo ID
//    const ids = Array.isArray(routeIds) ? routeIds : [routeIds];

//    // Filtrar y eliminar rutas en orden inverso para evitar problemas de índices
//    const routesToRemove = routeData
//        .map((route, index) => ({ route, index }))
//        .filter(({ route }) => ids.includes(route.id))
//        .sort((a, b) => b.index - a.index); // Orden inverso

//    routesToRemove.forEach(({ route, index }) => {
//        // Manejar renderers múltiples o singular
//        if (route.renderers) {
//            route.renderers.forEach(renderer => renderer.setMap(null));
//        } else if (route.renderer) {
//            route.renderer.setMap(null);
//        }

//        // Eliminar marcadores (compatible con null)
//        if (route.markers && Array.isArray(route.markers)) {
//            route.markers.forEach(marker => marker.setMap(null));
//        }

//        // Cerrar InfoWindow si existe
//        if (route.infoWindow) {
//            route.infoWindow.close();
//        }

//        // Remover de routeData
//        routeData.splice(index, 1);
//    });
//}

//function ClearAllRoutes() {
//    routeData.forEach(route => {
//        route.renderer.setMap(null);
//        route.markers.forEach(marker => marker.setMap(null));
//        route.renderers.forEach(renderer => renderer.setMap(null));
//    });
//    routeData = [];
//    routeCounter = 0;
//}

function ClearRouteMapById(routeIds) {
    // Convertir a array si es un solo ID
    const ids = Array.isArray(routeIds) ? routeIds : [routeIds];

    // ✅ DEBUG: Log completo de routeData actual
    console.log('DEBUG ClearRouteMapById - routeData completa:', routeData.map(r => ({ id: r.id, hasRenderers: !!r.renderers?.length })));
    console.log('DEBUG - IDs a borrar:', ids, '(tipo:', typeof ids[0], ')');

    // ✅ Normalizar IDs a números para comparación segura
    const idsToFind = ids.map(id => Number(id)).filter(id => !isNaN(id));
    console.log('DEBUG - IDs normalizados:', idsToFind);

    // Filtrar rutas que coincidan (comparación numérica estricta)
    const routesToRemove = routeData
        .map((route, index) => ({ route, index }))
        .filter(({ route }) => {
            const match = idsToFind.includes(Number(route.id));
            //console.log(`Route ${route.id} (index ${index}) → match: ${match}`);
            return match;
        })
        .sort((a, b) => b.index - a.index);

    console.log('DEBUG - routesToRemove:', routesToRemove.map(r => r.route.id));

    // Si no encuentra rutas, mostrar advertencia
    if (routesToRemove.length === 0) {
        console.warn('NO SE ENCONTRARON RUTAS para IDs:', idsToFind, 'routeData disponible:', routeData.map(r => r.id));
        return;
    }

    // Eliminar rutas encontradas
    routesToRemove.forEach(({ route, index }) => {
        console.log(`Borrando routeId ${route.id} (index ${index})`);

        // Renderers (Routes API chunks)
        if (route.renderers && Array.isArray(route.renderers)) {
            route.renderers.forEach((renderer, i) => {
                if (renderer.setMap) {
                    renderer.setMap(null);
                    console.log(`  → Polyline ${i} borrada`);
                }
            });
        }

        // Marcadores
        if (route.markers && Array.isArray(route.markers)) {
            route.markers.forEach(marker => {
                if (marker.setMap) marker.setMap(null);
            });
        }

        // TrafficLayer
        if (route.trafficLayer) {
            route.trafficLayer.setMap(null);
        }

        // Remover de routeData
        routeData.splice(index, 1);
        console.log(`RouteId ${route.id} eliminada completamente`);
    });
}

function ClearAllRoutes() {
    // Limpiar todas las rutas
    routeData.forEach(route => {
        // Renderers (polylines de Routes API)
        if (route.renderers && Array.isArray(route.renderers)) {
            route.renderers.forEach(renderer => {
                if (renderer.setMap) renderer.setMap(null);
            });
        }

        // Marcadores
        if (route.markers && Array.isArray(route.markers)) {
            route.markers.forEach(marker => {
                if (marker.setMap) marker.setMap(null);
            });
        }

        // TrafficLayer
        if (route.trafficLayer) {
            route.trafficLayer.setMap(null);
        }
    });

    // Reset completo
    routeData = [];
    routeCounter = 0;

    // Cerrar todas las InfoWindows abiertas
    if (window.infoWindows && Array.isArray(window.infoWindows)) {
        window.infoWindows.forEach(iw => iw.close());
    }
}


/**
* Dibuja un marcador por cada item del array:
* [{ position: { lat: ..., lng: ... } }, ...]
* iconUrl es opcional para usar una imagen personalizada.
*/
function DrawTransports(lista_geo) {
    if (!map) return;


    lista_geo.forEach(p => {
        const marker = new google.maps.Marker({
            position: p.position,
            map: map,
            title: 'Chofer: ' + p.chofer,
            //content: icon
            icon: (p.unidad !== '' ? '/img/Camion_ocasa.svg' : '/img/Caminantes.svg') || null
        });

        // Crear InfoWindow con el chofer
        const infoWindow = new google.maps.InfoWindow({
            content:
                `<div style="min-width:200px;style='border:2px dashed red;'">
                        <h5>Recorrido: ${p.recorrido}</h5>
                        <b>Chofer: ${p.nombre}</b><br/>
                        [${p.chofer}] Unidad: <b>${p.unidad}</b><br/>                        
                </div>`

        });

        // Listener de click para abrir el tooltip
        marker.addListener('click', () => {
            infoWindow.open({
                anchor: marker,
                map: map,
            });
        });


        // Guardar referencia al marcador
        Marcadores_GoogleGEO_por_centro.push(marker);
    });
}

/**
 * Elimina todos los marcadores del mapa y limpia el array.
 */
function ClearGeoTransports() {
    Marcadores_GoogleGEO_por_centro.forEach(m => m.setMap(null)); // los saca del mapa
    Marcadores_GoogleGEO_por_centro = []; // elimina referencias

}

///////////////////////









