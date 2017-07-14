const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./components/App.js');
const AppContainer = require('react-hot-loader').AppContainer;

const render = (Component) => {
    ReactDOM.render(
        React.createElement(AppContainer, null, React.createElement(Component)),
        document.getElementById('root')
    );
}

render(App);

if (module.hot) {
    module.hot.accept('./components/App.js', () => {
        render(require('./components/App.js'));
    });
}

