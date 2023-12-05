$(document).ready(function() {
    replaceNav();

    $.ajax({
        url: '../html/authorCard.html',
        method: 'GET',
        success: function(template) {
            $.ajax({
                url: 'https://blog.kreosoft.space/api/author/list',
                method: 'GET',
                success: function(authors) {
                    var authorsCopy = Array.from(authors);
                    authorsCopy.sort((a, b) => {
                        if (b.posts === a.posts) {
                            return b.likes - a.likes;
                        }
                        return b.posts - a.posts;
                    });

                    authors.forEach(function(author, index) {
                        if (author.fullName === authorsCopy[0].fullName) {
                            crownPath = '../assets/yellow_crown.png';
                        } else if (author.fullName === authorsCopy[1].fullName) {
                            crownPath = '../assets/gray_crown.png';
                        } else if (author.fullName === authorsCopy[2].fullName) {
                            crownPath = '../assets/black_crown.png';
                        }
                        else{
                            crownPath = "";
                        }
                        var pngHtml = "";
                        if (crownPath){
                            pngHtml = `<img src="${crownPath}" class="position-absolute" style="width: 50px; top: -18px; right: -9px; transform: rotate(15deg);" alt="Корона">`
                            console.log("Есть корона");
                        }

                        var cardHtml = template
                            .replace('{{avatarPath}}', author.gender === 'Male' ? '../assets/man-usual.JPG' : '../assets/woman-usual.JPG')
                            .replace('{{pngHtml}}', pngHtml)
                            .replace('{{fullName}}', author.fullName)
                            .replace('{{createdDate}}', 'Создан: ' + new Date(author.created).toLocaleDateString())
                            .replace('{{birthDate}}', 'Дата рождения: ' + new Date(author.birthDate).toLocaleDateString())
                            .replace('{{postsText}}', 'Постов: ' + author.posts)
                            .replace('{{likesText}}', 'Лайков: ' + author.likes);

                        //if (!crownPath){

                        //}

                        var authorCard = $(cardHtml).click(function() {
                            window.location.href = 'http://localhost/?author=' + encodeURIComponent(author.fullName) + '&page=1&size=5';
                        });
                        $('.author-container').append(authorCard);
                    });

                },
                error: function(error) {
                    console.error("Ошибка при получении списка авторов: ", error);
                }
            });
        },
        error: function(error) {
            console.error("Ошибка при загрузке шаблона карточки автора: ", error);
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