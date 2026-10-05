let siniestrosOriginalData = [];
let siniestrosData = [];
let currentPage = 1;
const siniestrosPageSize = 12;
let selectedSiniestro = null;
let fechaDesdeDefault = '';
let fechaHastaDefault = '';

function ObtenerCampo(data, campos, valorPorDefecto) {
    if (!data || !Array.isArray(campos)) {
        return valorPorDefecto;
    }

    for (let i = 0; i < campos.length; i++) {
        const valor = data[campos[i]];
        if (valor !== undefined && valor !== null && valor !== '') {
            return valor;
        }
    }

    return valorPorDefecto;
}

function SetTexto(selector, valor, valorPorDefecto) {
    $(selector).text(valor ?? valorPorDefecto);
}

function LimpiarFiltroPorSelector(selector) {
    const input = document.querySelector(selector);
    if (!input) {
        return;
    }

    if (input._flatpickr) {
        input._flatpickr.clear();
        return;
    }

    $(selector).val('');
}

function ObtenerTextoInput(selector) {
    return ($(selector).val() || '').toString().trim();
}

function ObtenerTextoFechaFiltro(selector) {
    const input = document.querySelector(selector);
    return input ? (input.value || '').toString().trim() : '';
}

function EjecutarBusquedaSiniestrosActual() {
    const fechaDesde = ObtenerFechaFiltro('#txtFechaDesde');
    const fechaHasta = ObtenerFechaFiltro('#txtFechaHasta');
    const recorrido = parseInt($('#txtFiltroRecorrido').val(), 10) || 0;
    const dominio = ($('#txtFiltroDominio').val() || '').toString().trim();

    CargarSiniestros(fechaDesde, fechaHasta, recorrido, dominio);
}

function ActualizarChipsFiltros() {
    const fechaDesde = ObtenerTextoFechaFiltro('#txtFechaDesde');
    const fechaHasta = ObtenerTextoFechaFiltro('#txtFechaHasta');
    const recorrido = ObtenerTextoInput('#txtFiltroRecorrido');
    const dominio = ObtenerTextoInput('#txtFiltroDominio');

    const chips = [];
    if (fechaDesde && fechaDesde !== fechaDesdeDefault) {
        chips.push({ label: 'Desde', value: fechaDesde, selector: '#txtFechaDesde' });
    }
    if (fechaHasta && fechaHasta !== fechaHastaDefault) {
        chips.push({ label: 'Hasta', value: fechaHasta, selector: '#txtFechaHasta' });
    }
    if (recorrido) {
        chips.push({ label: 'Recorrido', value: recorrido, selector: '#txtFiltroRecorrido' });
    }
    if (dominio) {
        chips.push({ label: 'Patente', value: dominio, selector: '#txtFiltroDominio' });
    }

    $('#btnLimpiarFiltros').toggle(chips.length > 0);

    const $chips = $('#filtrosChips').empty();
    chips.forEach(function (chip) {
        const $chip = $('<span class="filter-chip"></span>').text(chip.label + ': ' + chip.value);
        const $remove = $('<button type="button" class="filter-chip-remove" title="Quitar filtro">×</button>')
            .attr('data-target', chip.selector);

        $chip.append($remove);
        $chips.append($chip);
    });
}

function ResolverUrlAdjunto(path) {
    if (!path) {
        return '';
    }

    const normalizado = String(path).replace(/\\/g, '/').trim();
    if (!normalizado) {
        return '';
    }

    if (normalizado.startsWith('http://') || normalizado.startsWith('https://')) {
        return normalizado;
    }

    return normalizado.startsWith('/') ? normalizado : '/' + normalizado;
}

function RenderAdjuntosModal(siniestro) {
    const $container = $('#modalAdjuntosContainer');
    if ($container.length === 0) {
        return;
    }

    const adjuntos = ObtenerCampo(siniestro, ['adjuntos', 'Adjuntos'], null);
    const fotos = ObtenerCampo(adjuntos, ['fotos', 'Fotos'], []);

    if (!Array.isArray(fotos) || fotos.length === 0) {
        $container.html('<span class="text-muted">Sin adjuntos.</span>');
        return;
    }

    $container.empty();

    fotos.forEach(function (foto, index) {
        const descripcion = ObtenerCampo(foto, ['descripcionAdjunto', 'DescripcionAdjunto'], `Adjunto ${index + 1}`);
        const src = ResolverUrlAdjunto(ObtenerCampo(foto, ['path', 'Path'], ''));
        const $item = $('<div class="attachment"></div>');

        if (src) {
            $item.append($('<img>').attr('src', src).attr('alt', descripcion));
        }
        else {
            $item.append($('<div class="text-muted small">Sin vista previa</div>'));
        }

        $item.append($('<small></small>').text(descripcion));
        $container.append($item);
    });
}

