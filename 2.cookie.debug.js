(function (exports, $) {
    "use strict";
    /**
     * @class EU
     * @version 1.0.0v
     *
     * JavaScript library to manage cookie optin and optout for users visiting
     * your website. Once we initilize the CookieMange Class
     * the mechanic will check if the user as opted in or out for saving cookies.
     *
     * If they have opted out we will block the loading of third party libraries.
     * If they have not saved any preference yet will will display a perference panel
     * to be able to optin or optout.
     *
     * Sub pacakges
     *
     * - {@link Cookie Cookie Class}
     * - {@link Events Events Class}
     * - {@link CookiePreferenceUI CookiePreferenceUI Class}
     *
     * An embedded live example:
     *     @example
     *
     *     EU.CookieManager.init({
     *      expires: 20
     *     });
     *
     * If you would like to check if user has subscribed to cookie optin or not:
     *     @example
     *
     *     var has_user_subscribed = EU.Cookie.hasSubscribed();
     *
     */
    var EU = {}, AppConfig, idleTimer, hide, show, toggle, idleCallback,
        createOptionPanel, listFeatures, toggleOptions, removeCookies, loadScript;

    AppConfig = {
        idle: 0,
        level: 0,
        message: 'Χρησιμοποιούμε cookies για να σας εξασφαλίσουμε μια κορυφαία εμπειρία πλοήγησης στο site μας.',
        cancel: 'I agree',
        changeSettings: 'Change settings',
        linkText: 'Find out more about cookies',
        functionalList: {
            'strict': {
                'will': ['Remember what is in your shopping basket', 'Remember cookie access level.'],
                'willnot': ['Send information to other websites so that advertising is more relevant to you', 'Remember your log-in details', 'Improve overall performance of the website', 'Provide you with live, online chat support']
            },
            'functional': {
                'will': ['Remember what is in your shopping basket', 'Remember cookie access level.', 'Remember your log-in details', 'Make sure the website looks consistent', 'Offer live chat support'],
                'willnot': ['Allow you to share pages with social networks like Facebook', 'Allow you to comment on blogs', 'Send information to other websites so that advertising is more relevant to you']
            },
            'targeting': {
                'will': ['Remember what is in your shopping basket', 'Remember cookie access level.', 'Remember your log-in details', 'Make sure the website looks consistent', 'Offer live chat support', 'Send information to other websites so that advertising is more relevant to you'],
                'willnot': []
            }
        },
        optin_cookie_name: 'PRAKTIKER_EU_OPTIN',

    };

    /**
     * @class Utility
     * Class contains all utility functions
     * @extends EU
     * @singleton
     */


    EU.Utility = (function () {

        EU.Utility = {};
        /**
         * Function to extend from another object.
         * This function will copy across all imediate properies
         * of the source object to the destination object.
         *
         * @public
         * @method
        */
        EU.Utility.extend = function (obj, source) {
            var prop;
            if (typeof obj === 'object') {
                for (prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        obj[prop] = source[prop];
                    }
                }
            }
            return obj;
        };

        return EU.Utility;
    }());

    /**
     * @class Events
     * EU.Event wraps the browser's native event-object normalizing cross-browser differences such as
     * mechanisms to stop event-propagation along with a method to prevent default actions from taking
     * place.
     *
     * @extends EU
     * @singleton
     */
    EU.Events = (function () {

        EU.Events = {};
        /**
         * Function to add event listener to an element
         * @return {Boolean} success
         * @method
        */
        EU.Events.addEvent = function (obj, type, fn) {
            if (obj !== null) {
                if (obj.attachEvent) {
                    obj['e' + type + fn] = fn;
                    obj[type + fn] = function () { obj['e' + type + fn](window.event); };
                    obj.attachEvent('on' + type, obj[type + fn]);
                } else {
                    obj.addEventListener(type, fn, false);
                }
            }
        };

        /**
        * Function to remove event listener to an element
        * @return {Boolean} success
        * @method
        */
        EU.Events.removeEvent = function (obj, type, fn) {
            if (obj.detachEvent) {
                obj.detachEvent('on' + type, obj[type + fn]);
                obj[type + fn] = null;
            } else {
                obj.removeEventListener(type, fn, false);
            }
        };

        return EU.Events;
    }());

    /**
     * @class CookiePreferenceUI
     * This class will create UI to manage cookie opt in - out.
     *
     * @extends EU
     * @singleton
     */
    EU.CookiePreferenceUI = (function () {
        var config;
        /**
         * Function to create styles on a HTML dom element
         * @return {Boolean} success
         * @private
         * @method
         */
        function setStyles(el, o) {
            var key;
            for (key in o) {
                if (o.hasOwnProperty(key)) {
                    el.style[key] = o[key];
                }
            }
        }
        /**
         * Function will setup panel properties
         * @return {Boolean} success
         * @private
         * @method
         */
        function positionPanel(el) {
            var viewportwidth,
                viewportheight,
                panelWidth = 300;
            if (typeof window.innerWidth !== 'undefined') {
                viewportwidth = window.innerWidth;
                viewportheight = window.innerHeight;
            } else if (typeof document.documentElement !== 'undefined'
                && typeof document.documentElement.clientWidth !== 'undefined'
                && document.documentElement.clientWidth !== 0) {
                viewportwidth = document.documentElement.clientWidth;
                viewportheight = document.documentElement.clientHeight;
            } else {
                viewportwidth = document.getElementsByTagName('body')[0].clientWidth;
                viewportheight = document.getElementsByTagName('body')[0].clientHeight;
            }
            setStyles(el, {
                position: 'fixed',
                zIndex: 9999,
                width: '100vw',
                height: 'auto',
                padding: '10px',
                textAlign: 'center',
                right: '0px',
                left: '0px',
                bottom: '0px'
            });
        }
        /**
         * Function will setup panel properties
         * @return {Boolean} success
         * @private
         * @method
         */
        function positionExtendedPanel(el) {
            var viewportwidth,
                viewportheight,
                panelWidth = 600;
            if (typeof window.innerWidth !== 'undefined') {
                viewportwidth = window.innerWidth;
                viewportheight = window.innerHeight;
            } else if (typeof document.documentElement !== 'undefined'
                && typeof document.documentElement.clientWidth !== 'undefined'
                && document.documentElement.clientWidth !== 0) {
                viewportwidth = document.documentElement.clientWidth;
                viewportheight = document.documentElement.clientHeight;
            } else {
                viewportwidth = document.getElementsByTagName('body')[0].clientWidth;
                viewportheight = document.getElementsByTagName('body')[0].clientHeight;
            }
            setStyles(el, {
                position: 'fixed',
                zIndex: 9999,
                left: (viewportwidth / 2) - (panelWidth / 2) + 'px',
                //right: '20px',
                top: '30px'
            });

            setStyles(document.getElementById('ck-overlay'), {
                position: 'fixed',
                zIndex: 9998,
                width: viewportwidth + 'px',
                height: viewportheight + 'px'
            });
        }
        /**
         * Function to create the preference panel for optin / optout
         * @return {Boolean} panel
         * @private
         * @method
         */
        function createPanelUI() {
            var body = document.getElementsByTagName("body")[0],
                container = document.createElement("div"),
                checked = (EU.Cookie.hasSubscribed()) ? 'checked' : '',
                p = document.getElementById('huk_cookie_prefernce_panel'),
                expires = config.expires || 30,
                cookie;
            if (!p) {




                container.id = 'huk_cookie_prefernce_panel';

                var hasFunctional = '', hasPerformance = '', hasTargeting = '';
                var cookieMask = EU.Cookie.get(AppConfig.optin_cookie_name);
                if (EU.Cookie.hasSubscribed()) {
                    var cookieOptions = cookieMask.split('');
                    hasFunctional = cookieOptions[1] === '1' ? 'checked' : '';
                    hasPerformance = cookieOptions[2] === '1' ? 'checked' : '';
                    hasTargeting = cookieOptions[3] === '1' ? 'checked' : '';
                }

                container.innerHTML = '<div id="cookie-ext-panel" class="grid-container">' +
                    '<div id="cookie-info">' +
                    '<div class="grid-x grid-padding-x cookie-init">' +
                    '   <div class="cell small-12 medium-shrink cookie-init">' +
                    '       <h1>Σχετικά με τα cookies</h1>' +
                    '   </div>' +
                    '   <div class="cell small-12 medium-auto cookie-init">' +
                    '      <p>' + AppConfig.message + '</p>' +
                    '   </div>' +
                    '</div>' +
                    '<div class="align-middle grid-padding-x grid-x cookie-init">' +
                    '   <div class="cell small-12 medium-shrink medium-order-3 cookie-init">' +
                    '      <input type="button" id="COOKIE_SAVE_ALL" value="ΑΠΟΔΟΧΗ ΟΛΩΝ" />' +
                    '  </div>' +
                    '   <div class="cell small-12 medium-shrink medium-order-2 cookie-init">' +
                    '       <a href="javascript:void(0)" id="EU_OPIN_DETAILS">ΠΡΟΣΑΡΜΟΓΗ ΡΥΘΜΙΣΕΩΝ</a>' +
                    '  </div>' +
                    '   <div class="cell small-12 medium-auto medium-order-1 cookie-init medium-text-left">' +
                    '        <input type="button" id="COOKIE_REJECT_ALL" value="ΑΠΟΡΡΙΨΗ ΟΛΩΝ" />' +
                    '  </div>' +
                    '</div>' +
                    '<div class="grid-x grid-padding-x">' +
                    '<div class="cell small-12 medium-3 cookie-functionalList">' +
                    '   <div id="cookie-list">' +
                    '       <div><a href="#dinfo" class="active">Πληροφορίες</a></div>' +
                    '       <div><a href="#dstrict">Απαραίτητα</a>' +
                    '           <label class="switch">' +
                    '               <input class="switch-input" type="checkbox" id="strict" name="cookie-opt" checked disabled value="1"/>' +
                    '               <span class="switch-label" data-on="On" data-off="Off"></span>' +
                    '               <span class="switch-handle"></span>' +
                    '           </label>' +
                    '       </div>' +
                    '       <div><a href="#dfunctional">Λειτουργικότητας</a>' +
                    '          <label class="switch">' +
                    '          <input class="switch-input" type="checkbox" id="functional" name="cookie-opt" ' + hasFunctional + ' value="2"/>' +
                    '          <span class="switch-label" data-on="On" data-off="Off"></span>' +
                    '          <span class="switch-handle"></span>' +
                    '          </label>' +
                    '       </div > ' +
                    '       <div><a href="#dperformance">Επιδόσεων</a>' +
                    '          <label class="switch">' +
                    '              <input class="switch-input" type="checkbox"  id="performance" name="cookie-opt" ' + hasPerformance + '  value="3"/>' +
                    '              <span class="switch-label" data-on="On" data-off="Off"></span>' +
                    '              <span class="switch-handle"></span>' +
                    '          </label>' +
                    '       </div>' +
                    '       <div><a href="#dtargeting">Στόχευσης/Διαφήμισης</a>' +
                    '          <label class="switch">' +
                    '              <input class="switch-input" type="checkbox"  id="targeting" name="cookie-opt" ' + hasTargeting + '  value="4"/>' +
                    '              <span class="switch-label" data-on="On" data-off="Off"></span>' +
                    '              <span class="switch-handle"></span>' +
                    '          </label>' +
                    '       </div>' +
                    '   </div>' +
                    '</div>' +
                    '<div class="cell small-12 medium-9 cookie-functionalList">' +
                    '   <div id="cookie-list-details-panel">' +
                    '       <div id="dinfo" class="active"> ' +
                    '          <h3>Σχετικά με τα cookies</h3>' +
                    '          <p>Τα cookies είναι μικρά αρχεία κειμένου τα οποία αποθηκεύονται από έναν ιστότοπο σε έναν φυλλομετρητή (internet browser) κατά την πλοήγησή μας και στη συνέχεια μπορεί να τα ανακτήσει, ώστε να αναγνωρίσει τον browser την επόμενη φορά που θα επισκεφτεί τον ιστότοπο.Όμως ουδέποτε τα cookies δεν περιέχουν προσωπικές πληροφορίες, οι οποίες θα μπορούσαν να επιτρέψουν σε οποιονδήποτε να επικοινωνήσει με τον επισκέπτη του ιστότοπου όπως π.χ. e - mail, κ.λπ, και μπορούν να αφαιρεθούν ανά πάσα στιγμή. Χρησιμοποιούμε cookies για την καλύτερη δυνατή λειτουργία του ιστοτόπου praktiker.gr, τη σωστή περιήγηση σας, τη σύνδεση και τη μετακίνηση στις σελίδες καθώς και για την παροχή διαφημιστικού περιεχομένου βασιζόμενο στα ενδιαφέροντα και τις ανάγκες σας.</p>' +
                    '       </div> ' +
                    '       <div id="dstrict">' +
                    '          <h3> Απαραίτητα cookies</h3> ' +
                    '          <p>Είναι τα cookies που είναι απαραίτητα για την λειτουργία ενός ιστότοπου. Χωρίς τα cookies ο ιστότοπος δεν μπορεί να λειτουργήσει κανονικά. Για την συγκεκριμένη κατηγορία cookies δεν ζητούμε την ειδική συγκατάθεση σας. Για όλα τα άλλα cookies απαιτείται η συγκατάθεση σας.</p>' +
                    '       </div>' +
                    '       <div id="dfunctional">' +
                    '          <h3> Cookies Λειτουργικότητας</h3>' +
                    '          <p>Είναι cookies που βελτιώνουν την λειτουργικότητα του ιστότοπου. Χάρη στη χρήση των συγκεκριμένων cookies η περιήγηση προσαρμόζεται στα ενδιαφέροντα σας και έτσι μπορούμε να εξοικονομήσουμε τον χρόνο που θα χάνατε επανεισάγοντας πληροφορίες.Οι πληροφορίες που συλλέγουν τα cookies αυτά αφορούν την περιήγησή σας στο Praktiker.gr αποκλειστικά και δεν είναι δυνατόν να καταγράψουν τη δραστηριότητα της περιήγησής σας σε άλλους ιστότοπους. Αν δεν δεχτείτε αυτά τα cookies, μπορεί να επηρεαστεί η απόδοση και λειτουργικότητα του Praktiker.gr και να περιοριστεί η πρόσβασή σας σε κάποιο περιεχόμενο του.<p>' +
                    '       </div>' +
                    '       <div id="dperformance">' +
                    '          <h3>Cookies Επιδόσεων</h3>' +
                    '          <p>Τα cookies επιδόσεων συλλέγουν πληροφορίες σχετικά με τον τρόπο που οι επισκέπτες χρησιμοποιούν το Praktiker.gr, για παράδειγμα, ποιές σελίδες επισκέπτονται συχνότερα και αν προκύπτουν μηνύματα σφαλμάτων από ιστοσελίδες.Χρησιμοποιούντα αποκλειστικά για τη βελτίωση των επιδόσεων μίας ιστοσελίδας.' +
                    '          Η ιστοσελίδα Praktiker.gr χρησιμοποιεί την υπηρεσία Google Analytics για σκοπούς στατιστικούς, μάρκετινγκ και διαφήμισης.</p>' +
                    '       </div> ' +
                    '       <div id="dtargeting">' +
                    '          <h3>Cookies Στόχευσης/Διαφήμισης</h3>' +
                    '          <p>Τα cookies στόχευσης χρησιμοποιούνται για την παροχή περιεχομένου, που ταιριάζει περισσότερο στα ενδιαφέροντά σας.Μπορεί να χρησιμοποιηθούν για την αποστολή στοχευμένης διαφήμισης / προσφορών, τον περιορισμό προβολών διαφήμισης ή την μέτρηση αποτελεσματικότητας μιας διαφημιστικής καμπάνιας.Συνήθως τοποθετούνται για να θυμούνται την επίσκεψη σας σε μια ιστοσελίδα.' +
                    '          Η ιστοσελίδα Praktiker.gr χρησιμοποιεί την υπηρεσία Google Analytics για σκοπούς στατιστικούς, μάρκετινγκ και διαφήμισης.</p>' +
                    '       </div> ' +
                    '       <input type="button" id="COOKIE_ACCEPT_ALL" value="ΑΠΟΔΟΧΗ ΟΛΩΝ" />' +
                    '       <input type="button" id="COOKIE_SAVE" value="ΑΠΟΘΗΚΕΥΣΗ ΡΥΘΜΙΣΕΩΝ" />' +
                    '   </div>' +
                    '   <div></div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
                positionPanel(container);
                body.appendChild(container);
                var status = 0;
                $('#EU_OPIN_DETAILS').bind('click', function (event) {
                    $('.cookie-functionalList').toggle('show');
                    $('.cookie-init').toggle();
                    if (status === 1) {
                        status = 0;
                        //$('#EU_OPIN_DETAILS').html('ΛΕΠΤΟΜΕΡΕΙΕΣ <i class="icon fa-more"></i>');
                    }
                    else {
                        status = 1;
                        //$('#EU_OPIN_DETAILS').html('ΚΛΕΙΣΙΜΟ <i class="fa  fa-chevron-circle-down"></i>');
                    }
                });
                $('#EU_OPIN_RESET').bind('click', function (event) {
                    $('#cokkie-options input:checkbox').not('#strict').prop('checked', false);
                });
                $('#cookie-list a').bind('click', function (event) {
                    event.preventDefault();
                    $('#cookie-list a').removeClass('active');
                    $('#cookie-list-details-panel > div').removeClass('active');
                    $(this).addClass('active');
                    $('div' + $(this).attr('href')).addClass('active');
                });

                $('#huk_cookie_prefernce_panel').bind('mouseenter', function (event) {
                    clearTimeout(idleTimer);
                });
                EU.Events.addEvent(document.getElementById('COOKIE_SAVE'), 'click', function (event) {
                    var cookiemask = '1' +
                        (document.getElementById('functional').checked ? '1' : '0') +
                        (document.getElementById('performance').checked ? '1' : '0') +
                        (document.getElementById('targeting').checked ? '1' : '0');
                    EU.Cookie.set({ name: AppConfig.optin_cookie_name, value: cookiemask, expires: expires });
                    location.href = location.href;
                    hide();
                });

                EU.Events.addEvent(document.getElementById('COOKIE_REJECT_ALL'), 'click', function (event) {
                    var cookiemask = '1000';
                    EU.Cookie.set({ name: AppConfig.optin_cookie_name, value: cookiemask, expires: expires });
                    location.href = location.href;
                    hide();
                });
                EU.Events.addEvent(document.getElementById('COOKIE_SAVE_ALL'), 'click', function (event) {
                    var cookiemask = '1111';
                    EU.Cookie.set({ name: AppConfig.optin_cookie_name, value: cookiemask, expires: expires });
                    location.href = location.href;
                    hide();
                });
                EU.Events.addEvent(document.getElementById('COOKIE_ACCEPT_ALL'), 'click', function (event) {
                    var cookiemask = '1111';
                    EU.Cookie.set({ name: AppConfig.optin_cookie_name, value: cookiemask, expires: expires });
                    location.href = location.href;
                    hide();
                });

            }

            if (AppConfig.idle !== 0) {
                idleTimer = setTimeout(function () {
                    idleCallback();
                    hide();
                }, (AppConfig.idle * 1000));
            }
        }

        function createExtenedPanel() {
            var body = document.getElementsByTagName("body")[0],
                panel = document.createElement('div'),
                overlay = document.createElement('div'),
                expires = AppConfig.expires || 30,
                p = document.getElementById('huk_cookie_prefernce_panel_ex');


            if (!p) {
                overlay.id = 'ck-overlay';
                overlay.innerHTML = "&nbsp;";
                panel.id = 'huk_cookie_prefernce_panel_ex';
                //panel.innerHTML = 
                body.appendChild(overlay);
                body.appendChild(panel);
                positionExtendedPanel(panel);


            }

            $('#strict, #functional, #targeting').bind('click', function (event) {
                listFeatures(event.currentTarget.id);
                if (event.currentTarget.id === 'strict') {
                    if ($('#strict').attr('checked') !== 'checked') {
                        $('#strict').attr('checked', 'checked');
                    }
                } else if (event.currentTarget.id === 'functional') {
                    if ($('#functional').attr('checked') !== 'checked') {
                        $('#strict').attr('checked', 'checked');
                        $('#functional').attr('checked', false);
                        $('#targeting').attr('checked', false);
                    }
                } else if (event.currentTarget.id === 'targeting') {
                    if ($('#targeting').attr('checked') === 'checked') {
                        $('#strict').attr('checked', 'checked');
                        $('#functional').attr('checked', 'checked');
                        $('#targeting').attr('checked', 'checked');
                    }
                }
                hide();
            });


        }

        removeCookies = function (currentOption) {
            if (currentOption === 'strict') {
                EU.Cookie.trash(AppConfig.assosiatedCookies.functional);
                EU.Cookie.trash(AppConfig.assosiatedCookies.targeting);
            } else if (currentOption === 'functional') {
                EU.Cookie.trash(AppConfig.assosiatedCookies.targeting);
            }
        };
        listFeatures = function (n) {
            var i, j, will, willnot, willWraper = '<h3>This website will:</h3><ul>', willNotWraper = '<h3>This website will not:</h3><ul>';
            will = AppConfig.functionalList[n].will;
            willnot = AppConfig.functionalList[n].willnot;

            for (i = 0; i < will.length; i += 1) {
                willWraper += '<li>' + will[i] + '</li>';
            }
            willWraper += '</ul>';

            for (i = 0; i < willnot.length; i += 1) {
                willNotWraper += '<li>' + willnot[i] + '</li>';
            }
            willNotWraper += '</ul>';

            document.getElementById('cookieWill').innerHTML = willWraper;
            document.getElementById('cookieWillNot').innerHTML = willNotWraper;
        };

        idleCallback = function () {
            var expires = AppConfig.expires || 30;
            if (!EU.Cookie.hasSubscribed()) {
                EU.Cookie.set({ name: AppConfig.optin_cookie_name, value: '0', expires: expires });
            }
        };

        /**
         * Function display Cookie preference panel on the screen
         * @public
         * @method
         */
        show = function () {
            var p = document.getElementById('huk_cookie_prefernce_panel');
            if (p) {
                p.style.display = 'block';
            } else {
                createPanelUI();
            }

            $('.cookie-functionalList').show();
            $('.cookie-init').hide();
        };
        /**
         * Function hide Cookie preference panel on the screen
         * @public
         * @method
         */
        hide = function () {
            var p = document.getElementById('huk_cookie_prefernce_panel');
            if (p) {
                p.style.display = 'none';
            }
        };

        loadScript = function (source) {

            var head = document.getElementsByTagName('head')[0];

            var script = document.createElement('script');
            script.src = source;
            script.type = 'text/javascript';
            head.appendChild(script);
        };
        /**
         * Function toggle Cookie preference panel on the screen
         * @public
         * @method
         */
        toggle = function () {
            var p = document.getElementById('huk_cookie_prefernce_panel');
            if (p) {
                p.style.display = (p.style.display === '' || p.style.display === 'block') ? 'none' : 'block';
            } else {
                createPanelUI();
            }
        };

        toggleOptions = function () {
            var p = document.getElementById('huk_cookie_prefernce_panel_ex'),
                overlay = document.getElementById('ck-overlay');
            if (p) {
                p.style.display = (p.style.display === '' || p.style.display === 'block') ? 'none' : 'block';
                overlay.style.display = (overlay.style.display === '' || overlay.style.display === 'block') ? 'none' : 'block';
            } else {
                createExtenedPanel();
            }
        };

        return {
            setup: function (options) {
                config = options;
                if (!EU.Cookie.get(AppConfig.optin_cookie_name)) {
                    if (options && !options.test) {
                        createPanelUI();
                    }
                }
            },
            show: function () { show(); },
            hide: function () { hide(); },
            toggle: function () { toggle(); },
            toggleOptions: function () { toggleOptions(); },
            loadScript: function (o) { loadScript(o); },

        };
    }());
    /**
     * @class Cookie
     * Cookie optin / optout management class. The class allows user to subscribe / unsubscribe from
     * storing cookie information.
     * @extends EU
     * @singleton
     */
    EU.Cookie = (function () {
        /**
         * Function will return the value of the cookie if exists
         * @param {String} name The name of the cookie you want to retrieve.
         * @return {String} value
         * @method
         */
        function get(name) {
            var start = document.cookie.indexOf(name + "="),
                len = start + name.length + 1,
                end;
            if ((!start) && (name !== document.cookie.substring(0, name.length))) {
                return null;
            }
            if (start === -1) {
                return null;
            }
            end = document.cookie.indexOf(';', len);
            if (end === -1) {
                end = document.cookie.length;
            }
            return unescape(document.cookie.substring(len, end));
        }

        function canUseFunctional() {
            var cookieMask = EU.Cookie.get(AppConfig.optin_cookie_name);
            if (EU.Cookie.hasSubscribed()) {
                var cookieOptions = cookieMask.split('');
                return cookieOptions[1] === '1';
            }
            return false;
        }
        function canUsePerformance() {
            var cookieMask = EU.Cookie.get(AppConfig.optin_cookie_name);
            if (EU.Cookie.hasSubscribed()) {
                var cookieOptions = cookieMask.split('');
                return cookieOptions[2] === '1';
            }
            return false;
        }
        function canUseTargeting() {
            var cookieMask = EU.Cookie.get(AppConfig.optin_cookie_name);
            if (EU.Cookie.hasSubscribed()) {
                var cookieOptions = cookieMask.split('');
                return cookieOptions[3] === '1';
            }
            return false;
        }

        /**
         *
         * Function to set a browser cookie
         * @param {String} options.name The name of the cookie you want to store.
         * @param {String} options.value The value of the cookie you want to store.
         * @param {Number} options.expires The expiry date for the cookie in days.
         * @param {String} options.path Path where you want to store cookie information
         * @param {String} options.domain Domain or subdomain where the cookie is going to be stored.
         * @param {Boolean} options.secure If you want to store cookie as a secured cookie.
         * @return {Boolean} success
         * @method
         */
        function set(options) {
            //-console.log('-> EU.Cookie.set()');
            var today = new Date(),
                expires_date,
                escaped_value,
                cookie_string;
            today.setTime(today.getTime());
            if (options.expires) {
                options.expires = options.expires * 1000 * 60 * 60 * 24;
            }
            expires_date = new Date(today.getTime() + (options.expires));
            cookie_string = options.name + '=' + escape(options.value) +
                ((options.expires) ? ';expires=' + expires_date.toGMTString() : '') +
                //enable in production
                //';domain=www.praktiker.gr;path=/'+
                //((options.path) ? ';path=' + options.path : '') +
                //((options.domain) ? ';domain=' + options.domain : '') +
                ((options.secure) ? ';secure' : '');
            document.cookie = cookie_string;
            return (get(options.name) === options.value);
        }
        /**
         * Function to delete the cookie
         * @param {String / Array} cookies list that need to be removed.
         * @method
         */
        function trash(cookies) {
            if (typeof (cookies) === 'string') {
                document.cookie = cookies + '=' +
                    ((AppConfig.path) ? ';path=' + AppConfig.path : '') +
                    ((AppConfig.domain) ? ';domain=' + AppConfig.domain : '') +
                    ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
                return true;
            } else if (typeof (cookies) === 'array') {
                var tc = cookies.length, i;
                for (i = 0; i < tc; i += 1) {
                    document.cookie = cookies[i] + '=' +
                        ((AppConfig.path) ? ';path=' + AppConfig.path : '') +
                        ((AppConfig.domain) ? ';domain=' + AppConfig.domain : '') +
                        ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
                }
                return true;
            }
            return false;
        }
        /**
         * Function will allow user cookies to be stored for tracking purpose and third party scripts.
         * @return {Boolean} subscribed
         * @method
         */
        function subscribe() {
            //-console.log('-> subscribe');
            return true;
        }
        /**
         * Function optout user from storeing cookie information.
         * @return {Boolean} unsubscribe
         * @method
         */
        function unsubscribe() {
            //-console.log('-> unsubscribe');
            return true;
        }
        /**
         * Function will check if the user has already subscribed to optin cookies
         * @return {Boolean} unsubscribe
         * @method
         */
        function hasSubscribed() {
            var c_value = get(AppConfig.optin_cookie_name);
            if (c_value !== null && c_value !== '0') {
                return true;
            } else {
                return false;
            }
        }
        /**
         * Function initilizes and check optins
         * @alternateClassName MyDuck
         * @deprecated
         * @method
         */
        function init() {
            //
        }

        return {
            init: function () { init(); },
            hasSubscribed: function () { return hasSubscribed(); },

            getLevel: function () { return getLevel(); },
            unsubscribe: function () { unsubscribe(); },
            subscribe: function () { subscribe(); },
            set: function (o) { return set(o); },
            get: function (n) { return get(n); },
            trash: function (o) { return trash(o); },
            canUsePerformance: function () { return canUsePerformance(); },
            canUseFunctional: function () { return canUseFunctional(); },
            canUseTargeting: function () { return canUseTargeting(); }
        };
    }());
    /**
     * @class CookieManager
     * Class manages optin / optout subscrition for the user on the site.
     * @extends EU
     * @singleton
     */
    EU.CookieManager = (function () {
        /**
         * Initilize the Cookie panel and turns on the cookie panel
         * @method
         */

        function init(options) {
            AppConfig = EU.Utility.extend(AppConfig, options);
            //console.log(AppConfig);
            EU.CookiePreferenceUI.setup(options);
        }
        return {
            init: function (options) {
                init(options || {});
            }
        };
    }());
    //window.EU = EU || {};
    exports.EU = EU;
}(window, jQuery));


