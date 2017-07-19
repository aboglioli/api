import { pacienteApp } from '../schemas/pacienteApp';
import { LoggerPaciente } from '../../../utils/loggerPaciente';
import * as authController from '../controller/AuthController';
import * as express from 'express';
import * as mongoose from 'mongoose';
import { Auth } from './../../../auth/auth.class';
import { ElasticSync } from '../../../utils/elasticSync';
import { Logger } from '../../../utils/logService';

let router = express.Router();

/**
 * Get paciente
 * 
 * @param id {string} id del paciente
 * Chequea que el paciente este asociado a la cuenta
 */

router.get('/paciente/:id', function (req: any, res, next) {
    let idPaciente = req.params.id;
    let pacientes = req.user.pacientes;
    let index = pacientes.findIndex(item => item.id === idPaciente);
    if (index >= 0) {
        authController.buscarPaciente(pacientes[index].id).then((paciente) => {

            // [TODO] Projectar datos que se pueden mostrar el paciente    
            return res.json(paciente);

        }).catch(error => {
            return res.status(422).send({ message: 'invalid_id' });
        });
    } else {
        return res.status(422).send({ message: 'unauthorized' });
    }
});

/**
 * Modifica datos de contacto y otros
 * 
 * @param id {string} id del paciente
 *  
 */

router.put('/paciente/:id', function (req: any, res, next) {
    let idPaciente = req.params.id;
    let pacientes = req.user.pacientes;
    let index = pacientes.findIndex(item => item.id === idPaciente);
    if (index >= 0) {
        authController.buscarPaciente(pacientes[index].id).then((paciente: any) => {
            let pacienteOriginal = paciente.toObject();

            paciente.reportarError = req.body.reportarError;
            paciente.notas = req.body.notas;
            paciente.direccion = req.body.direccion;
            paciente.contacto = req.body.contacto;
            Auth.audit(paciente, req);

            paciente.save(function (err2) {
                if (err2) {
                    console.log('Error Save', err2);
                    return next(err2);
                }
                res.send({ status: "OK" });
                (new ElasticSync()).sync(paciente).then((updated) => {
                    if (updated) {
                        Logger.log(req, 'mpi', 'elasticUpdate', {
                            original: pacienteOriginal,
                            nuevo: paciente
                        });
                    } else {
                        Logger.log(req, 'mpi', 'elasticInsert', paciente);
                    }
                }).catch((error) => {
                    Logger.log(req, 'pacientes', 'elasticError', error);
                });
            });

        }).catch(error => {
            return res.status(422).send({ message: 'invalid_id' });
        });
    } else {
        return res.status(422).send({ message: 'unauthorized' });
    }
});

export = router;