function CargarDetalleModal(siniestro) {
    if (!siniestro) {
        SetTexto('#modalRecorrido', '-', '-');
        SetTexto('#modalDominioHeader', '-', '-');
        SetTexto('#modalTransportista', '-', '-');
        SetTexto('#modalCentro', '-', '-');
        SetTexto('#modalVehiculo', '-', '-');
        SetTexto('#modalDominio', '-', '-');
        SetTexto('#modalFecha', '-', '-');
        SetTexto('#modalTipoSiniestro', '-', '-');
        SetTexto('#modalObservaciones', '-', '-');
        RenderAdjuntosModal(null);
        return;
    }

    const recorrido = ObtenerCampo(siniestro, ['recorrido', 'Recorrido'], '-');
    const dominio = ObtenerCampo(siniestro, ['patente', 'Patente'], '-');
    const transportista = ObtenerCampo(siniestro, ['nombreChofer', 'NombreChofer'], '-');
    const centro = ObtenerCampo(siniestro, ['centro', 'Centro'], '-');
    const vehiculo = ObtenerCampo(siniestro, ['vehiculo', 'Vehiculo'], '-');
    const fechaRaw = ObtenerCampo(siniestro, ['fecha_sys', 'Fecha_sys'], null);
    const fecha = fechaRaw ? FormatearFecha(fechaRaw) : '-';
    const tipoSiniestro = ObtenerCampo(siniestro, ['descripcionSiniestro', 'DescripcionSiniestro'], '-');
    const observaciones = ObtenerCampo(siniestro, ['observaciones', 'Observaciones'], '-');

    SetTexto('#modalRecorrido', recorrido, '-');
    SetTexto('#modalDominioHeader', dominio, '-');
    SetTexto('#modalTransportista', transportista, '-');
    SetTexto('#modalCentro', centro, '-');
    SetTexto('#modalVehiculo', vehiculo, '-');
    SetTexto('#modalDominio', dominio, '-');
    SetTexto('#modalFecha', fecha, '-');
    SetTexto('#modalTipoSiniestro', tipoSiniestro, '-');
    SetTexto('#modalObservaciones', observaciones, '-');

    RenderAdjuntosModal(siniestro);
}

