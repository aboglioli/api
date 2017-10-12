import * as bodyParser from 'body-parser';
import * as mongoose from 'mongoose';
import * as config from './config';
import { Auth } from './auth/auth.class';
import * as HttpStatus from 'http-status-codes';
import { schemaDefaults } from './mongoose/defaults';
import { Express } from 'express';
import * as express from 'express';
let requireDir = require('require-dir');
let path = require('path');
import { Connections } from './connections';

export function initAPI(app: Express) {
  
    // Inicializa la autenticación con Password/JWT
    Auth.initialize(app);

    // Inicializa Mongoose
    Connections.initialize();

    // Configura Express
    app.use(bodyParser.json({ limit: '150mb' }));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        // Permitir que el método OPTIONS funcione sin autenticación
        if ('OPTIONS' === req.method) {
            res.send(200);
        } else {
            next();
        }
    });

    // Carga los módulos y rutas
    for (let m in config.modules) {
        if (config.modules[m].active) {
            let routes = requireDir(config.modules[m].path);
            for (let route in routes) {
                if (config.modules[m].middleware) {
                    app.use('/api' + config.modules[m].route, config.modules[m].middleware, routes[route]);
                } else {
                    app.use('/api' + config.modules[m].route, routes[route]);
                }

            }
        }
    }

    // Error handler
    app.use(function (err: any, req, res, next) {
        if (err) {
            // Parse err
            let e: Error;
            if (!isNaN(err)) {
                e = new Error(HttpStatus.getStatusText(err));
                (e as any).status = err;
                err = e;
            } else {
                if (typeof err === 'string') {
                    e = new Error(err);
                    (e as any).status = 400;
                    err = e;
                } else {
                    err.status = 500;
                }
            }

            // Send response
            res.status(err.status);
            res.send({
                message: err.message,
                error: (app.get('env') === 'development') ? err : null
            });
        }
    });

    // URL imgs Matriculaciones
    // Fotos
    let dirFotos = path.join(__dirname, '/modules/matriculaciones/uploads/fotos');
    app.use(express.static(dirFotos));

    // Firmas
    let dirFirmas = path.join(__dirname, '/modules/matriculaciones/uploads/firmas');
    app.use(express.static(dirFirmas));
}
