const { Readable } = require('stream')
  , ReconnectingWebSocket = require('reconnecting-websocket')
  , Html5WebSocket = require('html5-websocket')

const VK_ERROR_CODE = 400
  , VK_SERVICE_CODE = 300
  , VK_MESSAGE_CODE = 100

class WSClient extends Readable {
  constructor(connectionString, options = {}) {
    const defaultStreamOptions =
      { objectMode: true
      , highWaterMark: 8
      }

    const defaultSocketOptions =
      { debug: false
      , omitServiceMessages: true
      , reconnectInterval: 1e3
      , maxReconnectInterval: 3e4
      , reconnectDecay: 1.5
      , timeoutInterval: 2e3
      , maxReconnectAttempts: null
      }

    super(
      { ...defaultStreamOptions
      , ...(options.stream || {})
      }
    )

    this._websocketSettings =
      { ...defaultSocketOptions
      , ...(options.socket || {})
      , connectionString
      }
  }

  _initializeSocket() {
    try {
      this._socket = new ReconnectingWebSocket(
          this._websocketSettings.connectionString,
          undefined,
          { constructor: Html5WebSocket
          , ...this._websocketSettings
          }
        )
    } catch(error) {
      return this.emit('error', error)
    }

    this._socket.onmessage = message => {
      try {
        message = JSON.parse(message.data)
      } catch(error) {
        this.emit('error', error)
      }

      if (message.code === VK_ERROR_CODE)
        this.emit('error', message.error)
      
      this.push(message.data)
    }

    this._socket.onerror = error => this.emit('error', error)
  }

  _read() {
    this._initializeSocket()
  }
}

module.exports = WSClient