/** @jsx React.DOM */

/**
 * Module dependencies
 */

var React = require('react');
var createPlayer = require('./lib/createPlayer');
var getVideoId = require('./lib/getVideoId');
var globalize = require('./lib/globalize');

/**
 * Create a new `YouTube` component.
 */

var YouTube = React.createClass({
  propTypes: {

    // url to play. It's kept in sync, changing it will
    // cause the player to refresh and play the new url.
    url: React.PropTypes.string.isRequired,

    // custom ID for player element
    id: React.PropTypes.string,

    // autoplay the video when loaded.
    autoplay: React.PropTypes.bool,

    // event subscriptions
    onPlay: React.PropTypes.func,
    onPause: React.PropTypes.func,
    onEnd: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      id: 'react-yt-player',
      autoplay: false,
      onPlay: noop,
      onPause: noop,
      onEnd: noop
    };
  },

  getInitialState: function() {
    return {
      player: null,
      playerReadyHandle: null,
      stateChangeHandle: null
    };
  },

  /**
   * Once YouTube API had loaded, a new YT.Player
   * instance will be created and its events bound.
   */
  
  componentDidMount: function() {
    var _this = this;

    createPlayer(this.props.id, function(player) {
      _this._setupPlayer(player);
    });
  },

  /**
   * If the `url` has changed, load it.
   *
   * @param {Object} nextProps
   */

  componentWillUpdate: function(nextProps) {
    if (this.props.url !== nextProps.url) {
      this._loadUrl(nextProps.url);
    }
  },

  componentWillUnmount: function() {
    this._unbindEvents();
    this._destroyGlobalEventHandlers();
  },

  render: function() {
    return (
      <div id={this.props.id}></div>
    );
  },

  /**
   * Integrate a newly created `player` with the rest of the component.
   *
   * @param {Object} player
   */

  _setupPlayer: function(player) {
    this.setState({player: player});
    this._globalizeEventHandlers();
    this._bindEvents();
  },

  /**
   * Start a new video
   *
   * @param {String} url
   */
  
  _loadUrl: function(url) {
    if (this.props.autoplay) {
      this.state.player.loadVideoById(getVideoId(url));
    } else {
      this.state.player.cueVideoById(getVideoId(url));
    }
  },

  /**
   * When the player is all loaded up, load the url
   * passed via `props.url`.
   *
   * Is exposed in the global namespace under a random
   * name, see `_globalizeEventHandlers`
   */
  
  _handlePlayerReady: function() {
    this._loadUrl(this.props.url);
  },

  /**
   * Respond to player events
   *
   * Is exposed in the global namespace under a random
   * name, see `_globalizeEventHandlers`
   *
   * @param {Object} event
   */
  
  _handlePlayerStateChange: function(event) {
    switch(event.data) {
      case 0: 
        this.props.onEnd();
        break;

      case 1:
        this.props.onPlay();
        break;

      case 2:
        this.props.onPause();
        break;

      default: 
        return;
    }
  },

  /**
   * Expose our player event handlers onto the global namespace
   * under random handles, then store those handles into `state`.
   *
   * The YouTube API requires a `player`s event handlers to be
   * exposed in the global namespace, so this is unfortunate but necessary.
   */

  _globalizeEventHandlers: function() {
    this.setState({
      playerReadyHandle: globalize(this._handlePlayerReady),
      stateChangeHandle: globalize(this._handlePlayerStateChange)
    });
  },

  /**
   * Clean up the ickyness of globalness.
   */

  _destroyGlobalEventHandlers: function() {
    delete window[this.state.playerReadyHandle];
    delete window[this.state.stateChangeHandle];
  },

  /**
   * Listen for events coming from `player`.
   */

  _bindEvents: function() {
    this.state.player.addEventListener('onReady', this.state.playerReadyHandle);
    this.state.player.addEventListener('onStateChange', this.state.stateChangeHandle);
  },

  /**
   * Remove all event bindings.
   */

  _unbindEvents: function() {
    this.state.player.removeEventListener('onReady', this.state.playerReadyHandle);
    this.state.player.removeEventListener('onStateChange', this.state.stateChangeHandle);
  }
});

/**
 * Do nothing
 */

function noop() {}

/**
 * Expose `YouTube` component
 */

module.exports = YouTube;