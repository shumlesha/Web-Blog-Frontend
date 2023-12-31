import {postErrorMessages} from "../js/postErrorMessages.js";
import {customPostErrors} from "../js/customPostErrors.js";


$(document).ready(function() {
    if (!localStorage.getItem('bearerToken')){
        window.location.href = 'http://localhost/login';
    }

    var lastGuid = null;
    $('#postAddress').select2({
        allowClear: true,
        ajax: {
            url: 'https://blog.kreosoft.space/api/address/search',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    query: params.term,
                    parentObjectId: null
                };
            },
            processResults: function (data) {
                return {
                    results: data.map(function(item) {
                        return {
                            id: item.objectId,
                            text: item.text,
                            objectGuid: item.objectGuid
                        };
                    })
                };
            },
            cache: true
        },
        minimumInputLength: 0
    });

    $('#postAddress').on('select2:select', function (e) {
        var data = e.params.data;
        if (data.objectGuid !== null){
            lastGuid = data.objectGuid;
            console.log(data.objectGuid);
        }
        loadNextAddressLevel(data.id, data.objectGuid);
    });

    replaceNav();
    fillTags();

    function fillUserGroups(groupIndicator) {
        $.ajax({
            url: 'https://blog.kreosoft.space/api/community/my',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
            },
            success: function(groups) {
                var groupSelect = $('#postGroup');
                groupSelect.empty();
                if (!groupIndicator) {
                    groupSelect.append('<option value="null" selected>Без группы</option>');
                }
                else {
                    groupSelect.append('<option value="null">Без группы</option>');
                }
                groups.forEach(function(group) {
                    if (group.role === 'Administrator') {
                        $.ajax({
                            url: `https://blog.kreosoft.space/api/community/${group.communityId}`,
                            method: 'GET',
                            contentType: 'application/json',
                            success: function(commData) {
                                if (groupIndicator && localStorage.getItem('commId') === group.communityId) {
                                    console.log('works')
                                    groupSelect.append(`<option value="${group.communityId}" selected>${commData.name}</option>`);
                                }
                                else{
                                    console.log('not works');
                                    groupSelect.append(`<option value="${group.communityId}">${commData.name}</option>`);
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error("Ошибка", status, error);
                            }
                        });

                    }
                    //groupSelect.append(`<option value="${group.communityId}">${group.name}</option>`);
                });
            },
            error: function(xhr, status, error) {
                console.error("Ошибка при получении групп пользователя: ", status, error);
            }
        });
    }

    /*if (localStorage.getItem('commId') === null) {
        fillUserGroups();
    }*/
    fillUserGroups(localStorage.getItem('commId') !== null);



    function createNewAddressField(label, parentObjectId) {
        var newSelectId = 'address_' + parentObjectId;
        var newSelectHtml = `<div class="form-group mb-3 mt-2">
    <label for="${newSelectId}" class="mb-1">Следующий элемент адреса</label>
    <select id="${newSelectId}" class="form-control next-address-select"></select>
    </div>`;
        $('#addressDetails').append(newSelectHtml);

        $('#' + newSelectId).select2({
            allowClear: true,
            ajax: {
                url: 'https://blog.kreosoft.space/api/address/search',
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {
                        query: params.term,
                        parentObjectId: parentObjectId
                    };
                },
                processResults: function (data) {
                    return {
                        results: data.map(function(item) {
                            return {
                                id: item.objectId,
                                text: item.text,
                                objectLevelText: item.objectLevelText,
                                objectGuid: item.objectGuid
                            };
                        })
                    };
                },
                cache: true
            },
            minimumInputLength: 0
        }).on('select2:select', function (e) {
            var data = e.params.data;
            $(this).closest('.form-group').nextAll().remove();
            $("label[for='" + newSelectId + "']").text(data.objectLevelText);
            if (data.objectGuid !== null){
                lastGuid = data.objectGuid;
                console.log(data.objectGuid);
            }

            loadNextAddressLevel(data.id, data.objectGuid);
        });
    }
    function loadNextAddressLevel(parentObjectId, objectGuid) {

        $.ajax({
            url: 'https://blog.kreosoft.space/api/address/search',
            data: { parentObjectId: parentObjectId },
            success: function(data) {
                if(data.length > 0) {
                    var newFieldLabel = data[0].objectLevelText;

                    createNewAddressField(newFieldLabel, parentObjectId);

                } else {
                    console.log("Конец");
                    data.forEach(function(item) {
                        console.log(item);
                    })


                }
                //var newFieldLabel = data[0].objectLevelText;
                //createNewAddressField(newFieldLabel, parentObjectId);
            }
        });
    }

    $('#createForm').submit(function(e) {
        e.preventDefault();

        var title = $('#postTitle').val();
        var description = $('#postText').val();
        var readingTime = parseInt($('#postReadingTime').val());
        var image = $('#postImageUrl').val();
        var addressId = lastGuid;
        var tags = $('#postTags').val();
        var id = $('#postGroup').val();

        var postData = {
            title: title,
            description: description,
            readingTime: readingTime,
            addressId: addressId,
            tags: tags,
            ...(image && { image: image })
        };

        if (id === 'null'){
            $.ajax({
                url: 'https://blog.kreosoft.space/api/post',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(postData),
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
                },
                success: function(postId) {
                    if (localStorage.getItem('commId') !== null) {
                        localStorage.removeItem('commId');
                    }
                    for (var field of postErrorMessages){
                        $('#' + field).removeClass('is-invalid');
                    }
                    window.location.href = `http://localhost`;
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 400){
                        var toJson = JSON.parse(xhr.responseText);
                        if (toJson.errors) {
                            toJson = toJson.errors;
                        }

                        for (var key of postErrorMessages) {
                            $('#' + key).removeClass('is-invalid');

                        }

                        if (toJson.model){
                            console.log('Показываем ошибки');
                            for (var field of postErrorMessages) {
                                $('#' + field).addClass('is-invalid');
                            }
                        }
                        else {
                            for (var key in toJson) {
                                if (toJson.hasOwnProperty(key) && customPostErrors.hasOwnProperty(key)) {
                                    var field = customPostErrors[key];
                                    $('#' + field.id).addClass('is-invalid');
                                    $('#' + field.id).next('.invalid-feedback').text(toJson[key]);
                                }
                            }

                        }
                    }
                }
            });
        }
        else{
            $.ajax({
                url: `https://blog.kreosoft.space/api/community/${id}/post`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(postData),
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('bearerToken')
                },
                success: function(postId) {
                    if (localStorage.getItem('commId') !== null) {
                        localStorage.removeItem('commId');
                    }
                    for (var field of postErrorMessages){
                        $('#' + field).removeClass('is-invalid');
                    }
                    window.location.href = `http://localhost`;
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 400){
                        console.log('Показываем ошибки');
                        for (var field of postErrorMessages) {
                            $('#' + field).addClass('is-invalid');
                        }
                    }
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

function  fillTags(){
    $.ajax({
        url: 'https://blog.kreosoft.space/api/tag',
        method: 'GET',
        contentType: 'application/json',
        success: function(response) {
            $.each(response, function(i, tag) {
                $('#postTags').append(`<option value="${tag.id}">${tag.name}</option>`);
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка: ", status, error);
        }
    });
}