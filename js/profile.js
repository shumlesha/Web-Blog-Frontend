$(document).ready(function() {
    fillFields();
    $('#profileForm').submit(function (event) {
        let formData = {
            email: $('#profileEmail').val(),
            fullName: $('#profileFullName').val(),
            phoneNumber: $('#profilePhone').val(),
            gender: $('#profileGender').val() === "male" ? "Male" : "Female",
            birthDate: $('#profileBirthDate').val()
        }
        $.ajax({
            type: 'PUT',
            url: 'https://blog.kreosoft.space/api/account/profile',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            success: function(response) {
            },
            error: function(xhr, status, error) {
                alert("Ошибка!");
            }
        });
    });

});


function fillFields() {
    $.ajax({
        url: 'https://blog.kreosoft.space/api/account/profile',
        method: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        success: function(response) {

            $('#profileEmail').val(response.email);
            $('#profileFullName').val(response.fullName);
            $('#profilePhone').val(response.phoneNumber);
            $('#profileGender').val(response.gender.toLowerCase());
            $('#profileBirthDate').val(response.birthDate.split('T')[0]);
            var userDropdown = `
                    <li class="nav-item dropdown">
                      <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        ${response.email}
                      </a>
                      <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item" href="../html/profile.html">Профиль</a>
                        <a class="dropdown-item" href="../html/login.html" id="logoutButton">Выход</a>
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
            console.error("Ошибка: ", status, error);
        }
    });

}