$(document).ready(function() {
    $('#inputPhone').mask('+7 (000) 000-00-00', {placeholder: "+7 (xxx) xxx-xx-xx"});
    fillCreds();
    $('#registrationForm').submit(function (event) {
        event.preventDefault();
        var formData = {
            fullName: $('#inputFullName').val(),
            birthDate: $('#inputBirthDate').val(),
            gender: $('#inputGender').val() === "male"? "Male": "Female",
            phoneNumber: $('#inputPhone').val(),
            email: $('#inputEmail').val(),
            password: $('#inputPassword').val()
        };
        $.ajax({
            type: 'POST',
            url: 'https://blog.kreosoft.space/api/account/register',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                var token = response.token;
                localStorage.setItem('authToken', token);

            },
            error: function(xhr, status, error) {
                alert("Ошибка!");
            }
        });
    });

});


function fillCreds() {
    var email = localStorage.getItem('emailForRegistration');
    var password = localStorage.getItem('passwordForRegistration');


    if (email && password) {
        $('#inputEmail').val(email);
        $('#inputPassword').val(password);
    }

    localStorage.removeItem('emailForRegistration');
    localStorage.removeItem('passwordForRegistration');
}