$(document).ready(function () {
    $('iframe[data-consent="functional"]').each(function (e) {
        if (EU.Cookie.canUseFunctional()) {
            $(this).attr('src', $(this).attr('data-src'));
        }
        else {
            $(this).hide();
            $('<div class="blocked_content"><div><h2><i class="fa fa-warning text-light-yellow"></i> Προσοχή</h2><p> Για να μπορέσετε να δείτε το περιεχόμενο θα πρέπει να ενεργοποιήσετε τα cookies λειτουργικότητας. Μπορείτε να δείτε τις ρυθμίσεις σας πατώντας <a class="bluelink" href="javascript:void(0)" onclick="EU.CookiePreferenceUI.show()">εδώ</a> </p></div></div>').insertAfter($(this));
        }
    });
    $('iframe[data-consent="targeting"]').each(function (e) {
        if (EU.Cookie.canUseTargeting()) {
            $(this).attr('src', $(this).attr('data-src'));
        }
        else {
            $(this).hide();
            $('<div class="blocked_content"><div><h2><i class="fa fa-warning text-light-yellow"></i> Προσοχή</h2><p> Για να μπορέσετε να δείτε το περιεχόμενο θα πρέπει να ενεργοποιήσετε τα cookies Διαφήμισης. Μπορείτε να δείτε τις ρυθμίσεις σας πατώντας <a class="bluelink" href="javascript:void(0)" onclick="EU.CookiePreferenceUI.show()">εδώ</a> </p></div></div>').insertAfter($(this));
        }
    });
    $('script[data-consent="functional"]').each(function (e) {
        if (EU.Cookie.canUseFunctional()) {
            $(this).attr('src', $(this).attr('data-src'));
        }
        else {
            if ($(this).parent().hasClass('entry_share')) {
                $('<div class="blocked_content"><div><h2><i class="fa fa-warning text-light-yellow"></i> Προσοχή</h2><p> Για να μπορέσετε να έχετε όλην τη λειτουργικότητα της σελίδας θα πρέπει να ενεργοποιήσετε τα cookies. <br/> Μπορείτε να δείτε τις ρυθμίσεις σας πατώντας <a class="bluelink" href="javascript:void(0)" onclick="EU.CookiePreferenceUI.show()">εδώ</a> </p></div></div>').insertAfter($('.landing-offer-media'));
            }
            else {
                $('<div class="blocked_content"><div><h2><i class="fa fa-warning text-light-yellow"></i> Προσοχή</h2><p> Για να μπορέσετε να έχετε όλην τη λειτουργικότητα της σελίδας θα πρέπει να ενεργοποιήσετε τα cookies. <br/> Μπορείτε να δείτε τις ρυθμίσεις σας πατώντας <a class="bluelink" href="javascript:void(0)" onclick="EU.CookiePreferenceUI.show()">εδώ</a> </p></div></div>').insertAfter($(this));
            }
        }
    });
    //$('iframe[data-consent=""]')
});