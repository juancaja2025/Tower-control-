var changePasswordModal;

function CloseSidebarSubmenus() {
    $('#Submenu-Configuracion').hide();
    $('#Submenu-Recorrido').stop(true, true).hide();
    $('#Submenu-Ayuda').stop(true, true).hide();

    $('#Menu_Configuracion .material-symbols-outlined').last().text('expand_more');
    $('#Menu_Recorrido .material-symbols-outlined').last().text('expand_more');
    $('#Menu_Ayuda .expand-icon').text('expand_more');
}

function RestoreActiveSidebarSubmenu() {
    const $activeSubmenuItem = $('#sidebar .sidebar-submenu a.active').first();

    if ($activeSubmenuItem.length === 0) {
        return;
    }

    const $submenu = $activeSubmenuItem.closest('.sidebar-submenu');
    const submenuId = $submenu.attr('id');

    if (submenuId === 'Submenu-Configuracion') {
        $submenu.show();
        $('#Menu_Configuracion').addClass('submenu-parent-active');
        $('#Menu_Configuracion .material-symbols-outlined').last().text('expand_less');
        return;
    }

    if (submenuId === 'Submenu-Recorrido') {
        $submenu.stop(true, true).show();
        $('#Menu_Recorrido').addClass('submenu-parent-active');
        $('#Menu_Recorrido .material-symbols-outlined').last().text('expand_less');
        return;
    }

    if (submenuId === 'Submenu-Ayuda') {
        $submenu.stop(true, true).show();
        $('#Menu_Ayuda').addClass('submenu-parent-active');
        $('#Menu_Ayuda .expand-icon').text('expand_less');
    }
}

function ExpandSidebarAndShowSubmenu(menuSelector, submenuSelector, iconSelector) {
    const $sidebar = $('#sidebar');
    const $menu = $(menuSelector);
    const $submenu = $(submenuSelector);

    $sidebar.addClass('expanded');
    CloseSidebarSubmenus();

    $('#Menu_Configuracion, #Menu_Recorrido, #Menu_Ayuda').removeClass('submenu-parent-active');
    $menu.addClass('submenu-parent-active');

    if ($submenu.attr('id') === 'Submenu-Configuracion') {
        $submenu.show();
    } else {
        $submenu.stop(true, true).show();
    }

    if (iconSelector) {
        $menu.find(iconSelector).last().text('expand_less');
    }
}

function ExpandSidebarForMenuElement($menu) {
    const $submenu = $menu.next('.sidebar-submenu');
    if ($submenu.length === 0) {
        return false;
    }

    const iconSelector = $menu.find('.expand-icon').length > 0
        ? '.expand-icon'
        : '.material-symbols-outlined';

    ExpandSidebarAndShowSubmenu('#' + $menu.attr('id'), '#' + $submenu.attr('id'), iconSelector);
    return true;
}


