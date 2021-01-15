function checkPassword() {
    var password = $('#password').val();
    var password2 = $('#password_second').val();
    console.log(password);
    console.log(password2);
    if (password === password2 && password !== "" && password) {
        const element = $('#passwordCorrect').css("color", "green");
        // console.log(element);
        element.innerHTML = "Passwörter stimmen überein!";
        // element.style.color = 'green';
        document.getElementById("submit").removeAttribute("disabled")
    } else {
        const element = $("#passwordCorrect").css("color", "red");
        // console.log(element);
        element.innerHTML = "Passwörter stimmen nicht überein!";
        // element.style.color = 'red';
        document.getElementById("submit").setAttribute("disabled", true)
    }
}

$(document).ready(function () {
    $('#password').on('input', function () {
        checkPassword();
    });
    $('#password_second').on('input', function () {
        checkPassword();
    })
})