function AbrirModalSiniestro(siniestro) {
    selectedSiniestro = siniestro || null;
    CargarDetalleModal(selectedSiniestro);

    const modalElement = document.getElementById('modalSiniestro');
    if (!modalElement) {
        return;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}


$(function () {

    InitializeControls();

});

function InitializeControls() {

    var redirect = 1;
    if (typeof perfilUsuario !== 'undefined' && perfilUsuario !== null && perfilUsuario !== '') {
        var perfil = typeof perfilUsuario === 'string' ? JSON.parse(perfilUsuario) : perfilUsuario;

        perfil.Permisos.forEach(function (permiso) {
            if (permiso.IdPermiso === "SINIESTROS") { redirect = 0; }
        });
    }

    if (redirect === 1) {
        window.location.href = '/Home';
        return;
    }

    $(document).on('click', '#btnToggleFiltros', function (e) {
        e.preventDefault();

        const $filtros = $('#filtrosSiniestros');
        const visible = $filtros.is(':visible');
        $filtros.slideToggle(180);
        $(this).toggleClass('active', !visible);
    });

    $('#title-page').html('Siniestros');
    ActivateMenu('Menu_Siniestros');
    InicializarCalendarios();


    $('#logo_add_button').on('click', function () {
        AbrirModalSiniestro(null);
    });

    $(document).on('click', '.btn-ver-siniestro', function (e) {
        e.preventDefault();

        const index = parseInt($(this).attr('data-siniestro-index'), 10);
        const siniestro = Number.isNaN(index) ? null : siniestrosData[index];

        AbrirModalSiniestro(siniestro);
    });

    $(document).on('click', '.clear-input', function () {
        const selector = $(this).attr('data-target');
        if (!selector) {
            return;
        }

        LimpiarFiltroPorSelector(selector);
        ActualizarChipsFiltros();
    });

    // Use mousedown so it fires before input blur/change; avoids needing a second click.
    $(document).on('mousedown', '.filter-chip-remove', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const selector = $(this).attr('data-target');
        if (!selector) {
            return;
        }

        LimpiarFiltroPorSelector(selector);
        ActualizarChipsFiltros();
        EjecutarBusquedaSiniestrosActual();
    });

    $('#btnLimpiarFiltros').on('click', function () {
        LimpiarFiltroPorSelector('#txtFechaDesde');
        LimpiarFiltroPorSelector('#txtFechaHasta');
        LimpiarFiltroPorSelector('#txtFiltroRecorrido');
        LimpiarFiltroPorSelector('#txtFiltroDominio');

        ActualizarChipsFiltros();
        $('#filtrosSiniestros').slideUp(180);
        $('#btnToggleFiltros').removeClass('active');

        CargarSiniestros(null, null, 0, '');
    });

    $('#txtFechaDesde, #txtFechaHasta, #txtFiltroRecorrido, #txtFiltroDominio').on('change keyup', function () {
        ActualizarChipsFiltros();
    });

    const fechaDesde = ObtenerFechaFiltro('#txtFechaDesde');
    const fechaHasta = ObtenerFechaFiltro('#txtFechaHasta');
    const recorrido = parseInt($('#txtFiltroRecorrido').val(), 10) || 0;

    $('#btnBuscar').on('click', function () {
        ActualizarChipsFiltros();
        EjecutarBusquedaSiniestrosActual();
    })



    CargarSiniestros(fechaDesde,fechaHasta,recorrido,'');
}



// Funciones de la pagina
function CargarSiniestros(fechadesde,fechahasta, recorrido, dominio) {
    const $tbody = $('#SiniestrosTableBody');

    $tbody.html(`
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        Cargando siniestros...
                    </td>
                </tr>
            `);

    //var hoy = new Date();
    //var fechaActual = hoy.getFullYear() + '-'
    //    + String(hoy.getMonth() + 1).padStart(2, '0') + '-'
    //    + String(hoy.getDate()).padStart(2, '0');

    $.ajax({
        url: '/api/Siniestros/ObtenerSiniestros',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({
            fechadesde: fechadesde,
            fechahasta: fechahasta,
            recorrido: recorrido,
            dominio : dominio
        })
    })
        .done(function (siniestros) {
            siniestrosOriginalData = Array.isArray(siniestros) ? siniestros : [];
            siniestrosData = siniestrosOriginalData.slice();
            currentPage = 1;

            RenderSiniestrosPage();
        })
        .fail(function () {
            siniestrosOriginalData = [];
            siniestrosData = [];
            currentPage = 1;
            $tbody.html(`
                        <tr>
                            <td colspan="5" class="text-center py-4 text-danger">
                                No se pudieron cargar los siniestros.
                            </td>
                        </tr>
                    `);

            $('#logosPagination').empty();
            $('#logosPaginationInfo').text('');
            
        });
}

function RenderSiniestrosPage() {
    const $tbody = $('#SiniestrosTableBody');

    if (!Array.isArray(siniestrosData) || siniestrosData.length === 0) {
        $tbody.html(`
                    <tr>
                        <td colspan="5" class="text-center py-4 text-muted">
                            No se encontraron siniestros para los filtros aplicados.
                        </td>
                    </tr>
                `);

        $('#logosPagination').empty();
        $('#logosPaginationInfo').text('');
        return;
    }

    const totalPages = Math.ceil(siniestrosData.length / siniestrosPageSize);
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * siniestrosPageSize;
    const pageItems = siniestrosData.slice(startIndex, startIndex + siniestrosPageSize);

    $tbody.empty();

    pageItems.forEach(function (siniestro, itemIndex) {
        const dataIndex = startIndex + itemIndex;
        const recorrido = siniestro.recorrido ?? siniestro.Recorrido ?? '-';
        const tipo = siniestro.descripcionSiniestro ?? siniestro.DescripcionSiniestro ?? '-';
        const dominio = siniestro.patente ?? siniestro.Patente ?? '-';
        const transportista = siniestro.nombreChofer ?? siniestro.NombreChofer ?? '-';
        const fecha = siniestro.fecha_sys ?? siniestro.Fecha_sys ?? null;
        const fechaTexto = fecha ? FormatearFecha(fecha) : '-';

        const $tr = $('<tr></tr>');
        $tr.append($('<td></td>').text(recorrido));
        $tr.append($('<td></td>').text(tipo));
        $tr.append($('<td></td>').text(dominio));
        $tr.append($('<td></td>').text(transportista));
        $tr.append($('<td></td>').text(fechaTexto));
        $tr.append($("<td class='text-center'></td>").append(
            $("<button type='button' class='btn btn-sm btn-outline-primary btn-ver-siniestro' title='Ver siniestro' aria-label='Ver siniestro'></button>")
                .attr('data-siniestro-index', dataIndex)
                .append("<i class='bi bi-eye'></i>")
        ));
        $tbody.append($tr);
    });

    RenderSiniestrosPagination();
}