$(function () {

    if (typeof perfilUsuario !== 'undefined' && perfilUsuario != null && perfilUsuario !== '') {
        try {
            var perfil = JSON.parse(perfilUsuario);
        } catch (e) {
            console.error('Error al parsear perfilUsuario:', e);
            var perfil = null;
        }
    } else {
        var perfil = null;
    }
    // Toggle sidebar
    $('#toggle-sidebar').on('click', function () {
        $('#sidebar').toggleClass('expanded');

        if (!$('#sidebar').hasClass('expanded')) {
            CloseSidebarSubmenus();
        } else {
            RestoreActiveSidebarSubmenu();
        }
    });

    // Si el sidebar esta colapsado y el menu tiene submenu, al primer click expande y abre ese submenu.
    $('#sidebar .list-group > a.list-group-item').on('click', function (event) {
        if ($('#sidebar').hasClass('expanded')) {
            return;
        }

        const $menu = $(this);
        const expanded = ExpandSidebarForMenuElement($menu);
        if (expanded) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    });

    // Toggle submenu de configuración
    $('#Menu_Configuracion').on('click', function (event) {
        event.preventDefault(); // evitar navegación

        if (!$('#sidebar').hasClass('expanded')) {
            ExpandSidebarAndShowSubmenu('#Menu_Configuracion', '#Submenu-Configuracion', '.material-symbols-outlined');
            return;
        }

        const $submenu = $('#Submenu-Configuracion');
        const $icon = $(this).find('.material-symbols-outlined').last();

        $submenu.toggle();
        $(this).toggleClass('submenu-parent-active', $submenu.is(':visible'));
        $icon.text($submenu.is(':visible') ? 'expand_less' : 'expand_more');
    });

    // Toggle submenu de recorridos
    $('#Menu_Recorrido').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!$('#sidebar').hasClass('expanded')) {
            ExpandSidebarAndShowSubmenu('#Menu_Recorrido', '#Submenu-Recorrido', '.material-symbols-outlined');
            return;
        }

        $('#Submenu-Recorrido').stop(true, true).slideToggle(200);
        const icons = $(this).find('.material-symbols-outlined');
        const icon = icons.last();
        if (icon.text().trim() === 'expand_more') {
            icon.text('expand_less');
            $(this).addClass('submenu-parent-active');
        } else {
            icon.text('expand_more');
            $(this).removeClass('submenu-parent-active');
        }
    });

    $('#profile-menu').on('click', function (event) {
        event.stopPropagation();
        $('#subprofile-menu').toggle();
    });

    // Cerrar menú si se hace clic fuera
    $(document).on('click', function () {
        $('#subprofile-menu').hide();
    });

    //$('#Menu_Ayuda').on('click', function (event) {

    //    event.preventDefault();

    //    $('#Submenu-Ayuda').slideToggle(200);

    //    $(this).find('.expand-icon').toggleClass('rotate');
    //});
    $('#Menu_Ayuda').on('click', function (event) {

        event.preventDefault();

        if (!$('#sidebar').hasClass('expanded')) {
            ExpandSidebarAndShowSubmenu('#Menu_Ayuda', '#Submenu-Ayuda', '.expand-icon');
            return;
        }

        $('#Submenu-Ayuda').stop(true, true).slideToggle(200);

        const icon = $(this).find('.expand-icon');

        if (icon.text().trim() === 'expand_more') {
            icon.text('expand_less');
            $(this).addClass('submenu-parent-active');
        } else {
            icon.text('expand_more');
            $(this).removeClass('submenu-parent-active');
        }
    });

    $('#btnConfirmChangePassword').prop('disabled', true);

    $('#change_new_password').on('change',function () {
        let pass = $('#change_new_password').val();
        let conf = $('#change_confirm_password').val();
        if (pass == conf) {
            $('#change_new_password').removeClass('is-invalid');
            $('#change_confirm_password').removeClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', false);
        } else {
            $('#change_new_password').addClass('is-invalid');
            $('#change_confirm_password').addClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', true);

        }
    });

    $('#change_new_password').blur(function () {
        let pass = $('#change_new_password').val();
        let conf = $('#change_confirm_password').val();
        if (pass == conf) {
            $('#change_new_password').removeClass('is-invalid');
            $('#change_confirm_password').removeClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', false);
        } else {
            $('#change_new_password').addClass('is-invalid');
            $('#change_confirm_password').addClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', true);

        }
    });

    $('#change_confirm_password').on('change',function () {
        let pass = $('#change_new_password').val();
        let conf = $('#change_confirm_password').val();
        if (pass == conf) {
            $('#change_new_password').removeClass('is-invalid');
            $('#change_confirm_password').removeClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', false);
        } else {
            $('#change_new_password').addClass('is-invalid');
            $('#change_confirm_password').addClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', true);

        }
    });

    $('#change_confirm_password').blur(function () {
        let pass = $('#change_new_password').val();
        let conf = $('#change_confirm_password').val();
        if (pass == conf) {
            $('#change_new_password').removeClass('is-invalid');
            $('#change_confirm_password').removeClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', false);
        } else {
            $('#change_new_password').addClass('is-invalid');
            $('#change_confirm_password').addClass('is-invalid');
            $('#btnConfirmChangePassword').prop('disabled', true);

        }
    });

    $('#site_togglePassword').on('click', function () {
        var input = $('#change_new_password');
        var type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);

        // Cambiar icono
        //$(this).text(type === 'password' ? '👁️' : '🙈');
    });
    $('#site_toggleConfirmPassword').on('click', function () {
        var input = $('#change_confirm_password');
        var type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);

        // Cambiar icono
        //$(this).text(type === 'password' ? '👁️' : '🙈');
    });




    $('#btnConfirmChangePassword').on('click', function () {

        //alert("cambiando clave de " + perfil.Usuario.Nombre);
        var newPassword = $('#change_new_password').val();
        var confirmPassword = $('#change_confirm_password').val();

        var request = {
            Id: perfil.Usuario.Id,
            NewPassword: newPassword,
            ConfirmPassword: confirmPassword
        };
        if (newPassword !== '' && newPassword === confirmPassword) {

            // llamar al servicio para cambiar la clave
            $.ajax({
                url: '/Perfiles/ChangePasswordProfile',
                type: 'POST',
                contentType: 'application/json',
                accepts: 'application/json',
                data: JSON.stringify(request),
                dataType: 'json',
                success: function (data) {
                    if (data != "") {
                        if (data.status === 'OK')
                            showPopupTimer('popup_timer', data.message, 2);
                        else
                            showPopupTimer('popup_timer', 'Error: ' + data.message, 3);

                    }
                    changePasswordModal.hide();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    showOverlayMessage('block_screen', false);
                    showOverlay(false);
                    $('#resultado').html('Error al llamar al servidor' + jqXHR);
                }
            });
        }
    });

});

function OpenPasswordForm() {

    
    //$('#user_changePasswordForm').show();
    //alert('Cambio de clave');

    changePasswordModal = new bootstrap.Modal(document.getElementById('user_changePasswordForm'), {
        backdrop: 'static',
        keyboard: false
    });
    
    changePasswordModal.show();

}

function ChangePassword() {
    
}
/*
*   COLORES OCASA (PARA JS)
*/
 
const colorOCASA = {
    calipso: '#0099A8',// COLOR CALIPSO
    rojo   : '#EC2D30',// COLOR ROJO
    verde: '#0C9D61', // COLOR VERDE
    naranja:'#FEAF3E', // COLOR NARANJA
    calipsoClaro: '#0099A833', // 20% más claro COLOR CALIPSO
    rojoClaro: '#E8101033',  // 20% más claro COLOR ROJO
    verdeClaro: '#0C9D6133',   // 20% más claro COLOR VERDE
    naranjaClaro: '#FEAF3E33' // 20% más claro COLOR NARANJA
}; 

const SessionPerfil = 'SessionPerfil';