'use strict';

var CONSTANTS = require('./../protocol/constants');
var Frame = require('./../protocol/frame');
var ReactiveServerStream = require('./ReactiveServerStream');
var SingleResponse = require('./SingleResponse');
var StreamResponse = require('./StreamResponse');
var defaultLogger = require('./../defaultLogger');

var TYPES = CONSTANTS.TYPES;

/**
 * @constructor
 * @param {Transport} transport - should emit an 'connection' event once
 * the connection is ready to use and a stream is passed into the connection
 * event.
 * @param {bunyan.Logger} logger -
 * @returns {ReactiveServer}
 */
function ReactiveServer(transport, logger) {
    this._stream = {};
    this._frameMap = {};
    this._transport = transport;
    this._log = logger || defaultLogger;

    var self = this;

    // There should only ever be one connection.  When a close event happens
    // the previous stream should be closed down.
    transport.on('connection', function(stream, uniqueIdentifier) {

        // TODO: There can be undefined streams.  Why?
        if (!stream) {
            return;
        }

        var reactiveStream = new ReactiveServerStream(stream, uniqueIdentifier);
        self._stream[uniqueIdentifier] = reactiveStream;
        self._conEstablished(reactiveStream, uniqueIdentifier);
    });

    // Establishes a connection.  For a server, this should mean starting up
    // a server.
    transport.establishConnection();
}

/**
 * @private
 * @param {ReactiveServerStream} stream -
 * @param {String|Number} id -
 * @returns {undefined}
 */
ReactiveServer.prototype._conEstablished = function _conEstablished(stream,
                                                                    id) {
    // TODO: this has been greatly reduced in complexity for now.
    // TODO: Leasing
    var self = this;
    var dataStream = stream.stream;
    dataStream.on('data', function(data) {
        var frame = Frame.parseFrame(data);

        // if header type is setup, then we need to do something special.
        switch (frame.header.type) {
            case TYPES.SETUP:
                self._setup(stream, frame);
                self._notifyListeners(stream, frame);
                break;
            default:
                // If the stream has not been setup
                if (!stream.setup) {
                    // TODO: Become very angry and rage quit connection.
                    return;
                }

                self._notifyListeners(stream, frame);
                break;
        }
    });

    dataStream.on('error', function onErrorServer(err) {
        // TODO: error handling?
        self._log('ReactiveServer', {error: err});
    });
};

/**
 * @param {ReactiveServerStream} stream -
 * @param {ReactiveFrame} frame -
 * @returns {undefined}
 */
ReactiveServer.prototype._setup = function _setup(stream, frame) {

    if (stream.setup) {
        // TODO: Should I rage quit?
        return;
    }

    stream.update(frame);
};

/**
 *
 * @param {Number} type - The type of reactive socket frame
 * @param {Function|Object} handlerOrHandlerObj - Either a function or object.
 * @returns {undefined}
 * @throws {InvalidTypeError}
 */
ReactiveServer.prototype.on = function onFrame(type, handlerOrHandlerObj) {
    if (Frame.isValidFrameType(type)) {
        throw Error('InvalidType');
    }

    if (this._frameMap[type]) {
        throw new Error('Unable to have more than one listener per type.');
    }
    this._frameMap[type] = handlerOrHandlerObj;
};

/**
 * @private
 * @param {String} msg -
 * @param {Buffer} frame -
 * @param {Error} err -
 * @returns {undefined}
 */
ReactiveServer.prototype._logError = function logError(msg, frame, err) {
    this._log.error('Error on writing frame', {
        error: err,
        frame: frame,
        streamId: this._streamId
    });
};


/**
 * notifies all listeners when an event has occurred.
 * @private
 * @param {ReactiveServerStream} stream -
 * @param {ReactiveFrame} frame -
 * @returns {undefined}
 */
ReactiveServer.prototype._notifyListeners = function _notifyListeners(stream,
                                                                      frame) {

    var type = frame.header.type;
    var callback = this._frameMap[type];

    // Nothing to do here
    if (!callback) {
        return;
    }

    var args = [frame];

    switch (type) {
        // Request responses require a single response added to the args list.
        // The single notifier allows the function to respond to the request
        // response.
        case TYPES.REQUEST_RESPONSE:
            args.push(new SingleResponse(this, stream.stream,
                                         frame.header.streamId));
            break;

        case TYPES.REQUEST_STREAM:
            args.push(new StreamResponse(this, stream.stream,
                                         frame.header.streamId));
            break;

        // Simply emit the frame to the callback functions.
        default:
            break;
    }

    callback.apply(null, args);
};

/**
 * An internal method for SingleResponse and other classes to use to respond to
 * requests made to the server.
 *
 * @private
 * @param {Duplex} stream -
 * @param {Number} streamId -
 * @param {Object} payload -
 * @param {Boolean} isCompleted -
 * @returns {undefined}
 */
ReactiveServer.prototype._respond = function _respond(stream, streamId,
                                                      payload, isCompleted) {
    var frame = Frame.getResponseFrame(streamId, payload, isCompleted);
    stream.write(frame);
};

/**
 * Closes the reactive server down.
 * @param {function} [cb] -
 * @returns {undefined}
 */
ReactiveServer.prototype.close = function close(cb) {
    var stream = this._stream;
    Object.
        keys(stream).
        forEach(function eachStreamId(id) {
            var s = stream[id].stream;
            // These streams are ReactiveServerStream which is a wrapper of the
            // underlying stream.
            s.close();
            s.unpipe();
        });

    this._transport.close(function onDone() {
        if (cb) {
            cb();
        }
    });

    this._stream = null;
    this._frameMap = null;
};

module.exports = ReactiveServer;
