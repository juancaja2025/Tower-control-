/**
 * Descarga un archivo PDF desde base64
 * @param {string} base64Data - Cadena base64 del PDF (sin prefijo data:)
 * @param {string} fileName - Nombre del archivo a descargar (ej: "archivo.pdf")
 */

/* 120 minutos de inactividad TIMEOUT */
window.inactivityTime = window.inactivityTime || 120 * 60 * 1000;
window.timer = window.timer || null;

// Asignar eventos solo si no están asignados
if (!window.inactivityListeners) {
    window.inactivityListeners = true;
    window.addEventListener('load', resetTimer);
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keydown', resetTimer);
    document.addEventListener('scroll', resetTimer);
    document.addEventListener('click', resetTimer);
}

function CambiarFormatoDDMMYYYY(fechaStr) {
    let [yyyy, mm, dd] = fechaStr.split('/');
    return `${dd}/${mm}/${yyyy}`;
}
function CambiarFormatoFecha(fechaStr, separador, tipo) {
    // Separador puede ser '/', '-', '.'
    let [yyyy, mm, dd] = fechaStr.split(separador);

    // Asegurar 2 dígitos en día y mes
    dd = dd.toString().padStart(2, '0');
    mm = mm.toString().padStart(2, '0');

    if (tipo === 'DD/MM/YYYY') 
        return `${dd}/${mm}/${yyyy}`;
    if (tipo === 'YYYY-MM-DD')
        return `${yyyy}-${mm}-${dd}`;

}
function resetTimer() {
    clearTimeout(window.timer);
    window.timer = setTimeout(() => {
        showPopupTimer('popup_timer', 'Sesión expirada por inactividad. Redirigiendo al login...', 15, '#FF0000');
        //window.location.href = '/Login'; // Ruta login
        localStorage.clear();
        sessionStorage.clear();
        $.post('/Home/Logout', function (respuesta) {
            if (respuesta.ok) {
                // Puedes redirigir o mostrar mensaje si quieres
                window.location.href = '/Login';
            }
        });
    }, window.inactivityTime);
}


function descargarPdfBase64(base64Data, fileName) {
    // Decodificar base64 a byte array
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Crear un Blob con el array y tipo PDF
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Invocar la función existente para guardar el Blob
    invokeSaveAsDialog(blob, fileName || "archivo.pdf");
}

/**
 * @param {Blob} file - File or Blob object. This parameter is required.
 * @param {string} fileName - Optional file name e.g. "image.png"
 */
function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        try {
            file.type = 'video/webm';
        } catch (e) { }
    }

    var fileExtension = (file.type || 'video/webm').split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.download = fileFullName;

    hyperlink.style = 'display:none;opacity:0;color:transparent;';
    (document.body || document.documentElement).appendChild(hyperlink);

    if (typeof hyperlink.click === 'function') {
        hyperlink.click();
    } else {
        hyperlink.target = '_blank';
        hyperlink.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }

    (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
}

function RestartInterval(func, Id_refreshRouteInterval, refreshRouteInterval) {    	
    clearInterval(Id_refreshRouteInterval);
    Id_refreshRouteInterval = setInterval(func, refreshRouteInterval);
    return Id_refreshRouteInterval;
}

function showPopupTimer(id, message, duration, color = '#000000') {



    $('#' + id).html('<span sytle="color:'+color+'">' + message + '</span>');
    $("#popup_timer").show(200);

    // Hide the popup after the specified duration with fade-out effect
    setTimeout(() => {
        $("#popup_timer").hide(200);
    }, duration * 1000);
}

