$(document).ready(function() {
    replaceNav();
    fillTags();
    $('#apply-filters').on('click', function(e) {
        e.preventDefault();
        var author = $('#authorSearch').val();
        var tags = $('#tagsSearch').val() || [];
        var sort = $('#sort').val();
        var sorting;
        switch(sort) {
            case 'По дате создания (сначала новые)':
                sorting = 'CreateDesc';
                break;
            case 'По дате создания (сначала старые)':
                sorting = 'CreateAsc';
                break;
            case 'По количеству лайков (по убыванию)':
                sorting = 'LikeDesc';
                break;
            case 'По количеству лайков (по возрастанию)':
                sorting = 'LikeAsc';
                break;
        }
        var readingTimeFrom = $('#readingTimeFrom').val();
        var readingTimeTo = $('#readingTimeTo').val();
        var myGroups = $('#myGroups').is(':checked');

        var queryParams = {
            author: author,
            tags: tags,
            sorting: sorting,
            min: readingTimeFrom,
            max: readingTimeTo,
            onlyMyCommunities: myGroups,
            page: 1,
            size: 5
        };

        $.ajax({
            url: 'https://blog.kreosoft.space/api/post',
            method: 'GET',
            contentType: 'application/json',
            data: queryParams,
            traditional: true,
            success: function(data){
                $.get('../html/postCard.html', function(cardPattern) {
                    var postsContainer = $('#postsCol');
                    postsContainer.empty();

                    $.each(data.posts, function(i, post) {
                        var createDate = post.createTime.split('T')[0].split('-').reverse().join('.');
                        var createTime = post.createTime.split('T')[1].split(':').slice(0, 2).join(":");
                        var communityRepr = post.communityName ? `в сообществе "${post.communityName}"` : "";
                        var postText = post.description.length > 560
                            ? `<span class="preview-text">${post.description.substring(0, 560)}...<br><a href="#" class="continue-read">Читать далее</a></span>
                      
                        <span class="full-text" style="display: none;">${post.description}<a href="#" class="hide-text">Скрыть</a></span>`
                            : post.description;
                        var imageTag = post.image ? `<img src="${post.image}" class="card-img-top">` : '';

                        var tagsRepr = post.tags.map(tag => `#${tag.name}`).join(' ');

                        var card = cardPattern.replace(/{{author}}/g, post.author)
                            .replace(/{{date}}/g, createDate)
                            .replace(/{{time}}/g, createTime)
                            .replace(/{{community}}/g, communityRepr)
                            .replace(/{{title}}/g, post.title)
                            .replace(/{{image}}/g, imageTag)
                            .replace(/{{text}}/g, postText)
                            .replace(/{{tags}}/g, tagsRepr)
                            .replace(/{{readingTime}}/g, post.readingTime)
                            .replace(/{{commentsCount}}/g, post.commentsCount)
                            .replace(/{{likes}}/g, post.likes);

                        postsContainer.append(card);
                    });
                });
            },
            error: function(xhr, status, error) {
                console.error("Ошибка при получении постов: ", status, error);
            }
        });

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
            if (xhr.status === 401){
                window.location.href = 'http://localhost/login';
            }
        }
    });
}

$(document).on('click', '.continue-read', function(e) {
    e.preventDefault();
    var cardText = $(this).closest('.card-text');
    cardText.find('.preview-text').hide();
    cardText.find('.full-text').show();
    //$(this).hide();
});

$(document).on('click', '.hide-text', function(e) {
    e.preventDefault();
    var cardText = $(this).closest('.card-text');
    cardText.find('.full-text').hide();
    cardText.find('.preview-text').show();

    //$(this).hide();
})

function  fillTags(){
    $.ajax({
        url: 'https://blog.kreosoft.space/api/tag',
        method: 'GET',
        contentType: 'application/json',
        success: function(response) {
            $.each(response, function(i, tag) {
                $('#tagsSearch').append(`<option value="${tag.id}">${tag.name}</option>`);
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка: ", status, error);
        }
    });
}