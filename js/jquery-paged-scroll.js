/*global console:false */
/*
 * jQuery paged scroll  - different approach for infinite scroll
 *
 * Copyright (c) 2013 Dmitry Mogilko
 * Licensed under the MIT license.
 */

/*
 /* Finish now
 TODO  : create page with examples,aka demo page in github,find logo images.
 TODO  : horizontal scroll.
 TODO  : option to disable scroll
/* Finish later
 TODO :  qunit ,simulate scroll - http://stackoverflow.com/questions/6761659/simulate-scroll-event-using-javascript
 TODO :  think about  giving option of calculating trigger on last element of the binder,may be use waypoints plugin.
 TODO  : think about disabling scroll until targetHtml is changed or callback called.

 */
(function ($, window, document, undefined) {
    'use strict';

    /*
     Constructor
     */
    $.ajax_scroll = function (element, options) {

        this.settings = $.extend({},$.ajax_scroll.defaults, options);

        /*
         check if we have everything valid before we start
         */
        this._validate(this.settings);

        /*
         init plugin
        */
        this.timerInterval = -1;
        this.lastDocHeight = 0;
        this.proccesingCallback = false;
        this.lastScrollPosition = 0;
        this.lastHtmlLength = $(this.settings.targetElement).html().length;
        this.instanceID = "paged_scroll" + Math.round(Math.random() * 9999999999);
        var $this = this;

        /*
            create on scroll event handler
         */
        var scrollProcess = (function ($this) {
            return function () {
                if ($this.settings.useScrollOptimization) {
                    if ($this.timerInterval === -1) {
                        $this._debug("Setting timeout:", $this.settings.checkScrollChange);
                        $this.timerInterval = setTimeout(function () {
                            //$this.debug("Running after timeout:");
                            $this._checkScroll(element, $, window, document, $this.settings);
                            $this.timerInterval = -1;

                        }, $this.settings.checkScrollChange);
                    }
                    else {
                        //$this._debug('Ignore this scroll...And saving all the DOM access and calculations');
                    }

                }
                else {
                    $this._checkScroll(element, $, window, document, $this.settings);
                }
            };

        })($this);

        //bind on scroll
        $(element).on('scroll', scrollProcess);
    };

    /*
     Plugin defaults
     */
    $.ajax_scroll.defaults = {

        /*
         required
         your  callback which called which will be called with current page number
         */
        handleScroll:function (page, container, doneCallback) {
            return true;
        },

        /*
         required
         amount of pixels or amount of percent of container (calculated to pixel by plugin) from bottom, to start scroll
         */
        triggerFromBottom:'10%',

        /*
            html to show when loading
        */
        loading : {
             html  : '<div class="infscr-loading" style="margin-top:15px"><div class="inf-wrap"><img alt="Cargando..." src="data:image/gif;base64,R0lGODlhTwBPAPf/AKi5zq+90XbR7rPB1EZsmFl7ogC85RRMgQCn3TzE6MPO3WuHq5La8I7Y75nc8au6z9jf6LbC1dPv+ZSpwWeFqXvS7tPb5UNplo6jvvv7/AtGfq690CxZigRDfBRKgBhNgvj5++fr8erv9CZViHaQsWODpzlikTBcjPr7/A9Jf6280Pz8/RtPg7rI2ClXiQBDfOHn7ougvGyIrARFfYmevNPb5m2JrDJejtvi6pitxDtkkvn6+/Hz9/Hz9r3J2RpOg0Vrl0JoleDm7ZuuxQZEfU9ynENplUlwmmOBpuTq8Fh6oXiRsld4oHGMrnqTtB5RhUBnlKa3zCRViJ+yyAZGftbe5ydWibnF1zxlk9Xd5yBShqO0yh1QhYyhvSxbi19/pT9mlC9bjOLo79La5LG/0pesxLfF1qy7zxBKgH2WtiVUhypZitTc5jFdjb7K2iNTh3GNr2KApg1Hfz1mky1aiwCd2QCd2WSCp56xx42ivSJShjZhkDRgj4KZuHSOsKKzyX6Xtoeeu1J1nniSsxJLgYCZt4qhvDNfjzRejvz9/Vx8o159pIqfvDhhkMfS30xxm5GnwMjT37rG152wxoSbuZClv9HZ5GCApX2WtRVNgmqGquvu83yVtbvH2HmTs8DL29ng6enu83WPsJqtxXKOr87Y41B0nYWcuvn9/l5+pDpjkRtPhL/K2lF1nf7+/l19o8zW4s3V4VV3n+zw9ai3zZyvxsnT4ACe2URql0pumbC/0lR2nlBznJarw8XQ3ZKowG6KraW2zIScuYadu1Z4oJWqwoOauLzI2UltmWaEqWWDqMrU4NDY44nX72+LrcvV4XuUtHCLrk1ym/Dy9bbE1vL09/Dy9qm4zfb3+eXr8YXV7/P1+P7//+Xp8HeRstHv+Zzd8cHM2/X8/ufs8sHN3IfW75Clv8Lp96KzygCu4Fd5oeb2+1vK6vv+/9zy+tbd5zdikILV79zi67nH2Pn6/CFRhczU4fr6/ACi24HU7qCyyKGzyQCx4f///wBCe////yH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpGMDI3QjhDMUFEN0UxMUU1QTk2NUZBRTA4QkMwODk1NCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpGMDI3QjhDMkFEN0UxMUU1QTk2NUZBRTA4QkMwODk1NCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkYwMjdCOEJGQUQ3RTExRTVBOTY1RkFFMDhCQzA4OTU0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkYwMjdCOEMwQUQ3RTExRTVBOTY1RkFFMDhCQzA4OTU0Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEBQgA/wAsAAAAAE8ATwAACP8A/wkcSLCgwYMDQSSJNMUPkwsc/HG4wAROGR9CQCDcyLGjR4QZatAY4a+kyZMoS46gUSPDx5cwOeJw0iGlzZslOzjBEbPnyxVkWOAcOvQDmRU+kxbMECUF0adDU0RxqdRniwNQsw490KIqTBFAtIodCkSE144qxqodquLswQwl1sq9WYKq2388bszdm/IGj7shPvAdfPJDiLNiNBBeXFIDjKohFDNmrOGwzx5YJ08+0KNnhoiaNXOw+zFu6NAlYG44zXrDRxGsY5vtGDb26QsdJdmOfWUjCg+7WXtAgRBP8NiTDu6YcZz1jB0GzzSP3bag0OmnWRTMgj02G4I2urP/ljEwg/jYVKucZ11FYIz1p2MIdAE/9Ih/IOqfBgFDf2gYbvinmQ85CDhZDuEZuJgNSii4WBFBOEgYB/RJyBdwFg5WYYZyeRAhh3Jx0CCIaxUhA4lr2VAgimPlECCLYvnQH4xaZUSjVhpteCNO9/3z3o5DyfePBUAONYZA5hV5k10nKokSeQNx5+RJ3xEk2JT+aFfQA1j6c4ZBy03ZAXQGDTHlEAj9puRwG12hpBkdXQAkbh3BtuMmH61Go2svmYZiajB9huJoPWEGImdJRZZhZVUlJqFjZ4WQmYAHWHYWDycIeMJfd/2TARL6IUFap2mtV12nBYkgJ3YXzIbqQVcdQsfVqx2hsIVTrKWwBXG0erRCAFcy9sEGSPUaEw5L1LRXB0vwZKxSIY001kotPdupQo5M0cQRJyimwQlHNHFRRsYGBAAh+QQJCAD/ACw0ABMAGwAiAAAI/wD/CRxIsOC/FzPQEPIwz6DDgh1SPAmjYw4iNfUeakyh5QSWCyCxnNCiT6NBD2oQQQHJEswNK/RMDtQwUQfLm2DaDJApEOWNlTdZ7oHniiehlEGCCrVSxaiUQ0mVXthjxY/TQ0akXmjk4gMKmYSeZpW6p+s7mQdGYNVa9oNMKly82NSKJcxEkzNW0VGl9YIOuxpMvvjgYk9fHXRWUZGJUqVUI3xGHHghk6ZcqXNO6EnBs8OPNSakquLAggjPf2j0tAETFMpFD6f/Efkc+ubfJ4FPE2HBga9tL1wWn4Z7+TeX3DI9r2mk1AjVTJRlyun4UakO4MI1zl4+NmgQqh9MG118oYG3iah9oZjg4I1gh9RtsHTvy9LIGYEv0LxpM4d+X3v/TBdGdf5pNc50HhVI3w4cndCfglIR80+DD0IYFDoTdlShhSzhkKGDHAa1wj/lWXGICSimqOKKK1IiUEAAIfkEBQgA/wAsAAAAAE8ATwAACP8A/wkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZsN/enc2cGDmjVWuFDZSdTfFZz/dlLRA+WLE2MLjlgpStQDCpz+Xmi5cKdQHgwYCiExwuUFVZ2TcL6wcmTBMLBwhVFAJqXD2Rk7brKAcikN3L+UlAHRc9afipsjcmkK9BduniatTpilyuKmi7Y0GsOFI6iN3bNsbK55JIORZrCcPReWIZp0jNMY/MhCNKOwvww1R8t4fZrUrhtEbFeh+YJOEWCGYPsGbjsGzUxYFnGCjQHQJSirbI+gSUiHIk/U01z/Z2HbH4iZRG7sIkUd2isdB8rDoGlFMWPNXZzx8vK5sA+aP4DxhV+a9XEHLlqU508ONGnABxMknLZEASagoaANNPnzBgHKUNJYIFFZMZltRWQox4MR/pXGF2D8oKA/HGSIRiNKLNEYJ4tgkcmLHmQInXSNYZLKHC6+2OCDonz1VxeQnRBceT3OxIURSBRyGo5zfKBgjDKlwAcxoiSnGSOpyVFeiS918IMJBSyRGXUYBEKCEo180B9RGLZExRu4lABIF3A2ZggmcQShxZM7MbjSDGoQkEwfSgaqWR6A3HHBoTv9l9ILXAQRByCRSgpbF1j+YJYQKk1ZpaisCpmleSo9XcFVH6yKumKL28U6a62S3vqDc7reQSuvcPo6xkqyCktssSz+gJtKawoiAwnUVmvttdhiqwkvfPiB1LfghivuuOSWa+656Kar7rrstuvuu/DGK++89NZr77345ntvQAAh+QQFCAD/ACwgABMALQAiAAAI/wD9CRxIsKA/IiwO6TDBQY7BhwWv/JsIsaCcNq+6RCBXS4aJiiA9oKAIsoMXJJBYjbFggZW5SxxegIQ4iSTEDiZk1HLEsqevHJr4dJhpcMaOfyBHvMrToqdTchNKnCBqUAXSio0WDInktOeYYN5wDaU6kMVViKpsTFrWtSetQQSIkCXIBqQOZ3hitWX5Nu7cgTJAYok2BdZeCwCg5dLwl+rgwocBeCJApfHMF1Dg/CkV2QmyypYr6lHCyMxhC8cwLLISuuIqWacGnG6R59WI1hCpEPAE4PSAQEye4IZoQqutvcy2iDIydnhBNYq6dNob7hcSL84fepCWRsVeXcZafezI/rBNsmIKutrqaEIm+YLbAW3o2qKLIinvDX4w1UdXVzOMKKFHfgXpoQ4NpjkliSEFqEHgQB480t1KTlkSxRJAzPCgP2t8YQ4rewFYwBsPZvIIJipw1lYstEzmAXkdqCEIJbqwdZoFtmxQCC9vNNeYHDfcAUkLzNzYVSlXmJOKF6CRpcEhFPTyCYVGtmXJMZDEEYaGM3XAQSrmtGBJlUZaIqIU7kHU4YdktnmFIYqQWBEdcUDySZtkdmIffnPWeSeeRup5H0h02glooHsS6uehNwrKJ0RStOIJHhtUaumlmGaa6RCiPCIcRDIEBAAh+QQFCAD/ACwYABMAKwApAAAI/wD9CRxIsKA/FkWc3DDIsKFDgzd+gXLVr8bDixgFosGzop9Hj0OIZBxZEM2zjyj7tfBAsmWMlCk3tCQJCybKRGhmZoRgE+UPnRiF9Pz4E+jDJEM90jF6NGm/N0wbzpjlVEpUhoOc9jN31WAJrTG6FnxDMSkwsQUtJZ1GCC1BSkmjuCUIJqmsuQQj9BzTAe9AIz0D+R0oqOegwQJJ9Cwk8IamU6dIGHlxFUpHm9iaZIGZzdABpqO09gxVBKgpqqJtZrBB8sAgUKmTJjKFsc2QarG1dmPZkEOwy7m1AmKYohiI4LFBMQyNPLcLg3+a5yYGXXrsBdWti46TXbtTKAaHWT4YT768eWvIt82Iegk5gKsvauROpKNrkUSxe6EVltqXBreYANcTNby5RUApo5FC2WBHjBJLEqFUcc0XKWAUEAAh+QQFCAD/ACwsAC0ACwALAAAIPQD/rQP3r6DBguLS2Wl28KA2O3bKNTTYDKK2iQUbQIyH8R8DiBU6frQTEiODW3YEiESpEqODWwk6/jvHLSAAIfkEBRQA/wAsLAAtAAsACwAACD0A/wkcKBCVAFQEB6IyYCdBwn8L7SCQkDAfw4kP/0mkSBAVP4HsEkbE9zAigm8iGeJDmZBbgpMZ/7VzFzMgACH5BAUIAP8ALAwAEwAxACkAAAj/AP0JHEiwoD8iLA7pMMFBjsGHECNGlNPmVZcI5GrJMCGxo8eCHbwggcRqjAULrMxd4vDio0uIHUzIqOXopE1fOTTx6fCy58ARr/K0sElUwYQSJ3z6bLRgSCSiNscE84aLp1KXqmxMWgbVJq1BBIhcdanDGZ5YXU9+DTv2I5ZoU2CltfAAWi4NbT2+jTsXgCdkVPJKfAEFzp9SfZ0AFhxRjxJGZuZaOIZhkRXGEFfJOjVAcos8r0ZgfkgFmScAkqkFYvJk9EMTTW2lZbZFlBGrrgmqUdSlU9pwv5B4yW3Qg7Q0KtLqMtbqA3GDbZIVUwDVlkYTLZ8TNA5oA9QWXRRJ3NFe8IOpPrqgmmGkRA95gnrU0YhMVJIhRWreC/TwCLlJopZEsQQQM+i3xhfmsJLWegW88V4mj2CiAmJdxUKLJwR4QFwHaghCiS5cSWaBLRsUwssbuLUlxw13TNACMyJCVcoV5qTiRWBXaXAIBb188l+MXVlyDCRxhFHgSx1wkIo5LVgCZIyWMChFdh4dmOCTWF5hSIMu0REHJJ9g+WQn4Y33kZdgigkkmeJ1+WWYaorIppkeoQlnnHPN6ZIUrXiCxwaABirooIQSOoQoj7Sm36KMNuroo5BGKqlLAQEAIfkEBQgA/wAsAgATAC0AIgAACP8A/wmU5K+gwYMFO3hQs8YKFyoII0o8KBCFh4n+qOiB8sWJsQVHrGAcSfEfnokvtFy4UygPBgyFkBjh8oLkyH87Zkh8YeXIgmEvgwqjgExKB5sT/52ZyALKpTRBo1JSBkQPUon/WEwckUtToKhB8zRpdaLm1YNZMLrwSQNsUDiC2hw9a9AGxjWPZDBy+xKuXLpI8cqIwReDH1mIdAImKZgwX1K7bhBZPPIFnSLADBWGLJkyxkxYFnEqjAHQJSirPE8kpEORJ9JpTmtVHZHIjV2kSEN7peMAbYlWun5128UZLy9zfx/8AeYLVLd97uDSojyiBj5MSPBdUsAEmuoR3xDZUEYJbCCQVsyCNygHu/aoab6A+bEeIZpGSpaA5bQIS6b6B4EmGliYpDIHfQD6cx0TorgUVRdjnTAZgFwYgUQhfPE3xwcApsAHMaJo5hYjfslRXQc/mFDAEm2RhkEgJCjRyAfJAUbFG7iUAEgXLoJlCCZxBKHFhFfNoAYyyfThYI9u5QHIHRcMadMLXAQRByBLMllYFxr+oJ5EFV6o5ZgFbjjSEyv1MaaW8c13ZpprMtkmghOheYeacbo455t35qmnfHRKRIIJgshAwqGIJqroootqwgsfvmEUEAAh+QQFCAD/ACwAABMAJQAiAAAI/wD/CRwo8MUMNIQ8yOkw0J/Dh/4ISpw4MMWTMDrmIFLj4R/EjxRDCtyn5QSWCyixnNAi56NLkRLvuUAEBaVNMDfeoHnhEiLMgQMw2hwKpo2eFD0f/vznis+NmkNt7rGSKalSmBDUIAoSVaqVDzyt/hQl5RDXrhemgrUaESahskbQXmjk4kMHtj/fHoqLdk/dsEl/HhixV67ftWJFhuHiRYfcC1jCPGmZOOSMVXRUPdYhWQNekS8+uNizmc4qKp9FetAKNaoRPiMOAO75U8OTxmjnnDiaWmSHH2tMoFXFgQWR3iLR6GkDJiqUjR7Ytv1JBLjwoZyfeK5MnQUHzdi9cJZBzR0mFcaOw3PZHnjp7zWNuhqZmmn2y59ySp7sqkM8+fYiVQcfX1EFodZx5RFEAgcmnPUYFCYUp4F9IEl0BoGP2WQEZ1qkQKFPAz2T4WMqdfjhVeOM+NiG4rGX1A4qZtjfengpccE/MfLXGV7o3JhjVNm5+JI8Pv5oU5B4rVCkkRcgmRgl/5gg5ZRUVknlDSP88F9PAQEAOw==" /></div><div>CARGANDO MÁS AMIGOS...</div></div>'
        },

        /*
         required
         element where content will be inserted
         */
        targetElement:null,

        /*
         optional,default is 0
         page number to start with
         */
        startPage:0,

        /*
         optional
         null means infinite scroll
         */
        pagesToScroll:null,

        /*  optional
         before page hook ,if returns false execution stops
         */
        beforePageChanged:function (page, container) {
            return true;
        },

        /*
         optional
         after page scroll calback
         */
        afterPageChanged:function (page, container) {
            return true;
        },

        /*
         optional
         NOT RECOMMENDED to CHANGE!!!
         default : true
         if scroll optimization used ,plugin will not access DOM each time scroll is triggered and will save a lot of overhead,because of not calling callback logic each time
         */
        useScrollOptimization:true,

        /*
         timeout in milliseconds to use in order to check  if scroll change is significant enough to call the "handleScroll" callback
         */
        checkScrollChange:500,

        /*
            frequency to check that target html is checked
        */
        monitorChangeInterval : 300,

        /*
         if monitor target element where finally generated content is inserted

         */
        monitorTargetChange:true,
        /*
         if use debug
         */
        debug:false
    };

    /*
     Use prototype to optimize multiple instances
     */
    $.ajax_scroll.prototype = {

        _calculateStep:function (settings) {
            return (settings.triggerFromBottom.toString().indexOf('%') > -1) ? parseFloat(settings.triggerFromBottom.replace('%', '')) : parseFloat(settings.triggerFromBottom);
        },

        _validate:function (settings) {
            var step = this._calculateStep(settings);
            if (isNaN(step)) {
                throw "Step need to be provided as number or percentage,50 or 5% fro percent for example";
            }
            if (!settings.targetElement || $(settings.targetElement).length === 0) {
                throw "Please provide the selector of target element.(Element where you finally insert the new content)";
            }

        },

        _checkCallbackDone : function(settings,loadingHtml){
            this._debug("Checking target html for change...");
            if (settings.monitorTargetChange && $(settings.targetElement).is(":visible") ) {
                var lastHtmlLength = $(settings.targetElement).html().length;
                if (lastHtmlLength !== this.lastHtmlLength) {
                    this._debug("Html is changed");
                    this.lastHtmlLength = lastHtmlLength;
                    this.proccesingCallback = false;
                    $(loadingHtml).hide();
                }
                else{
                    var $this = this;
                    this._debug("Html is not changed.Check later");
                    setTimeout(function(){$this._checkCallbackDone.call($this,$this.settings,loadingHtml);},$this.settings.monitorChangeInterval);
                }

            }
        },

        _getScrollData:function ($, element, window, document, $this, settings) {
            var elemHeight = parseFloat($(element).height()) , elemScroll = parseFloat($(element).scrollTop()),
                isWindow = (element.self === window) , docHeight = isWindow ? parseFloat($(document).height()) : elemHeight,
                step = docHeight / $this._calculateStep(settings);
            return {elemHeight:elemHeight, elemScroll:elemScroll, isWindow:isWindow, docHeight:docHeight, step:step};
        },

        /*
            plugin logic which check if we need to call the callback
        */
        _checkScroll:function (element, $, window, document, settings) {
            this._debug("Checking scroll on  : " + this.instanceID);
            var $this = this;
            //if element on which content is inserted became not visible don't do exit
            if (settings.targetElement && !$(settings.targetElement).is(":visible")) {
                $this._debug("Ignoring the call because target element is not  visible.Exit scroll check ..");
                return;
            }

            /*
                check if callback is still in process
             */
            if ($this.proccesingCallback) {
                $this._debug("Processing callback.Exit...");
                return;
            }


            /*
                get all scroll data in order to understand if we at requested scroll point
            */
            var scrollData = $this._getScrollData($, element, window, document, $this, settings);
            var elemHeight = scrollData.elemHeight;
            var elemScroll = scrollData.elemScroll;
            var isWindow = scrollData.isWindow;
            var docHeight = scrollData.docHeight;
            var step = scrollData.step;

            $this._debug(["Elem height : ", elemHeight, ".Elem scroll :", elemScroll, ".Step is :", step, ".DocHeight :", docHeight, ".Last element height:", $this.lastDocHeight].join(""));
             /*
                calculate  window height + scroll  + step
             */
            var position = isWindow ? elemHeight + elemScroll + step : elemScroll + step;
            $this._debug("Position:" + position + ".Last position:" + $this.lastScrollPosition + ".Last element height:" + $this.lastDocHeight);
            var isPos = (position > $this.lastScrollPosition);
            /*
             understand if we have infinite pages number to scroll and if not, understand we are still not scrolled maximum o page requested.
             */
            var isPageMax = !settings.pagesToScroll || (settings.pagesToScroll && (settings.startPage < settings.pagesToScroll));


            /*
             check that we are at the requested scroll position
             */
            if (position >= docHeight) {
                /*
                 don't handle scrolling back to top and also check if we got to maximum pages to scroll
                 */
                if (isPos && isPageMax) {
                    this.lastScrollPosition = position;
                    this.lastDocHeight = docHeight;
                    settings.startPage = settings.startPage + 1;
                    settings.beforePageChanged(settings.startPage, element);
                    $this._debug("Calling 'handleScroll' callback");
                    $this.proccesingCallback = true;
                    var loadingHtml = $($this.settings.loading.html).appendTo($($this.settings.targetElement));
                    $this.lastHtmlLength = $(settings.targetElement).html().length;
                    settings.handleScroll(settings.startPage, element, function () {
                        $this._debug("Callback done.");
                        $this.proccesingCallback = false;
                        loadingHtml.hide();
                    });

                    $this._checkCallbackDone.call($this, $this.settings, loadingHtml);
                    settings.afterPageChanged(settings.startPage, element);


                }

            }
        }, ///check scroll

        /*
         borrowed from  paul irish infinite scroll : hhttps://github.com/paulirish/infinite-scroll - make use of console safe
         */
        _debug:function () {
            try
            {


            if (!this.settings.debug) {
                return;
            }

            if (typeof console !== 'undefined' && typeof console.log === 'function') {
                // Modern browsers
                // Single argument, which is a string
                if ((Array.prototype.slice.call(arguments)).length === 1 && typeof Array.prototype.slice.call(arguments)[0] === 'string') {
                    console.log((Array.prototype.slice.call(arguments)).toString());
                } else {
                    console.log(Array.prototype.slice.call(arguments));
                }
            } else if (!Function.prototype.bind && typeof console !== 'undefined' && typeof console.log === 'object') {
                // IE8
                Function.prototype.call.call(console.log, console, Array.prototype.slice.call(arguments));
            }
        }
        catch(e){

        }


        }



    };

    /*
     create scroll instances
     */
    $.fn.paged_scroll = function (options) {
        return this.each(function () {
            var instance = new $.ajax_scroll(this, options);
            $.data(this, 'jqueryPagedScroll', instance);
        });
    };


}(jQuery, window, document));