function showPopupConfirm(message, title = 'Mensaje', onAccept = null, onCancel = null, textAcept = 'Confirmar', textCancel = 'Cancelar') {
    let modalHtml = `
        <div class="modal fade" tabindex="-1" aria-modal="true" role="dialog">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer justify-content-between">`;

    if (onCancel != null) {
        modalHtml += `<button type="button" class="btn" id="btnAsignarChoferCerrar">${textCancel}</button>`;
    }
    modalHtml += `<button type="button" id="accept-btn" class="btn btn-outline-primary-ocasa"> ${textAcept}</button>
                    </div>
                </div>
            </div>
        </div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHtml;
    const modalElement = tempDiv.firstElementChild;
    document.body.appendChild(modalElement);

    const modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
    });
    modal.show();

    // Botón cerrar (X) con data-bs-dismiss nativo
    const closeButton = modalElement.querySelector('.btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (typeof onCancel === 'function') onCancel();
            modal.hide();
        });
    }

    // Botón Cancelar (solo si existe)
    if (onCancel != null) {
        const cancelBtn = modalElement.querySelector('#btnAsignarChoferCerrar');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof onCancel === 'function') onCancel();
                modal.hide();
            });
        }
    }

    // Botón Aceptar
    const acceptBtn = modalElement.querySelector('#accept-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof onAccept === 'function') onAccept();
            modal.hide();
        });
    }

    // Cleanup al ocultar
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
}


function ExitSystem() {

    showPopupConfirm(
        "¿Estás seguro que deseas salir de la plataforma?",
        "Salir",                
        function onAccept() {
            // Varciar localStorage y sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            $.post('/Home/Logout', function (respuesta) {
                if (respuesta.ok) {
                    // Puedes redirigir o mostrar mensaje si quieres
                    window.location.href = '/Login';
                }
            });
    
        },
        function onCancel() {
            return;
        }
    );

}

function DownloadPDFManual(titulo, mensaje, filepath) {

    showPopupConfirm(
        mensaje,
        titulo,
        function onAccept() {
            
            const enlace = document.createElement('a');
            enlace.href = filepath;


            enlace.download = filepath.replace(/^.*[\\\/]/, '') || 'manual.pdf';
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);

        },
        null,
        'Descargar Manual'
    );
}

function ActivateMenu(menu) {

    //$('#sidebar .list-group a').each(function () {
    //    // Desactivar cada item: se puede hacer agregando clase .disabled (Bootstrap)
    //    // o deshabilitando el enlace para que no sea clickeable
    //    $(this)
    //        .addClass('disabled')       // agrega clase disabled para estilo
    //        .css('pointer-events', 'none')  // deshabilita clicks
    //        .attr('aria-disabled', 'true'); // accesibilidad

    //    // Opcional: quitar onclick si tiene para que no ejecute acciones
    //    $(this).off('click');
    //});
    $('#sidebar .list-group a.active').removeClass('active');
    $('#sidebar .list-group a.submenu-parent-active').removeClass('submenu-parent-active');

    const $menu = $('#' + menu);
    $menu.addClass('active');

    const $submenu = $menu.closest('.sidebar-submenu');
    if ($submenu.length > 0) {
        $submenu.prev('a.list-group-item').addClass('submenu-parent-active');
    }

}

function showOverlayMessage(id, visible, message) {

    var html = '<span class="pe-2 ps-2" style="display: flex; align-items: center; justify-content: center; width:40%;">' +
        '<p class="m-0">' + message + '</p>' +
        '<i class="fas fa-spinner fa-spin ms-2"></i>' +
        '</span>';

    if (visible) {  
        $('#' + id).html(html);
        $('#' + id).removeClass('hidden').addClass('visible');
    }
    else {        
        $('#' + id).removeClass('visible').addClass('hidden');
    }
}

// Carga los centros en el control indicado
async function cargarCentros(control_id, usuario, load_routes) {

    var request = {
        IdUsuario: usuario
    }
    // Indica si se deben cargar las rutas o no.
    if (load_routes == undefined) load_routes = true;  

    $('#' + control_id).html('<div id="spinnerCargarRutas">cargando centros <i class="fas fa-spinner fa-spin"></i></div>');

    $.ajax({
        url: '/StaticManager/GetCentros', // ruta al método del controlador
        type: 'POST',          // o 'POST' si está configurado así
        data: JSON.stringify(request),
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            //showOverlay(false);

            let exists = Object.keys(data).includes('statusCode');
            if (!exists) {

                let options = '<option value=\"\" disabled selected> [ Seleccionar un Centro ]</option>"';
                data.forEach((item) => {

                    options += "<option value='" + item.clave + "' data-latitud='" + item.latitud + "' data-longitud='" + item.longitud + "' >" + item.desc_corta + "</option>";
                });
                let select = "<select name='cmbCentro' id='cmbCentro' class='form-select h6' style='width:flex;border-radius: .5rem;' oninput='' onclick=''"+ (load_routes==true?" onchange='CargaRecorridos(\"\",this.value)'":"") + ">";
                select += options;
                select += "</select > ";

                $('#' + control_id).html(select);
                // Habilita la búsqueda una vez cargados los centros


            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //showOverlay(false);
            $('#resultado').html('Error al llamar al servidor' + jqXHR);
            $('#' + control_id).html('<span>Sin Centros</span>');
        }
    });
}

// Carga los centros con un checkbox en el control para seleccion múltiple
async function cargarCentrosCheck(control_id) {

    var request = {
        IdUsuario: ""
    }

    $.ajax({
        url: '/StaticManager/GetCentros', // ruta al método del controlador
        type: 'POST',          // o 'POST' si está configurado así
        data: JSON.stringify(request),
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            //showOverlay(false);

            let exists = Object.keys(data).includes('statusCode');
            if (!exists) {

                let options = '';  

                //let options = '<option value=\"\" disabled selected> [ Seleccionar un Centro ]</option>"';
                data.forEach((item) => {

                    options += '<li class="list-group-item d-flex small cursor-pointer" data-id="'+item.clave+'">';
                    options += '<input class="form-check-input cursor-pointer" type="checkbox"/><span class="ps-1" style="font-size:9pt !Important;">' + item.desc_corta + '</span>'
                    options += '</li>';

                    //options += "<label><input type='checkbox' value='" + item.clave + "' onchange='handleCheckboxChange(this)'>" + item.desc_corta + "</label>";
                });
                //let select = "<div class='dropdown-btn' >Seleccionar opciones</div>";
                let select = "<div id='dropdown-list' class='dropdown-content'>";
                select += options;
                select += "</div > ";
                select += "</div > ";

                $('#' + control_id).html(select);
                // Habilita la búsqueda una vez cargados los centros


            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //showOverlay(false);
            $('#resultado').html('Error al llamar al servidor' + jqXHR);
        }
    });
}

async function cargarPerfiles(control_id) {
    $.ajax({
        url: '/StaticManager/GetPerfiles', // ruta al método del controlador
        type: 'GET',          // o 'POST' si está configurado así        
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
            //showOverlay(false);

            let exists = Object.keys(data).includes('statusCode');
            if (!exists) {

                let data_permission = '';
                let options = '<option value=\"\" disabled selected>Seleccionar Perfil</option>"';
                data.forEach((item) => {
                    data_permission = '<ul>';
                    item.permisos.forEach(per => {
                        data_permission += '<li>' + per.descripcion + '</li>';
                    });
                    if (data_permission === '<ul>') data_permission += '<li>SIN ACCESOS</li>';
                    data_permission += '</ul>';
                    options += "<option data-add='"+data_permission+"' value='" + item.id + "' >" + item.nombre + "</option>";
                });
                //let select = "<select id='cmbPerfiles' class='form-select h6' style='width:flex;'>";
                //select += options;
                //select += "</select > ";

                $('#' + control_id).html(options);
                // Habilita la búsqueda una vez cargados los centros


            }

        },
        error: function (jqXHR, textStatus, errorThrown) {
            //showOverlay(false);
            $('#resultado').html('Error al llamar al servidor' + jqXHR);
        }
    });
}

function toRadians(angle) {
    return angle * Math.PI / 180;
}

// Calcula la distancia entre dos coordenadas geográficas usando la fórmula Haversine
function getCoordinateDistance(lat1, lon1, lat2, lon2) {
    const EarthRadius = 6371000; // Radio de la Tierra en metros

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = EarthRadius * c;

    return Math.floor(distance); // distancia en metros
}

function filtrarPuntosPorDistancia(lista_geo_history, distanciaMinima = 100) {
    if (!lista_geo_history || lista_geo_history.length === 0) {
        return [];
    }

    const listaFiltrada = [lista_geo_history[0]]; // Siempre inclye el primer punto para dar origen

    for (let i = 1; i < lista_geo_history.length; i++) {
        const puntoActual = lista_geo_history[i];
        const ultimoPuntoFiltrado = listaFiltrada[listaFiltrada.length - 1];

        const distancia = getCoordinateDistance(
            ultimoPuntoFiltrado.position.lat,
            ultimoPuntoFiltrado.position.lng,
            puntoActual.position.lat,
            puntoActual.position.lng
        );

        // Si la distancia es mayor a la mínima, agregar el punto
        if (distancia > distanciaMinima) {
            listaFiltrada.push(puntoActual);
        }
    }

    // Siempre agrega el último punto de la lista original
    if (lista_geo_history.length > 1) {
        listaFiltrada.push(lista_geo_history[lista_geo_history.length - 1]);
    }


    return listaFiltrada;
}
