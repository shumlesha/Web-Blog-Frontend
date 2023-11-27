$(document).ready(function() {
    replaceNav();
    var path = window.location.pathname;
    var pathParts = path.trim().split('/');
    var postId = pathParts[pathParts.length - 1];
    console.log(postId);
    $.ajax({
        url: `https://blog.kreosoft.space/api/post/${postId}`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
        },
        success: function(post) {
            getAddressChain(post.addressId, function(fullAddress) {
                $.ajax({
                    url: '../html/postCardDetailed.html',
                    method: 'GET',
                    success: function (cardPattern) {
                        var postsContainer = $('#postsCol');
                        postsContainer.empty();

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
                            .replace(/{{likeClass}}/g, post.hasLike === true ? 'bi bi-heart-fill' : 'bi bi-heart')
                            .replace(/{{fullAddress}}/g, fullAddress !== "" ? `<div><i class="bi bi-geo-alt-fill"></i> ${fullAddress}</div>`: "");


                        postsContainer.append(card);


                    },
                    error: function (error) {
                        console.error("Ошибка при загрузке шаблона: ", error);

                    }
                });
            });
        },
        error: function(error) {
            console.error("Ошибка", error);
        }
    });
    parseComments(postId);
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
                    getPostLikes(postId, function(likes, error) {
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
                    getPostLikes(postId, function(likes, error) {
                        if (error) {
                            console.error(error);
                        } else {
                            likeIcon.siblings('.likes-count').text(likes);
                            //console.log(likes);
                            //console.log(likeIcon.siblings('.likes-count').text());
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

function getPostLikes(postId, callback) {
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

function getAddressChain(objectGuid, callback) {
    $.ajax({
        url: `https://blog.kreosoft.space/api/address/chain`,
        data: { objectGuid: objectGuid },
        method: 'GET',
        success: function(response) {
            var fullAddress = response.map(item => item.text).join(', ');
            callback(fullAddress);
        },
        error: function(error) {
            callback("");
        }
    });
}

function parseComments(postId) {
    $.ajax({
        url: `https://blog.kreosoft.space/api/post/${postId}`,
        method: 'GET',
        success: function(data) {
            $.get('../html/commentCard.html', function(template) {
                data.comments.forEach(function(comment) {
                    var commentReplaced = $(template.replace('{{author}}', comment.author)
                        .replace('{{content}}', comment.content)
                        .replace('{{date}}', new Date(comment.createTime).toLocaleDateString())
                        .replace('{{time}}', new Date(comment.createTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
                        .replace('{{id}}', comment.id));
                    if (comment.subComments > 0) {
                        commentReplaced.find('.replies-container').after('<a href="#" class="text-primary show-replies">Раскрыть ответы</a>');
                    }
                    $('#comments-block').append(commentReplaced);
                });
            });
        },
        error: function(error) {
            console.error("Ошибка", error);
        }
    });
}

function parseNestedComments(commentId, container){
    $.ajax({
        url: `https://blog.kreosoft.space/api/comment/${commentId}/tree`,
        method: 'GET',
        success: function(subComments) {
            $.get('../html/commentCard.html', function(template) {
                subComments.forEach(function(comment) {
                    var commentReplaced = $(template.replace('{{author}}', comment.author)
                        .replace('{{content}}', comment.content)
                        .replace('{{date}}', new Date(comment.createTime).toLocaleDateString())
                        .replace('{{time}}', new Date(comment.createTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
                        .replace('{{id}}', comment.id));

                    container.append(commentReplaced);
                });
            });
        },
        error: function(error) {
            console.error("Ошибка", error);
        }
    });
}

$(document).on('click', '.show-replies', function(e) {
    e.preventDefault();
    var commentId = $(this).closest('.comment-item').data('comment-id');
    var container = $(this).closest('.comment-item').find('.replies-container');


    if (container.children().length === 0) {
        $(this).text('Скрыть ответы');
        parseNestedComments(commentId, container);
    }
    else{
        $(this).text('Раскрыть ответы');
        container.empty();
    }

});

