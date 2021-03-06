import { recordatorio } from '../schemas/recordatorio';
import * as agendaModel from '../../turnos/schemas/agenda';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { profesional } from '../../../core/tm/schemas/profesional';
import { pacienteApp } from '../schemas/pacienteApp';
import { NotificationService } from './NotificationService';
import { sendSms, SmsOptions } from '../../../utils/sendSms';

let async = require('async');
let agendasRemainderDays = 1;

/**
 *
 * Recordatorios de turnos
 *
 */

export function buscarTurnosARecordar(dayOffset) {
    return new Promise((resolve, reject) => {

        let startDay = moment.utc().add(dayOffset, 'days').startOf('day').toDate();
        let endDay = moment.utc().add(dayOffset, 'days').endOf('day').toDate();

        let matchTurno = {};
        matchTurno['estado'] = { $in: ['disponible', 'publicada'] };
        matchTurno['bloques.turnos.horaInicio'] = { $gte: startDay, $lte: endDay };
        matchTurno['bloques.turnos.estado'] = 'asignado';

        let pipeline = [];

        pipeline = [
            { '$match': matchTurno },
            { '$unwind': '$bloques' },
            { '$unwind': '$bloques.turnos' },
            { '$match': matchTurno }
        ];

        return agendaModel.aggregate(pipeline).then((data) => {
            let turnos = [];
            data.forEach((elem: any) => {
                let turno = elem.bloques.turnos;
                turno.id = elem.bloques.turnos._id;
                turno.paciente = elem.bloques.turnos.paciente;
                turno.tipoRecordatorio = 'turno';
                turnos.push(turno);
            });

            guardarRecordatorioTurno(turnos, function (ret) {
                resolve();
                // console.log('Resultado', ret);
            });
        });
    });
}


export function guardarRecordatorioTurno(turnos: any[], callback) {

    async.forEach(turnos, function (turno, done) {
        recordatorio.findOne({ idTurno: turno._id }, function (err, objFound) {

            if (objFound) {
                console.log('__ El recordatorio existe __');
                return done();
            }

            let recordatorioTurno = new recordatorio({
                idTurno: turno._id,
                fechaTurno: turno.horaInicio,
                paciente: turno.paciente,
                tipoRecordatorio: turno.tipoRecordatorio,
                estadoEnvio: false,
            });

            recordatorioTurno.save(function (_err, user: any) {

                if (_err) {
                    return done(_err);
                }

                return done(turno);
            });

        });

    }, callback);
};


export function enviarTurnoRecordatorio() {
    recordatorio.find({ 'estadoEnvio': false }, function (err, elems) {

        elems.forEach((turno: any, index) => {

            let smsOptions: SmsOptions = {
                telefono: turno.paciente.telefono,
                mensaje: 'Sr ' + turno.paciente.apellido + ' le recordamos que tiene un turno para el día: ' + moment(turno.fechaTurno).format('DD/MM/YYYY')
            }

            sendSms(smsOptions, function (res) {
                if (res === '0') {
                    turno.estadoEnvio = true;
                    turno.save();
                    console.log('El SMS se envío correctamente');
                }
            });
        });

    });
}

/**
 *
 * Recordatorios de agendas
 *
 */

export function agendaRecordatorioQuery(dayOffset) {
    return new Promise((resolve, reject) => {
        let startDay = moment(new Date()).add(dayOffset, 'days').startOf('day').toDate() as any;
        let endDay = moment(new Date()).add(dayOffset, 'days').endOf('day').toDate() as any;
        let match = {
            'estado': { $in: ['disponible', 'publicada'] },
            'horaInicio': {
                $gte: startDay,
                $lte: endDay
            }
        };

        let pipeline = [
            { $match: match },
            { '$unwind': { 'path': '$profesionales', 'preserveNullAndEmptyArrays': true } },
            { '$unwind': { 'path': '$avisos', 'preserveNullAndEmptyArrays': true } },
            {
                '$match': {
                    'avisos': { '$exists': false }
                }
            },
            {
                '$group': {
                    '_id': { 'profesional': '$profesionales._id' },
                    'agenda': { '$push': '$$ROOT' }
                }
            }
        ];

        let query = agendaModel.aggregate(pipeline);
        query.exec(function (err, data) {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
};

export function recordarAgenda() {
    return agendaRecordatorioQuery(agendasRemainderDays).then((data: any[]) => {
        console.log(data);

        let stack = [];
        data.forEach(item => {
            let profId = item._id.profesional;
            let date = moment(new Date()).add(agendasRemainderDays, 'days').startOf('day').toDate() as any;

            let recordatorioAgenda = new recordatorio({
                tipoRecordatorio: 'agenda',
                estadoEnvio: false,
                dataAgenda: {
                    profesionalId: profId,
                    fecha: date
                }
            });

            stack.push(recordatorioAgenda.save());

        });

        return Promise.all(stack);

    });
}

export function enviarAgendaNotificacion() {
    recordatorio.find({ tipoRecordatorio: 'agenda', estadoEnvio: false }, function (err, recordatiorios: any) {
        recordatiorios.forEach((item) => {
            Promise.all([
                profesional.findById(item.dataAgenda.profesionalId),
                pacienteApp.findOne({ profesionalId: mongoose.Types.ObjectId(item.dataAgenda.profesionalId) })
            ]).then(datos => {
                console.log(datos);
                if (datos[0] && datos[1]) {
                    let notificacion = {
                        body: 'Te recordamos que tienes agendas sin confirmar.'
                    }
                    NotificationService.sendNotification(datos[1], notificacion);
                } else {
                    console.log('No tiene app');
                }
            }).catch(() => {
                console.log('Error en la cuenta');
            });
            item.estadoEnvio = true;
            item.save();
        });
    });
}


