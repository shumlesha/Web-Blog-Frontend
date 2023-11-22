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
                localStorage.setItem('bearerToken', token);

            },
            error: function(xhr, status, error) {
                var toJson = JSON.parse(xhr.responseText);
                if (toJson.errors) {
                    toJson = toJson.errors;
                }

                var errorText = Object.keys(toJson).map(function (key) {
                    var errors = toJson[key];
                    //return key + ": " + errors.join(", ");
                    if (errors == null){
                        return "";
                    }
                    else {
                        if (Array.isArray(errors)) {
                            return `key: ${errors.join(", ")}`;
                        }
                        else{
                            return `key: ${errors}`;
                        }

                    }
                }).join("\n").trim();
                alert(errorText);
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