function RenderSiniestrosPagination() {
    const $pagination = $('#logosPagination');
    const $paginationInfo = $('#logosPaginationInfo');

    if (!Array.isArray(siniestrosData) || siniestrosData.length === 0) {
        $pagination.empty();
        $paginationInfo.text('');
        return;
    }

    const totalPages = Math.ceil(siniestrosData.length / siniestrosPageSize);
    const startItem = ((currentPage - 1) * siniestrosPageSize) + 1;
    const endItem = Math.min(currentPage * siniestrosPageSize, siniestrosData.length);

    $paginationInfo.text(`Mostrando ${startItem}-${endItem} de ${siniestrosData.length} registros`);

    const visiblePages = BuildVisiblePages(totalPages, currentPage);
    const items = [];

    items.push(`
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
                </li>
            `);

    let previousPage = null;
    visiblePages.forEach(function (page) {
        if (previousPage !== null && page - previousPage > 1) {
            items.push(`
                        <li class="page-item disabled">
                            <span class="page-link">...</span>
                        </li>
                    `);
        }

        items.push(`
                    <li class="page-item ${page === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${page}">${page}</a>
                    </li>
                `);

        previousPage = page;
    });

    items.push(`
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
                </li>
            `);

    $pagination.html(items.join(''));

    $pagination.find('a[data-page]').on('click', function (e) {
        e.preventDefault();

        const nextPage = parseInt($(this).data('page'), 10);
        if (Number.isNaN(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
            return;
        }

        currentPage = nextPage;
        RenderSiniestrosPage();
    });
}

function BuildVisiblePages(totalPages, page) {
    const pages = new Set();

    for (let i = 1; i <= Math.min(3, totalPages); i++) {
        pages.add(i);
    }

    for (let i = Math.max(totalPages - 2, 1); i <= totalPages; i++) {
        pages.add(i);
    }

    for (let i = page - 1; i <= page + 1; i++) {
        if (i >= 1 && i <= totalPages) {
            pages.add(i);
        }
    }

    return Array.from(pages).sort(function (a, b) {
        return a - b;
    });
}

function FormatearFecha(fecha) {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('es-AR');
}

function InicializarCalendarios() {
    const hoy = new Date();
    const fechaDesde120Dias = new Date(hoy);
    fechaDesde120Dias.setDate(hoy.getDate() - 120);

    const opciones = {
        locale: 'es',
        dateFormat: 'd/m/Y',
        allowInput: false,
        disableMobile: true
    };

    flatpickr('#txtFechaDesde', $.extend({}, opciones, { defaultDate: fechaDesde120Dias }));
    flatpickr('#txtFechaHasta', $.extend({}, opciones, { defaultDate: hoy }));

    fechaDesdeDefault = ObtenerTextoFechaFiltro('#txtFechaDesde');
    fechaHastaDefault = ObtenerTextoFechaFiltro('#txtFechaHasta');
}

function ObtenerFechaFiltro(selector) {
    const picker = document.querySelector(selector)._flatpickr;

    if (!picker || picker.selectedDates.length === 0) {
        return null;
    }

    const fecha = picker.selectedDates[0];

    return fecha.getFullYear() + '-'
        + String(fecha.getMonth() + 1).padStart(2, '0') + '-'
        + String(fecha.getDate()).padStart(2, '0');
}
