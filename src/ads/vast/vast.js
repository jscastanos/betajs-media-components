/**
 * This software may include modified and unmodified portions of:
 *
 * VAST Client
 *
 * Copyright (c) 2013 Olivier Poitrey <rs@dailymotion.com>
 *
 * Repository: https://github.com/dailymotion/vast-client-js
 *
 * MIT License: https://github.com/dailymotion/vast-client-js/blob/master/LICENSE
 *
 */

Scoped.define("module:Ads.VAST.VAST", [
        "base:Class",
        "module:Ads.VAST.Client",
        "module:Ads.VAST.Tracker",
        "module:Ads.VAST.Ad",
        "base:Objs",
        "base:Promise",
        "base:Events.EventsMixin",
        "base:Types"
    ],
    function(Class, VASTClient, VASTTracker, VASTAd, Objs, Promise, EventsMixin, Types, scoped) {
        return Class.extend({
            scoped: scoped
        }, [EventsMixin, function(inherited) {
            return {
                constructor: function(options, requestOptions) {
                    inherited.constructor.call(this);
                    options = Types.is_array(options) ? options : [options];
                    var vastClient, _promise, _self;
                    this.vastServerResponses = [];
                    this.timeout = 5000;
                    this.adPodTimeout = 100;
                    this.companion = undefined;
                    this.sources = [];
                    this.companion = {};

                    _self = this;
                    _promise = Promise.create();

                    vastClient = this.auto_destroy(new VASTClient(options));

                    Objs.iter(options, function(vast) {
                        if (vast.adServer) {
                            if (vast.skipAfter) {
                                _self.skipAdAfter = vast.skipAfter;
                            }
                            vastClient.getAd(vast.adServer, requestOptions, function(err, response) {
                                if (err) {
                                    var _errorMessage = 'Error occurred during loading provided link. ' + err;
                                    _promise.asyncError({
                                        message: _errorMessage
                                    });
                                } else {
                                    _self.vastServerResponses.push(response);
                                    _promise.asyncSuccess(_self.vastServerResponses);
                                }
                            });
                        } else {
                            _promise.asyncError({
                                message: 'Video Ad options are not correct, asServer are required'
                            });
                        }
                    }, this);

                    _promise.success(function(responses) {
                        this.executeAd(responses[0]);
                    }, this);

                    _promise.error(function(error) {
                        this.trigger("adresponseerror", error);
                    }, this);
                },

                executeAd: function(response) {
                    var _ad, _adIds, _crIds, _creative, _foundCreative, _foundCompanion, _self;
                    _self = this;
                    if (response)
                        for (_adIds = 0; _adIds < response.ads.length; _adIds++) {
                            _ad = response.ads[_adIds];
                            for (_crIds = 0; _crIds < _ad.creatives.length; _crIds++) {
                                _creative = _ad.creatives[_crIds];
                                _foundCreative = false;
                                _foundCompanion = false;

                                if (_creative.type === 'linear' && !_foundCreative) {
                                    if (_creative.skipDelay > 0)
                                        this.skipAdAfter = _creative.skipDelay;

                                    if (_creative.mediaFiles.length) {

                                        this.sources = this.createSourceObjects(_creative.mediaFiles);

                                        if (!this.sources.length) {
                                            _self.trigger("adcanceled");
                                            return;
                                        }

                                        this.vastTracker = new VASTTracker(_ad, _creative);
                                        _foundCreative = true;
                                    }
                                }

                                if (_creative.type === 'companion' && !_foundCompanion) {
                                    this.companion = _creative;
                                    _foundCompanion = true;
                                }
                            }
                            if (this.vastTracker) {
                                this.persistentTrigger("vastready");
                                break;
                            } else {
                                VASTAd.trackAd(_ad.errorURLTemplates, {
                                    ERRORCODE: 403
                                });
                            }
                        }

                    if (!this.vastTracker) {
                        this.persistentTrigger("adcanceled");
                    }
                },

                createSourceObjects: function(mediaFiles) {
                    var _sources, _mediaFile, _source;
                    _sources = [];
                    for (var i = 0, j = mediaFiles.length; i < j; i++) {
                        _mediaFile = mediaFiles[i];
                        _source = {
                            type: _mediaFile.mimeType,
                            src: _mediaFile.fileURL
                        };

                        if (this._canPlaySource(_source)) {
                            _sources[i] = ({
                                type: _mediaFile.mimeType,
                                src: _mediaFile.fileURL,
                                width: _mediaFile.width,
                                height: _mediaFile.height
                            });
                        }
                    }

                    return _sources;
                },

                _canPlaySource: function(source) {
                    var _ext, _mimeType, _allowedMimeTypes;
                    _allowedMimeTypes = [
                        "application/vnd.apple.mpegurl",
                        "video/3gpp",
                        "video/mp4",
                        "video/mpeg",
                        "video/ogg",
                        "video/quicktime",
                        "video/webm",
                        "video/x-m4v",
                        "video/ms-asf",
                        "video/x-ms-wmv",
                        "video/x-msvideo"
                    ];

                    if (source.type) {
                        _mimeType = source.type;
                    } else if (source.src) {
                        _ext = this._ext(source.src);
                        _mimeType = 'video/' + _ext;
                    } else {
                        return false;
                    }

                    return Objs.contains_value(_allowedMimeTypes, _mimeType);
                },

                _ext: function(url) {
                    return (url = url.substr(1 + url.lastIndexOf("/")).split('?')[0]).split('#')[0].substr(url.lastIndexOf("."));
                }

            };
        }]);
    }
);