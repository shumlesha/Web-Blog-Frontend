var path = window.location.pathname;
var pathParts = path.trim().split('/');
var commId = pathParts[pathParts.length - 1];
$(document).ready(function() {
    replaceNav();
    fillTags();
    fillHeadBlock(commId);
    ParsePosts(parseUrlOptions());
    $('#apply-filters').on('click', function(e) {
        e.preventDefault();
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

        var queryParams = {
            tags: tags,
            sorting: sorting,
            page: 1,
            size: 5
        };

        ParsePosts(queryParams);

    });
    $('#postsCol').on('click', '.like-icon', function() {
        if (!localStorage.getItem('bearerToken')){
            alert('Нельзя ставить лайк, авторизуйтесь');
            return false;
        }
        //console.log("Clicked");
        var postId = $(this).closest('.like-section').data('post-id');
        var likeIcon = $(this);
        var isLiked = likeIcon.hasClass('bi-heart-fill text-danger');

        if (isLiked) {
            $.ajax({
                url: `https://blog.kreosoft.space/api/post/${postId}/like`,
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
                },
                success: function() {
                    likeIcon.removeClass('bi-heart-fill text-danger').addClass('bi-heart');
                    getPostInfo(postId, function(likes, error) {
                        if (error) {
                            console.error(error);
                        } else {
                            likeIcon.siblings('.likes-count').text(likes);
                            //console.log(likes);
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error("Ошибка", status, error);
                }
            });
        } else {
            $.ajax({
                url: `https://blog.kreosoft.space/api/post/${postId}/like`,
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
                },
                success: function() {
                    likeIcon.removeClass('bi-heart').addClass('bi-heart-fill text-danger');
                    getPostInfo(postId, function(likes, error) {
                        if (error) {
                            console.error(error);
                        } else {
                            likeIcon.siblings('.likes-count').text(likes);
                            //console.log(likes);
                            console.log(likeIcon.siblings('.likes-count').text());
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.error("Ошибка", status, error);
                }
            });
        }
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

$('#numofPosts').change(function() {
    var queryParams = parseUrlOptions();
    queryParams.size = $(this).val();
    queryParams.page = 1;
    ParsePosts(queryParams);
});

$('.pagination a').click(function(e) {
    e.preventDefault();

    var queryParams = parseUrlOptions();
    var currentPage = queryParams.page || 1;
    //console.log(queryParams.tags);

    if ($(this).hasClass('prev')) {
        queryParams.page = Math.max(currentPage - 1, 1);
    }
    else if ($(this).hasClass('next')) {
        queryParams.page = Math.min(currentPage + 1, parseInt($('#totalPages').val()));
        //console.log(queryParams.page);
    }
    else if ($(this).hasClass('page-link')) {
        queryParams.page = $(this).data('page');

    }

    ParsePosts(queryParams);

    reBuildPagination(queryParams.page);

    var pagesCount = parseInt($('#totalPages').val());


    $('.pagination .page-item').removeClass('active');
    $('.pagination .page-item').each(function() {
        if (parseInt($(this).find('.page-link').data('page')) === queryParams.page) {
            $(this).addClass('active');
        }
    });
});

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

function ParsePosts(queryParams){
    history.pushState(null, '', `${location.pathname}?${$.param(queryParams)}`);
    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${commId}/post`,
        method: 'GET',
        contentType: 'application/json',
        data: queryParams,
        traditional: true,
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
        },
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
                        .replace(/{{likes}}/g, post.likes)
                        .replace(/{{postId}}/g, post.id)
                        .replace(/{{likeClass}}/g, post.hasLike===true ? 'bi bi-heart-fill text-danger' : 'bi bi-heart');

                    postsContainer.append(card);
                });
            });

            $('#totalPages').val(data.pagination.count.toString());
            reBuildPagination(parseInt(data.pagination.current));
        },
        error: function(xhr, status, error) {
            if (xhr.status === 403){
                $('#totalPages').val("1");
                reBuildPagination(parseInt(1));
            }
            console.error("Ошибка", status, error);
        }
    });
}

function parseUrlOptions() {
    var options = new URLSearchParams(window.location.search);
    return {
        tags: options.getAll('tags[]') || [],
        sorting: options.get('sorting') || 'CreateDesc',
        page: parseInt(options.get('page'), 10) || 1,
        size: parseInt(options.get('size'), 10) || 5
    };
}


function reBuildPagination(current){
    var pagesCount = parseInt($('#totalPages').val());

    var rangeSize = 3;
    var currentRangeStart = Math.floor((current - 1) / rangeSize) * rangeSize + 1;

    //console.log(currentRangeStart);
    $('.pagination .page-link').not('.prev, .next').each(function(index) {
        var pageNumber = currentRangeStart + index;
        $(this).data('page', pageNumber).text(pageNumber).parent().show();

        $(this).parent().toggleClass('active', pageNumber === current);
        $(this).parent().toggleClass('disabled', pageNumber > pagesCount);
    });

    $('.pagination .prev').parent().toggleClass('disabled', current <= 1);
    $('.pagination .next').parent().toggleClass('disabled', current >= pagesCount);

}

function getPostInfo(postId, callback) {
    $.ajax({
        url: `https://blog.kreosoft.space/api/post/${postId}`,
        method: 'GET',
        contentType: 'application/json',
        success: function(data) {
            callback(data.likes);
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
            callback(null, error);
        }
    });
}

function fillHeadBlock(commId) {
    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${commId}`,
        method: 'GET',
        contentType: 'application/json',
        success: function(commData) {
            $('.head-block-card').find('.card-title').text(`Сообщество "${commData.name}"`);
            $('#sub-count').text(`${commData.subscribersCount} подписчиков`);
            $('#access-type').text(commData.isClosed ? `закрытое` : 'открытое')
            $.get('../html/adminCard.html', function(cardPattern) {
                commData.administrators.forEach(function(admin) {
                    var cardHtml = cardPattern
                        .replace('{{avatarPath}}', admin.gender === 'Male' ? '../assets/man-usual.JPG' : '../assets/woman-usual.JPG')

                        .replace('{{fullName}}', admin.fullName);
                    $('.author-container').append(cardHtml);
                })
            })
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
        }
    });
    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${commId}/role`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
        },
        success: function(role) {
            loadOptionButtons(role);
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
        }
    });
}

async function loadOptionButtons(role) {
    if (role !== "Administrator") {
        const buttonTemplateUrl = role === null ? '../html/subButton.html' : '../html/unsubButton.html';
        const buttonPattern = await $.get(buttonTemplateUrl);
        const buttonRepr = buttonPattern.replace(/{{id}}/g, commId);
        console.log(buttonRepr);
        $('.buttons').append(buttonRepr);
    } else {
        const writePostButtonPattern = await $.get('../html/writePostButton.html');
        let buttonRepr = writePostButtonPattern.replace(/{{id}}/g, commId);
        $('.buttons').append(buttonRepr);

        const unsubButtonPattern = await $.get('../html/unsubButton.html');
        buttonRepr = unsubButtonPattern.replace(/{{id}}/g, commId).replace('unsubscribe-btn', 'unsubscribe-btn mb-1 ml-1');
        $('.buttons').append(buttonRepr);
    }
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
            updateSubs();
            var buttonTemplateUrl = '../html/unsubButton.html';
            $.get(buttonTemplateUrl, function(buttonPattern) {
                var buttonRepr = buttonPattern.replace(/{{id}}/g, communityId);
                $(card).append(buttonRepr);
            });
            location.reload();
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
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
            updateSubs();
            var buttonTemplateUrl = '../html/subButton.html';
            $.get(buttonTemplateUrl, function(buttonPattern) {
                var buttonRepr = buttonPattern.replace(/{{id}}/g, communityId);

                $(card).append(buttonRepr);
            });
            location.reload();
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
        }
    });
});

function updateSubs(){
    $.ajax({
        url: `https://blog.kreosoft.space/api/community/${commId}`,
        method: 'GET',
        contentType: 'application/json',
        success: function(commData) {
            $('#sub-count').text(`${commData.subscribersCount} подписчиков`);
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", status, error);
        }
    });
}

$(document).on('click', '.write-post', function(e) {
    localStorage.setItem( 'commId', commId );
})

$(document).on('click', '.bi-chat-left-text', function(e) {
    var postId = $(this).parent().parent().find('.like-section').data('post-id');
    console.log(postId);
    localStorage.setItem('scrollFlag', 'true');
    window.location.href = `http://localhost/post/${postId}`;
})