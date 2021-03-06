import Router from './js/app-router.jsx';
import Model from './js/app-model.jsx';

import MainPage from './js/views/main.jsx';

import './scss/app.scss'

window.app = {
    init ($el) {
        this.model = new Model();
        this.router = new Router();
        this.main = new MainPage({
            el: $el,
            model: this.model
        });
        if (!window.defaultView) {
            this.router.history.start({pushState: false});
        } else {
            this.model.view = window.defaultView;
        }
    },
    config: {
        baseUrl: ''
    }
};



window.addEventListener('DOMContentLoaded', () => {
    const $el = document.querySelector('#content');
    if (null !== $el) {
        window.app.init($el);
    }
});
