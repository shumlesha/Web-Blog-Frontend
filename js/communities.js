$(document).ready(function() {
    replaceNav();
    $.ajax({
        url: 'https://blog.kreosoft.space/api/community',
        method: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
        },
        success: function(response) {
            $.get('../html/communityRowCard.html', function(cardPattern) {
                var communityContainer = $('.community-container');
                communityContainer.empty();

                $.each(response, function(i, community) {
                    var card = $(cardPattern.replace(/{{name}}/g, community.name).replace(/{{id}}/g, community.id));
                    console.log(community.id);

                    checkRole(community.id, card, function() {
                        communityContainer.append(card);
                    });
                });
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
        }
    });

})


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
            if (xhr.status === 401){
                window.location.href = 'http://localhost/login';
            }
        }
    });
}

function checkRole(communityId, card, callback) {
    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${communityId}/role`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
        },
        success: function(role) {
            if (role !== "Administrator") {
                var buttonTemplateUrl = role === null ? '../html/subButton.html' : '../html/unsubButton.html';
                $.get(buttonTemplateUrl, function(buttonPattern) {
                    var buttonRepr = buttonPattern.replace(/{{id}}/g, communityId);
                    console.log(buttonRepr);
                    card.append(buttonRepr);
                    callback();
                });
            } else {
                callback();
            }
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
        }
    });
}

$(document).on('click', '.subscribe-btn', function(e) {
    var communityId = $(this).data('community-id');
    console.log('Подписка на ' + communityId);

    var button = $(this);

    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${communityId}/subscribe`,
        method: 'POST',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
        },
        contentType: 'application/json',
        success: function(response) {
            var card = button.parent();
            button.remove();

            var buttonTemplateUrl = '../html/unsubButton.html';
            $.get(buttonTemplateUrl, function(buttonPattern) {
                var buttonRepr = buttonPattern.replace(/{{id}}/g, communityId);
                $(card).append(buttonRepr);
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка подписки: ", status, error);
        }
    });
});

$(document).on('click', '.unsubscribe-btn', function(e) {
    var communityId = $(this).data('community-id');
    console.log('Подписка на ' + communityId);

    var button = $(this);

    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${communityId}/unsubscribe`,
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
        },
        contentType: 'application/json',
        success: function(response) {
            var card = button.parent();
            button.remove();

            var buttonTemplateUrl = '../html/subButton.html';
            $.get(buttonTemplateUrl, function(buttonPattern) {
                var buttonRepr = buttonPattern.replace(/{{id}}/g, communityId);

                $(card).append(buttonRepr);
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка подписки: ", status, error);
        }
    });
});