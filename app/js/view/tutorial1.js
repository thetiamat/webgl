'use strict';
 
var View = require('ampersand-view');
var Matrix = require('gl-matrix');

var Utils = require('./../utils/utils');
var WebGlApi = require('./../utils/webglhelpers');
var templates = require('./../templates.js');

var Example1 = function (canvas, shaderProgram) {
    this.globject = null;
    this.canvas = canvas;
    this.shaderProgram = shaderProgram;

    var scope = this;
    this.control = null;
    //this.clock = null;
    this.fps = null;

    this.isRun = false;


    this.initData = function (sphere) {
        var verticesBuffer = WebGlApi.gl.createBuffer();
        WebGlApi.gl.bindBuffer(WebGlApi.gl.ARRAY_BUFFER, verticesBuffer);
        WebGlApi.gl.bufferData(WebGlApi.gl.ARRAY_BUFFER, new Float32Array(sphere.vertices), WebGlApi.gl.STATIC_DRAW);

        var trianglesBuffer = WebGlApi.gl.createBuffer();
        WebGlApi.gl.bindBuffer(WebGlApi.gl.ELEMENT_ARRAY_BUFFER, trianglesBuffer);
        WebGlApi.gl.bufferData(WebGlApi.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.triangles), WebGlApi.gl.STATIC_DRAW);

        this.globject = {};
        this.globject.vertices = verticesBuffer;
        this.globject.triangles = trianglesBuffer;
        this.globject.types = sphere.types;
        this.globject.buffers = sphere.buffers;

        this.globject.stride = 0;
        for (var i = 0; i < sphere.types.length; i++) {
            this.globject.stride += sphere.types[i].size;
        }
    }

    this.start = function () {
        var fpsElement = document.getElementById("fps");
        this.control = new WebGlApi.OrbitControl(canvas, 3);
        //this.clock = new WebGlApi.Clock();
        this.fps = new WebGlApi.Fps(fpsElement);

        // check if tick function is already called
        if (this.isRun === true) { return; }
        this.isRun = true;
        this.tick();
    }

    this.tick = function () {
        if (scope.isRun !== true) { return; }

        scope.fps.update();
        //var angle = clock.getElapsedTime() / 1000;
        //rotateViewMatrices(angle);

        if (scope.globject !== null) {
            WebGlApi.gl.uniform4f(scope.shaderProgram.materialColorUniform, 1.0, 0.0, 0.0, 1.0);
            WebGlApi.drawFrame(scope.shaderProgram, scope.globject, true);
        }
        requestAnimFrame(scope.tick);
    }
};

module.exports = View.extend({
    template: templates.tutorial1,
    autoRender: true,
    pageTitle: 'Tutorial 1!',
    props: {
        app: 'state'
    },
    derived: {
        '_viewportWidth': {   //  Width in px.
            deps: ['app.windowWidth'],
            fn: function() {
                return this.app.windowWidth;
            }
        },
    },
    bindings: {
        '_viewportWidth': {
            type: function (el, value, previousValue) {
                if (this.canvas) {
                    this._setPerspective(this.canvas);
                }
            }
        }
    },
    render: function () {
        var self = this;

        this.renderWithTemplate();

        // singleton
        if (!this.canvas) {
            this.canvas = this.query('#webglcanvas');
            WebGlApi.initWebGl(this.canvas);

            this.shaderProgram = this._initShaders(WebGlApi.gl, this.query('#shader-fs'), this.query('#shader-vs'));

            this._setPerspective(this.canvas);

            this.example1 = new Example1(this.canvas, this.shaderProgram);
        }

        Utils.ajaxGet('/api/getSphere', function (data) {
            self.example1.initData(data);
            self.example1.start();
        }, function (error) {
            console.log('Error is happend: ', error);
        });
    },
    initialize: function () {
    },
    _setPerspective: function (canvas) {
        var style = window.getComputedStyle(canvas);
        var width = (style.width === "")? 1: parseFloat(style.width.replace(/[^\d^\.]*/g, ''));
        var height = (style.height === "")? 1: parseFloat(style.height.replace(/[^\d^\.]*/g, ''));
        console.log(width + ', ' + height);
        //0.7854 = 2*pi/8
        Matrix.mat4.perspective(WebGlApi.pMatrix, 0.7854, width / height, 0.1, 100.0);
    },
    _initShaders: function(gl, fs, vs) {
        var fragmentShader = WebGlApi.getShader(fs);
        var vertexShader = WebGlApi.getShader(vs);
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        // get pointers to the shader params
        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.projectionMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.modelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

        shaderProgram.materialColorUniform = gl.getUniformLocation(shaderProgram, "uMaterialColor");
        return shaderProgram;
    }
});
