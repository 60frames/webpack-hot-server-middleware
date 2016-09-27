const React = require('react');

module.exports = () => React.createElement('div', {
	onClick() {
		window.alert('clicked');
	}
}, 'Hello World.');
