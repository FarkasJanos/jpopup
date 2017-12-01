(function ($) {
    $.JPopup = function (options) {
        var defaults = {
            verbose: false,
            hidden: false,
            content: '',
            closeButton: '<i class="module-popup__close__button"></i>',
            closeButtonPosition: 'right top',
            textCenter: false,
            maxWidth: false,
            delay: null,
            noiseTime: 5000,
            cookie: false,
            cookieName: '',
            cookieSession: false,
            cookieExpires: 30,
            cookiePath: '/'
        };

        var plugin = this;
        var opts = {},
            noiseInterval = null;

        plugin.settings = {};
        plugin.dom = {};
        plugin.cookie = {};

        plugin.init = function () {
            getOptions();
            if (!plugin.settings.content || plugin.settings.content === '') {
                debug('No content specified. Exiting...');
                return null;
            }
            // checkCookie();
            // if (plugin.cookie.enabled && plugin.cookie.stored) {
            //     debug('Cookie already exist. Exiting...');
            //     return null;
            // }
            createPopup();
            setupPopup();
        };

        var debug = function (info, data) {
                if (!info) {
                    return;
                }
                if (plugin.settings.verbose === true) {
                    if (data) {
                        console.log(info, data);
                    } else {
                        console.log(info);
                    }
                }
            },
            // checkCookie = function () {
            //     if (plugin.settings.cookie === false) {
            //         debug('Cookie support disabled');
            //         return;
            //     }
            //     if (plugin.settings.cookieName !== '') {
            //         debug('Cookie support enabled');
            //         plugin.cookie.enabled = true;
            //         if ($.cookie(plugin.settings.cookieName) === 'undefined') {
            //             plugin.cookie.stored = false;
            //             debug('Cookie doesn\'t exists');
            //         } else {
            //             plugin.cookie.stored = true;
            //             debug('Cookie exists');
            //         }
            //     } else {
            //         debug('Cookie support enabled, \'cookieName\' must be specified.');
            //     }
            // },
            // storeCookie = function () {
            //     if (!plugin.cookie.enabled) {
            //         return;
            //     }
            //     if (plugin.settings.cookieSession) {
            //         $.cookie(plugin.settings.cookieName, true);
            //         debug('Cookie saved as session cookie');
            //     } else {
            //         var data = {};
            //         var expires = parseInt(plugin.settings.cookieExpires, 10);
            //         if (expires >= 0) {
            //             data.expires = expires;
            //         }
            //         if (plugin.settings.cookiePath !== null) {
            //             data.path = plugin.settings.cookiePath;
            //         }
            //         $.cookie(plugin.settings.cookieName, true, data);
            //         debug('Cookie saved', data);
            //     }
            // },
            isDomElement = function () {
                return (options.length === 1 && options[0].dataset);
            },
            parseTime = function (time) {
                if ($.isNumeric(time)) {
                    return parseInt(time, 10);
                } else if (time.match(/^\d+(ms|MS|Ms)$/g)) {
                    return parseInt(time.match(/\d+/g), 10);
                } else if (time.match(/^\d+(s|S)$/g)) {
                    return parseInt(time.match(/\d+/g), 10) * 1000;
                } else {
                    return null;
                }
            },
            getOptions = function () {
                if (isDomElement()) {
                    opts = options.html5data('jpopup');
                } else {
                    opts = options;
                }
                plugin.settings = $.extend({}, defaults, opts);

                debug('\r\nCreated a new instance of Popup with:\r\n', options);
                debug('Given options:\r\n', opts);

                if (plugin.settings.delay !== null) {
                    var delay = parseTime(plugin.settings.delay);

                    if (delay) {
                        plugin.settings.hidden = true;
                        plugin.settings.delay = delay;
                        debug('Got \'delay\' so \'hidden\' set to true.');
                    }
                }

                if (plugin.settings.noiseTime !== null) {
                    var noiseTime = parseTime(plugin.settings.noiseTime);

                    if (noiseTime) {
                        plugin.settings.noiseTime = noiseTime;
                        debug('Got \'noiseTime\'.');
                    }
                }

                debug('Merged configuration:\r\n', plugin.settings);
                debug('Verbose enabled!');
                debug('Options stored...');
            },
            displayPopup = function (delay) {
                var $activePopups = $('.module-popup').not($('.module--hidden'));
                if (noiseInterval) {
                    clearInterval(noiseInterval);
                }
                if ($activePopups.length) {
                    noiseInterval = setInterval(displayPopup, plugin.settings.noiseTime);
                } else {
                    if (delay) {
                        setTimeout(function () {
                            plugin.dom.popup.removeClass('module--hidden');
                            // storeCookie();
                        }, delay);

                        debug('Displaying popup in: ' + delay + 'ms');
                    } else {
                        plugin.dom.popup.removeClass('module--hidden');
                        // storeCookie();
                        debug('Displaying popup...');
                    }
                }
            },
            initEventListeners = function () {
                debug('Adding event listeners...');

                $(document)
                    .off('click.Popup', '#' + plugin.dom.popup.attr('id'))
                    .on('click.Popup', '#' + plugin.dom.popup.attr('id'), function () {
                        $(this).addClass('module--hidden');
                    })
                    .find(plugin.dom.popup_content_wrapper)
                    .off('click.Popup')
                    .on('click.Popup', function () {
                        return false;
                    });
                debug('Close listener added');
            },
            makeID = function () {
                var id = '',
                    availableChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                for (var i = 0; i < 10; i++) {
                    id += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
                }
                return id;
            },
            createPopup = function () {
                plugin.dom.popup = $('<div>')
                    .addClass('module-popup module--hidden')
                    .attr('id', 'popup-' + makeID());

                plugin.dom.popup_wrapper = $('<div>')
                    .addClass('module-popup__wrapper')
                    .appendTo(plugin.dom.popup);

                plugin.dom.popup_container = $('<div>')
                    .addClass('container')
                    .appendTo(plugin.dom.popup_wrapper);

                plugin.dom.popup_content_wrapper = $('<div>')
                    .addClass('module-popup__content-wrapper')
                    .appendTo(plugin.dom.popup_container);

                plugin.dom.popup_content = $('<div>')
                    .addClass('module-popup__content')
                    .appendTo(plugin.dom.popup_content_wrapper);

                plugin.dom.popup_close = $('<div>')
                    .addClass('module-popup__close')
                    .appendTo(plugin.dom.popup);

                plugin.dom.popup.appendTo($('body'));

                debug('Popup initialized!');

                initEventListeners();
            },
            setupPopup = function () {
                var config = plugin.settings;
                plugin.dom.popup_content.html(config.content);

                plugin.dom.popup_close.html(config.closeButton);

                if (config.closeButtonPosition === 'right top' || config.closeButtonPosition === 'top right') {
                    plugin.dom.popup_close.addClass('module-popup__close--right-top');
                } else if (config.closeButtonPosition === 'right bottom' || config.closeButtonPosition === 'bottom right') {
                    plugin.dom.popup_close.addClass('module-popup__close--right-bottom');
                } else if (config.closeButtonPosition === 'left top' || config.closeButtonPosition === 'top left') {
                    plugin.dom.popup_close.addClass('module-popup__close--left-top');
                } else if (config.closeButtonPosition === 'left bottom' || config.closeButtonPosition === 'bottom left') {
                    plugin.dom.popup_close.addClass('module-popup__close--left-bottom');
                }

                if (config.textCenter === true) {
                    plugin.dom.popup_content.addClass('module-popup__content--text-center');
                }

                if (config.maxWidth === true) {
                    plugin.dom.popup_content_wrapper.addClass('module-popup__content-wrapper--max-width');
                }

                if (config.delay) {
                    displayPopup(config.delay);
                }

                if (config.hidden !== true) {
                    displayPopup();
                }
            };

        plugin.init();
    };

    $.fn.JPopup = function (options) {
        return this.each(function () {
            if (undefined == $(this).data('JPopup')) {
                var plugin = new $.JPopup(this, options);
                $(this).data('JPopup', plugin);
            }
        });
    };

    // Getting elements with data-jpopup
    $(function () {
        var $popups = $('[data-jpopup]');
        $.each($popups, function () {
            $.JPopup($(this));
        });
    });

})(jQuery);
