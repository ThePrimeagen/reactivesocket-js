'use strict';

var Frame = require('./../protocol/frame');
var LOG = require('./../defaultLogger');

var KEEP_ALIVE_INTERVAL = 10000;
var MAX_LIFE = 100000;
var PAYLOAD_ENCODING = 'UTF-8';
var STREAM_ID = 0;

/**
 * @constructor
 * @param {Transport} transport - should emit an 'connection' event once
 * the connection is ready to use and a stream is passed into the connection
 * event.
 * @param {Object} setupOptions - the option bag for the setup frame operation
 * upon successful connection.
 * @returns {ReactiveClient}
 */
function ReactiveClient(transport, setupOptions) {
    this._stream = null;
    this._transport = transport;
    this._pendingRequests = [];
    this._ready = false;
    this._log = LOG;
    this._processed = {};

    var self = this;
    var opts = setupOptions || {};
    opts.keepAliveInterval = opts.keepAliveInterval || KEEP_ALIVE_INTERVAL;
    opts.maxLife = opts.maxLife || MAX_LIFE;
    opts.payloadEncoding = opts.payloadEncoding || {
        data: PAYLOAD_ENCODING,
        metadata: PAYLOAD_ENCODING
    };

    // There should only ever be one connection.  When a close event happens
    // the previous stream should be closed down.
    transport.on('connection', function(stream) {
        self._stream = stream;
        self._conEstablished(opts);
    });
}

/**
 * When the connection is established, we need to process the back log of
 * items that have been requested.
 *
 * @private
 * @param {Object} opts - the setup options for the connection.
 * @returns {undefined}
 */
ReactiveClient.prototype._conEstablished = function _conEstablished(opts) {
    var setupFrame = Frame.getSetupFrame(opts.keepAliveInterval, opts.maxLife,
                                           opts.payloadEncoding, opts.payload);
    this._ready = true;

    // A setup frame is required upon connection as the *first* frame sent.  If
    // this frame is not sent first and another frame is sent, then the server
    // shuts down the connection.
    var self = this;
    this._stream.write(setupFrame, function onSetupFrameCallback(err) {
        // TODO_ERR: Here is a huge issue... What do we do
        if (err) {
            self._logError('Error on writing setupFrame', setupFrame, err);
            return;
        }
    });

    this._stream.on('data', function onDataClient(rawData) {
        var parsedData = Frame.parseFrame(rawData);
        var id = parsedData.header.streamId;
        var callback = self._processed[id];

        self._log.info('on stream data', {
            parsedData: parsedData
        });

        // The callback will get the parsed data and the processed id will be
        // removed from the collection.  If it is not removed from the
        // collection then there will be a performance and memory issue over
        // time.
        if (callback) {

            // If the parsed frame has completed (its response contains the
            // completed flag) then we need to release the callback function.
            if (Frame.isCompleted(parsedData)) {
                delete self._processed[id];
            }
            callback(null, parsedData);
        }
    });

    this._stream.on('error', function onErrorClient(err) {
        self._log('ReactiveClient', {error: err});
    });

    // Flushes the pending requests.
    var requests = this._pendingRequests;
    this._pendingRequests = [];
    requests.forEach(function forEachPendingRequest(requestTuple) {
        var methodName = requestTuple[0];
        var data = requestTuple[1];
        var callback = requestTuple[2];

        self[methodName](data, callback);
    });
};

/**
 * Takes in a payload that will be encoded and sent to the underlying stream.
 * @param {Object} data -
 * @param {string} data.data - The data to be sent
 * @param {string} data.metadata - The meta to be sent
 * @param {Function} [callback] -
 * @returns {undefined} -
 */
ReactiveClient.prototype.requestStream = function requestStream(data,
                                                                callback) {
    if (this._ready) {
        var streamId = ++STREAM_ID;
        var reqStream = Frame.getReqStreamFrame(streamId, data);
        var self = this;

        this._processed[streamId] = callback;
        this._stream.write(reqStream, function(err) {
            // TODO: this is an issue.
            if (err) {
                self._logError('Error on write reqStream', reqStream, err);
                delete self._processed[streamId];

                // calls the callback with the error.
                if (callback) {
                    callback(err);
                }
            }
        });
        return;
    }

    // We need to establish a connection then start sending the packets.
    this._pendingRequests.push(['requestResponse', data, callback]);
    this.establishConnection();
};

/**
 * Takes in a payload that will be encoded and sent to the underlying stream.
 * @param {Object} data -
 * @param {string} data.data - The data to be sent
 * @param {string} data.metadata - The meta to be sent
 * @param {Function} [callback] -
 * @returns {undefined} -
 */
ReactiveClient.prototype.requestResponse = function requestResponse(data,
                                                                    callback) {

    if (this._ready) {
        var streamId = ++STREAM_ID;
        var reqRes = Frame.getReqResFrame(streamId, data);
        var self = this;

        this._processed[streamId] = callback;
        this._stream.write(reqRes, function(err) {
            // TODO: this is an issue.
            if (err) {
                self._logError('Error on write reqRes', reqRes, err);
                delete self._processed[streamId];

                // calls the callback with the error.
                if (callback) {
                    callback(err);
                }
            }
        });
        return;
    }

    // We need to establish a connection then start sending the packets.
    this._pendingRequests.push(['requestResponse', data, callback]);
    this.establishConnection();
};

/**
 * @private
 * @param {String} msg -
 * @param {Buffer} frame -
 * @param {Error} err -
 * @returns {undefined}
 */
ReactiveClient.prototype._logError = function logError(msg, frame, err) {
    this._log.error('Error on writing request-response frame.', {
        error: err,
        frame: frame,
        streamId: this._streamId
    });
};

/**
 * Will call establish connection on the underlying transport protocol.
 * When the connection finishes, it does not matter.  So this just allows the
 * outside to dictate when the connection has been established.
 *
 * @public
 * @returns {undefined}
 */
ReactiveClient.prototype.establishConnection = function establishConnection() {
    if (!this._ready) {
        this._transport.establishConnection();
    }
};

/**
 * closes the single connection client.
 * @returns {undefined}
 */
ReactiveClient.prototype.close = function close() {
    this._stream.close();
    this._stream.unpipe();
    if (this._transport.destroy) {
        this._transport.destroy();
    }
    else if (this._transport.close) {
        this._transport.close();
    }

    this._transport = null;
};

module.exports = ReactiveClient;
