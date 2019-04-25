'use strict';
import angular from "angular";
import '../sass/main.scss';
import app from './app';

//LOCALHOST comes from webpack
app.constant('isLocalHost', {'value': window.location.hostname == 'localhost'});

angular.element(function() {
    angular.bootstrap(document, ['app']);
});