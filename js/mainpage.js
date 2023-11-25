$(document).ready(function() {
    replaceNav();
    fillTags();
    ParsePosts(parseUrlOptions());
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

        ParsePosts(queryParams);

    });
    $('#postsCol').on('click', '.like-icon', function() {
        //console.log("Clicked");
        var postId = $(this).closest('.like-section').data('post-id');
        var likeIcon = $(this);
        var isLiked = likeIcon.hasClass('bi-heart-fill');

        if (isLiked) {
            $.ajax({
                url: `https://blog.kreosoft.space/api/post/${postId}/like`,
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
                },
                success: function() {
                    likeIcon.removeClass('bi-heart-fill').addClass('bi-heart');
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
                    likeIcon.removeClass('bi-heart').addClass('bi-heart-fill');
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
        url: 'https://blog.kreosoft.space/api/post',
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
                        .replace(/{{likeClass}}/g, post.hasLike===true ? 'bi bi-heart-fill' : 'bi bi-heart');

                    postsContainer.append(card);
                });
            });

            $('#totalPages').val(data.pagination.count.toString());
            reBuildPagination(parseInt(data.pagination.current));
        },
        error: function(xhr, status, error) {
            console.error("Ошибка при получении постов: ", status, error);
        }
    });
}

function parseUrlOptions() {
    var options = new URLSearchParams(window.location.search);
    return {
        author: options.get('author') || '',
        tags: options.getAll('tags[]') || [],
        sorting: options.get('sorting') || 'CreateDesc',
        min: options.get('min') || '',
        max: options.get('max') || '',
        onlyMyCommunities: options.get('onlyMyCommunities') === 'true',
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
