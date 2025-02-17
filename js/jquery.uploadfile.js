/*!
 * jQuery Upload File Plugin
 * version: 3.1.0
 * @requires jQuery v1.5 or later & form plugin
 * Copyright (c) 2013 Ravishanker Kusuma
 * http://hayageek.com/
 */
(function ($) {
    var feature = {};
    feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
    feature.formdata = window.FormData !== undefined;

    if (feature.fileapi !== true || feature.formdata !== true || !(new XMLHttpRequest()).upload) {
        throw "Browser not supported";
    }

    $(document).on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });

    function bytesToH (bytes) {
        var base = Math.floor(Math.log(bytes)/Math.log(1024));
        return Math.round(bytes/Math.pow(1024, base)) + ' ' + bytesToH.suffixes[base];
    }
    bytesToH.suffixes = [
        'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'
    ];

    function applyBgPercent(dom, percent, color) {
        if (percent === Infinity) return;
        var r = parseInt(color.substr(0, 2), 16);
        var g = parseInt(color.substr(2, 2), 16);
        var b = parseInt(color.substr(4, 2), 16);
        var c = r+','+g+','+b;
        dom.css('background-position', (100-percent) + '% 0');
    }

    function Uploader (dom, options) {
        this.dom = dom;
        this.tr = dom;
        this.options = options;
        while(this.tr.nodeName !== 'TR') this.tr = this.tr.parentNode;

        $(this.tr).data('div', dom);
        this.dir = $(this.tr).data('dir');
        this.source = $(this.tr).data('source');
        this.uploads = [];
        this.url = options.url;

        this.uploadFiles = function(files){
            for(var i= 0,l=files.length; i<l; i++) {
                this.uploads.push(
                    new UploadFile(files[i], this)
                );
            }
        };


        var obj = $(this.tr);
        // set drag drop handlers
        obj.on('dragenter', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).parent('td').css('border', '2px solid #A5A5C7');
        });
        obj.on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
        });
        obj.on('drop', function (e) {
            $(this).css('border', '0');
            e.preventDefault();
            var files = e.originalEvent.dataTransfer.files;
            $($(this).data('div')).data('uploader').uploadFiles(files);
        });

        $(document).on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(dom).parent('td').css('border', '2px dotted #A5A5C7');
        });
        $(document).on('drop', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(dom).parent('td').css('border', '0');
        });
    }

    function UploadFile (file, uploader) {
        this.tr = $(
            '<tr data-dir="'+uploader.dir+'" data-type="file" data-file="'+file.name+'" data-source="'+uploader.options.source+'">'+
                '<td colspan="3" class="transition">'+
                    $('<div>').append(
                        $(uploader.dom).children().clone()).html() + file.name + ' ' + bytesToH(file.size
                    ) +
                '</td>'+
            '</tr>'
        );
        this.td = this.tr.find('td');
        this.formData = new FormData;
        this.formData.append('file', file, file.name);
        this.uploader = uploader;
        $(uploader.tr)
            .siblings('tr[data-dir="'+this.attr(uploader.dir)+'"]')
            .last()
            .after(this.tr);

        var td = this.td;

        this.success = function(result){
            $(td).removeClass('transition');
            if (result.error) {
                $(td).css({
                    'background-color': '#a94442',
                    color: '#fff'
                }).append($('<span class="error"> '+result.message+'</span>'));
            } else {
                $(td).css({
                    'background-color': '#5cb85c',
                    color: '#fff'
                });
                this.uploader.options.success(this.tr);
            }
        }
        var me = this;

        var xhr = new XMLHttpRequest();
        xhr.file = file;
        xhr.upload.onprogress = function(e) {
            var done = e.loaded || e.position;
            var total = e.total || e.totalSize;
            applyBgPercent(td, Math.floor((done/total)*100), '007196');
        };
        xhr.onreadystatechange = function(e) {
            if ( 4 == this.readyState ) {
                var response = this.response;
                me.success(JSON.parse(response));
            }
        };
        xhr.open('post', uploader.url, true);
        xhr.send(this.formData);
    };
    UploadFile.prototype = {
        attr: function (dir) {
            return dir.replace(/\\/g, '\\\\');
        }
    };

    $.fn.uploadFile = function (options) {
        // This is the easiest way to have default options.
        this.attr('class', '');

        var div = this[0];
        $(div).data('uploader', new Uploader(div, options));

        return this;

    }
}(jQuery));