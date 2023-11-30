$(document).ready(function() {
    replaceNav();
    $('form').on('submit', function(e) {
        e.preventDefault();
        var email = $('#inputEmail').val();
        var password = $('#inputPassword').val();

        $.ajax({
            type: 'POST',
            url: 'https://blog.kreosoft.space/api/account/login',
            contentType: 'application/json',
            data: JSON.stringify({
                "email": email,
                "password": password
            }),
            success: function(response) {
                var token = response.token;
                localStorage.setItem('bearerToken', token);


                var userDropdown = `
                    <li class="nav-item dropdown">
                      <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        ${email}
                      </a>
                      <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="http://localhost/profile">Профиль</a>
                        <a class="dropdown-item" href="#" id="logoutButton">Выход</a>
                      </div>
                    </li>
                  `;

                $('.navbar-nav.ml-auto').html(userDropdown);
                $('.form-control').removeClass('is-invalid');
                $('.invalid-feedback').empty();

                $('#logoutButton').on('click', function() {
                    localStorage.removeItem('bearerToken');
                    location.reload();
                });
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
                //alert(errorText);
                if (errorText.indexOf("Login failed") > -1) {
                    $('.form-control').removeClass('is-invalid');
                    $('.invalid-feedback').empty();
                    $('#inputEmail').addClass('is-invalid');
                    $('#inputEmail').next('.invalid-feedback').text('Неверный email');
                    $('#inputPassword').addClass('is-invalid');
                    $('#inputPassword').next('.invalid-feedback').text('Неверный пароль');
                }

            }
        });
    });
    $('#registerButton').on('click', function() {
        window.location.href = 'http://localhost/registration';
    });

});

function replaceNav() {
    if (localStorage.getItem('bearerToken')) {
        getEmail(function(email) {
            var userDropdown = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        ${email}
                    </a>
                    <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="http://localhost/profile">Профиль</a>
                        <a class="dropdown-item" href="http://localhost/login" id="logoutButton">Выход</a>
                    </div>
                </li>
            `;

            $('.navbar-nav.ml-auto').html(userDropdown);
            $('#logoutButton').on('click', function() {
                localStorage.removeItem('bearerToken');
                location.reload();
            });
        });
    }
}

function getEmail(callback) {
    $.ajax({
        url: 'https://blog.kreosoft.space/api/account/profile',
        method: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
        },
        success: function(response) {
            //console.log(response.email);
            callback(response.email);
        },
        error: function(xhr, status, error) {
            if (xhr.status === 401) {
                localStorage.removeItem('bearerToken');
                location.reload();
            }
            callback("");
        }
    });
}