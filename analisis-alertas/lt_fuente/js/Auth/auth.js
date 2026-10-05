
let redirect = 0;

// Ejecuta el guard de URL apenas se carga el script.
ImmediateRouteGuard();

$(function () {

    InitializeAuthControls();

});

function InitializeAuthControls() {

    HideAllMenus();

    var redirect = 0;
    var perfil = ParsePerfilUsuario(perfilUsuario);
    var permisosUsuario = [];

    if (perfil !== null && perfil.Permisos !== undefined && Array.isArray(perfil.Permisos)) {
        permisosUsuario = perfil.Permisos;

        perfil.Permisos.forEach(function (permiso) {

            if (permiso.IdPermiso === "ABMTRANSPORTISTA") {
                $('#Menu_Configuracion').show();
                $('#Menu_Usuario').show();
            }
            if (permiso.IdPermiso === "CONFIGURACION") { $('#Menu_Configuracion').show(); }
            if (permiso.IdPermiso === "USUARIO") { $('#Menu_Perfil').show(); }
            if (permiso.IdPermiso === "CONFIGURACION") { $('#Menu_ABMLogos').show(); }
            if (permiso.IdPermiso === "DASHBOARD") { $('#Menu_Dashboard').show(); redirect = 1; }
            if (permiso.IdPermiso === "RECORRIDO") {
                $('#Menu_Recorrido').show();
                $('#Menu_RecorridoIndex').show();
                $('#Menu_RecorridoHistoricos').show();
            }
            if (permiso.IdPermiso === "REPLANIFICARRECORRIDO") {
                $('#Menu_Recorrido').show();
                $('#Menu_RecorridoHistorico').show();
            }
            if (permiso.IdPermiso === "PARTESMECANICAS") { $('#Menu_PartesMecanicas').show(); }
            if (permiso.IdPermiso === "SINIESTROS") { $('#Menu_Siniestros').show(); }
                
        });

    }

    ValidateCurrentRouteAccess(permisosUsuario);

    $('#Menu_Ayuda').show();
    
}

function ImmediateRouteGuard() {
    var perfil = ParsePerfilUsuario(perfilUsuario);
    var permisosUsuario = [];

    if (perfil !== null && perfil.Permisos !== undefined && Array.isArray(perfil.Permisos)) {
        permisosUsuario = perfil.Permisos;
    }

    ValidateCurrentRouteAccess(permisosUsuario);
}

function ParsePerfilUsuario(rawPerfil) {
    if (rawPerfil === undefined || rawPerfil === null || rawPerfil === '') {
        return null;
    }

    try {
        var parsed = rawPerfil;

        if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }

        // Algunos layouts envian SessionPerfil serializado como string JSON dentro de otro JSON.
        if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }

        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    }
    catch (e) {
        return null;
    }

    return null;
}

function ValidateCurrentRouteAccess(permisosUsuario) {
    var path = NormalizePath(window.location.pathname || '');
    var requiredPermission = GetRequiredPermissionByPath(path);

    if (!requiredPermission) {
        return;
    }

    if (!HasPermission(permisosUsuario, requiredPermission)) {
        window.location.href = '/Home/Index';
    }
}

function NormalizePath(path) {
    var normalized = (path || '').toLowerCase().trim();

    if (!normalized) {
        return '/';
    }

    if (normalized.charAt(0) !== '/') {
        normalized = '/' + normalized;
    }

    // Quita slash final salvo root.
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

function GetRequiredPermissionByPath(path) {
    if (!path) {
        return null;
    }

    if (StartsWithAny(path, ['/dashboard'])) {
        return 'DASHBOARD';
    }

    if (StartsWithAny(path, [
        '/recorrido',
        '/recorridohistorico',
        '/recorridoreplanificar',
        '/api/recorrido',
        '/api/recorridohistorico',
        '/api/recorridoplanificar'
    ])) {
        return 'RECORRIDO';
    }

    if (StartsWithAny(path, ['/perfiles'])) {
        return 'USUARIO';
    }

    if (StartsWithAny(path, [
        '/usuario',
        '/altavehiculo',
        '/mantenimiento',
        '/chofer',
        '/api/vehiculos',
        '/api/mantenimiento'
    ])) {
        return 'ABMTRANSPORTISTA';
    }

    if (StartsWithAny(path, ['/logos', '/api/logos'])) {
        return 'CONFIGURACION';
    }

    if (StartsWithAny(path, ['/partesmecanicas', '/api/partesmecanicas'])) {
        return 'PARTESMECANICAS';
    }

    if (StartsWithAny(path, ['/siniestros'])) {
        return 'SINIESTROS';
    }

    return null;
}

function StartsWithAny(path, prefixes) {
    return prefixes.some(function (prefix) {
        if (path === prefix) {
            return true;
        }

        return path.startsWith(prefix + '/');
    });
}

function HasPermission(permisosUsuario, permissionId) {
    if (!Array.isArray(permisosUsuario) || !permissionId) {
        return false;
    }

    var permissionIdNormalized = permissionId.toUpperCase();

    return permisosUsuario.some(function (permiso) {
        if (!permiso || permiso.IdPermiso === undefined || permiso.IdPermiso === null) {
            return false;
        }

        return permiso.IdPermiso.toString().trim().toUpperCase() === permissionIdNormalized;
    });
}

function HideAllMenus() {
    $('#Menu_Usuario').hide();
    $('#Menu_Configuracion').hide();
    $('#Menu_Perfil').hide();
    $('#Menu_ABMLogos').hide();
    $('#Menu_Dashboard').hide();
    $('#Menu_Recorrido').hide();
    $('#Menu_RecorridoIndex').hide();
    $('#Menu_RecorridoHistorico').hide();
    $('#Menu_RecorridoHistoricos').hide();
    $('#Menu_Siniestros').hide();
    $('#Menu_PartesMecanicas').hide();
    $('#Menu_Ayuda').hide();
}
