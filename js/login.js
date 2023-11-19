$(document).ready(function() {
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
                localStorage.setItem('authToken', token);


                var userDropdown = `
                    <li class="nav-item dropdown">
                      <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        ${email}
                      </a>
                      <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="../html/profile.html">Профиль</a>
                        <a class="dropdown-item" href="#" id="logoutButton">Выход</a>
                      </div>
                    </li>
                  `;

                $('.navbar-nav.ml-auto').html(userDropdown);


                $('#logoutButton').on('click', function() {
                    localStorage.removeItem('authToken');
                    location.reload();
                });
            },
            error: function(xhr, status, error) {
                alert("Ошибка!");
            }
        });
    });
    $('#registerButton').on('click', function() {
        var email = $('#inputEmail').val();
        var password = $('#inputPassword').val();


        localStorage.setItem('emailForRegistration', email);
        localStorage.setItem('passwordForRegistration', password);

        window.location.href = '../html/registration.html';
    });

});