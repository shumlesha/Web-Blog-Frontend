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
                            .replace(/{{likeClass}}/g, post.hasLike === true ? 'bi bi-heart-fill text-danger' : 'bi bi-heart')
                            .replace(/{{fullAddress}}/g, fullAddress !== "" ? `<div><i class="bi bi-geo-alt-fill"></i> ${fullAddress}</div>`: "");


                        postsContainer.append(card);
                        console.log('Готовы скроллить');
                        if (localStorage.getItem('scrollFlag') === 'true'){
                            console.log('scrolling');
                            $("#comments-block").get(0).scrollIntoView();
                            localStorage.removeItem('scrollFlag');
                        }

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
                    likeIcon.removeClass('bi-heart').addClass('bi-heart-fill text-danger');
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
            $('#comments-block').html('<h5 className="card-title">Комментарии</h5>');
            $.get('../html/commentCard.html', function(template) {
                data.comments.forEach(function(comment) {
                    var commentReplaced = $(template.replace('{{author}}', comment.deleteDate ? '[Комментарий удален]': comment.author)
                        .replace('{{content}}', comment.deleteDate ? '[Комментарий удален]': comment.content)
                        .replace('{{date}}', new Date(comment.createTime).toLocaleDateString())
                        .replace('{{time}}', new Date(comment.createTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
                        .replace('{{id}}', comment.id)
                        .replace('{{subamount}}', comment.subComments)
                        .replace('{{deleteFlag}}', comment.deleteDate ? true: false));

                    if (comment.modifiedDate && (!!comment.deleteDate === false)) {
                        var modifiedDate = new Date(comment.modifiedDate).toLocaleDateString();
                        var modifiedTime = new Date(comment.modifiedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        var modifiedText = `<span class="text-muted font-italic ml-1 modified-mark" title="Изменён: ${modifiedDate} ${modifiedTime}">(изменен)</span>`;
                        commentReplaced.find('.commtext-container').append(modifiedText);
                    }

                    $.ajax({
                        url: 'https://blog.kreosoft.space/api/account/profile',
                        method: 'GET',
                        contentType: 'application/json',
                        headers: {
                            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
                        },
                        success: function(response) {

                            if (response.id === comment.authorId && comment.deleteDate === null) {

                                var editIcon = '<i class="bi bi-pencil-fill text-warning"></i>';
                                var deleteIcon = '<i class="bi bi-trash-fill text-danger"></i>';
                                var iconsHtml = `${editIcon} ${deleteIcon}`;
                                commentReplaced.find('.comment-icons').append(iconsHtml);
                            }
                        },
                        error: function(xhr, status, error) {
                            if (xhr.status === 401){
                                window.location.href = 'http://localhost/login';
                            }
                        }
                    });

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
                    var commentReplaced = $(template.replace('{{author}}', comment.deleteDate ? '[Комментарий удален]': comment.author)
                        .replace('{{content}}', comment.deleteDate ? '[Комментарий удален]': comment.content)
                        .replace('{{date}}', new Date(comment.createTime).toLocaleDateString())
                        .replace('{{time}}', new Date(comment.createTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
                        .replace('{{id}}', comment.id)
                        .replace('{{subamount}}', comment.subComments)
                        .replace('{{deleteFlag}}', comment.deleteDate ? true: false));

                    if (comment.modifiedDate && (!!comment.deleteDate === false)) {
                        var modifiedDate = new Date(comment.modifiedDate).toLocaleDateString();
                        var modifiedTime = new Date(comment.modifiedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        var modifiedText = `<span class="text-muted font-italic ml-1 modified-mark" title="Изменён: ${modifiedDate} ${modifiedTime}">(изменен)</span>`;
                        commentReplaced.find('.commtext-container').append(modifiedText);
                    }

                    $.ajax({
                        url: 'https://blog.kreosoft.space/api/account/profile',
                        method: 'GET',
                        contentType: 'application/json',
                        headers: {
                            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken')
                        },
                        success: function(response) {

                            if (response.id === comment.authorId && comment.deleteDate === null) {

                                var editIcon = '<i class="bi bi-pencil-fill text-warning"></i>';
                                var deleteIcon = '<i class="bi bi-trash-fill text-danger"></i>';
                                var iconsHtml = `${editIcon} ${deleteIcon}`;
                                commentReplaced.find('.comment-icons').append(iconsHtml);
                            }
                        },
                        error: function(xhr, status, error) {
                            if (xhr.status === 401){
                                window.location.href = 'http://localhost/login';
                            }
                        }
                    });


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

$(document).on('click', '.bi-pencil-fill', function() {
    var commentContainer = $(this).closest('.comment-item');

    if (commentContainer.data('deleteflag') === true){
        alert('Нельзя изменить удаленный комментарий!')
    }
    else {
        console.log(commentContainer.data('deleteflag'));
        var editFormHtml = `
        <div class="input-group mb-2">
        <input type="text" class="form-control comment-edit-input">
        <div class="input-group-append ml-2">
            <button class="btn btn-warning edit-comment-btn" type="button">Редактировать</button>
        </div>
        </div>
    `;
        commentContainer.data('comment-text', commentContainer.find('.comment-text').text());

        commentContainer.find('.commtext-container').html(editFormHtml);
    }

});

$(document).on('click', '.edit-comment-btn', function() {
    var commentContainer = $(this).closest('.comment-item');
    var commentInput = commentContainer.find('.comment-edit-input');
    var commentText = commentInput.val().trim();
    var commentId = commentContainer.data('comment-id');

    if (commentText.trim().length === 0) {
        commentText = commentContainer.data('comment-text');
        console.log(commentText);
    }
    $.ajax({
        url: `https://blog.kreosoft.space/api/comment/${commentId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ content: commentText }),
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('bearerToken'),
        },
        success: function(response) {
            commentContainer.find('.commtext-container').html(`<p class="mb-1 comment-text">${commentText}</p>`);
            console.log(commentContainer.find('.modified-mark'));
            if (!commentContainer.find('.modified-mark').length){
                console.log('Trigger');
                var modifiedDate = new Date().toLocaleDateString();
                var modifiedTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                var modifiedText = `<span class="text-muted font-italic ml-1 modified-mark" title="Изменён: ${modifiedDate} ${modifiedTime}">(изменен)</span>`;
                commentContainer.find('.commtext-container').append(modifiedText);
            }
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", error);
        }
    });
});


$(document).on('click', '.reply-link', function(e) {
    e.preventDefault();
    var replyForm = `
        <div class="input-group mb-2 answer-container">
        <input type="text" class="form-control answer-input" placeholder="Оставьте комментарий...">
        <div class="input-group-append ml-2">
            <button type="button" class="btn btn-primary answer-button">Отправить</button>
        </div>
        </div>
    `;
    var commentId = $(this).closest('.comment-item').data('comment-id');
    var currentReplyLink = $(this);

    if (currentReplyLink.siblings('.reply-form').length === 0) {
        currentReplyLink.parent().after(replyForm);
    }
});

$(document).on('click', '.answer-button', function() {
    var commentContainer = $(this).closest('.comment-item');
    var commentInput = commentContainer.find('.answer-input');
    var commentText = commentInput.val().trim();
    var commentId = commentContainer.data('comment-id');

    if (commentText.trim().length === 0) {
        $('.answer-container').remove();
    }
    else{
        var path = window.location.pathname;
        var pathParts = path.trim().split('/');
        var postId = pathParts[pathParts.length - 1];
        $.ajax({
            url: `https://blog.kreosoft.space/api/post/${postId}/comment`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ content: commentText, parentId: commentId }),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bearerToken'),
            },
            success: function(response) {
                $('.answer-container').remove();
                //parseComments(postId);
                window.location.reload();
            },
            error: function(xhr, status, error) {
                console.error("Ошибка", error);
            }
        });
    }

});


$(document).on('click', '.bi-trash-fill', function() {
    var commentContainer = $(this).closest('.comment-item');
    var commentId = commentContainer.data('comment-id');

    var path = window.location.pathname;
    var pathParts = path.trim().split('/');
    var postId = pathParts[pathParts.length - 1];
    console.log('00000');
    $.ajax({
        url: `https://blog.kreosoft.space/api/comment/${commentId}`,
        method: 'DELETE',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer '+ localStorage.getItem('bearerToken'),
        },
        success: function(response) {
            if (commentContainer.data('subcoms') === 0){
                commentContainer.remove();
            }

            window.location.reload();
        },
        error: function(xhr, status, error) {
            console.error("Ошибка", error);
        }
    })
});

$(document).on('submit', '#commentary-form', function(e) {
    e.preventDefault();

    var path = window.location.pathname;
    var pathParts = path.trim().split('/');
    var postId = pathParts[pathParts.length - 1];
    var commentText = $('#self-comment-text').val().trim();


    if (commentText) {
        $.ajax({
            url: `https://blog.kreosoft.space/api/post/${postId}/comment`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ content: commentText, parentId: null }),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
            },
            success: function(response) {
                $('#comment-text').val('');
                window.location.reload();
            },
            error: function(xhr, status, error) {
                console.error('Ошибка', status, error);
            }
        });
    } else {
        alert('Комментарий не может быть пустым!');
    }
})


$(document).on('click', '.bi-chat-left-text', function(e) {
    var postId = $(this).parent().parent().find('.like-section').data('post-id');
    console.log(postId);
    localStorage.setItem('scrollFlag', 'true');
    window.location.href = `http://localhost/post/${postId}`;
})