 // Script para la grilla de usuarios

function togglePasswordVisibility(ctr) {
    var passwordInput = $('#'+ctr);
    var passwordType = passwordInput.attr('type') === 'password' ? 'text' : 'password';
    passwordInput.attr('type', passwordType);
}
 
 
function togglePasswordVisibilityFalse(ctr) {
    var passwordInput = $('#' + ctr);
    var passwordType =  'password';
    passwordInput.attr('type', passwordType);
}

function confirmExit(title, message) {

    return window.confirm(title + "\n\n" + message);


}
function Acept() {
    ;
}
function Cancel() {
    ;
}



 

 
 
 
 
 


 
 


 