$(function () {

        $.ajax({
            success: function (sonuc) {
                $("#category-name").html(sonuc);
            }
        });
    })
