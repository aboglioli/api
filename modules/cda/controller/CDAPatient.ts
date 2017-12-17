import * as pacienteCtr from '../../../core/mpi/controller/paciente';
import * as mongoose from 'mongoose';
import { CDA } from './class/CDA';
import { Patient } from './class/Patient';
import { Organization } from './class/Organization';
import { Author } from './class/Author';
import { Body, Component, ImageComponent } from './class/Body';
import { CDABuilder } from './builder/CdaBuilder';

import * as base64_stream from 'base64-stream';
import { makeFs } from '../schemas/CDAFiles';
import * as stream from 'stream';
import { create } from 'domain';
import * as moment from 'moment';

/**
 * Crea un objeto paciente desde los datos
 */

function dataToPac (dataPaciente, identificador) {
    return {
        apellido: dataPaciente.apellido,
        nombre: dataPaciente.nombre,
        fechaNacimiento: dataPaciente.fechaNacimiento,
        documento: dataPaciente.documento,
        sexo: dataPaciente.sexo,
        genero: dataPaciente.sexo,
        activo: true,
        estado: 'temporal',
        identificadores: [{
            entidad: identificador,
            valor: dataPaciente.id
        }]
    };
}

/**
 * Matcheamos los datos del paciente.
 * Primero buscamos si el ID en la organización ya esta cargado.
 * Hacemos un multimatch con los datos del paciente y matcheamos los datos.
 * Seleccionamos si hay alguno arriba de 95%
 * Sino creamos un nuevo paciente
 * Cargamos el identificador de la organización de origen.
 *
 * @param {Request} req
 * @param {object} dataPaciente Datos del paciente
 * @param {string} organizacion Identificador de la organización
 */
export async function findOrCreate(req, dataPaciente, organizacion) {
    if (dataPaciente.id) {

        let identificador = {
            entidad: String(organizacion),
            valor: dataPaciente.id
        };

        try {

            let query = await pacienteCtr.buscarPacienteWithcondition({
                identificadores: identificador
            });

            if (query) {
                return query.paciente;
            }

        } catch (e) {
            // nothing to do here
        }
    }

    let pacientes = await pacienteCtr.matchPaciente(dataPaciente);
    if (pacientes.length > 0 && pacientes[0].value >= 0.95) {
        let realPac = await pacienteCtr.buscarPaciente(pacientes[0].paciente.id);
        let paciente = realPac.paciente;

        if (!paciente.identificadores) {
            paciente.identificadores = [];
        }
        let index = paciente.identificadores.findIndex(item => item.entidad === String(organizacion));
        if (index < 0) {
            paciente.identificadores.push({
                entidad: organizacion,
                valor: dataPaciente.id
            });
            await pacienteCtr.updatePaciente(paciente, {identificadores: paciente.identificadores} , req);
        }
        return paciente;
    } else {
        return await pacienteCtr.createPaciente(dataToPac(dataPaciente, organizacion), req);
    }
}

// Root id principal de ANDES o del hospital
let rootOID = '2.16.840.1.113883.2.10.17.99999';

/**
 * Match desde snomed a un código LOINC para indentificar el CDA
 * @param snomed ConceptId
 */
let snomedCodes = ['4241000179101'];
function matchCode(snomed) {
    switch (snomed) {
        case '4241000179101':
            return {
                code: '26436-6',
                codeSystem: '2.16.840.1.113883.6.1',
                codeSystemName: 'LOINC',
                displayName: 'Laboratory studies'
            };
        default:
            return {
                code: '34133-9',
                codeSystem: '2.16.840.1.113883.6.1',
                codeSystemName: 'LOINC',
                displayName: 'Summarization of episode note'
            };
    }
}

/**
 * Creamos la estructura ICode en base a un CIE10
 * @param cie10
 */
function icd10Code (cie10) {
    return {
        codeSystem: '2.16.840.1.113883.6.90',
        code: cie10.codigo,
        codeSystemName: 'ICD-10',
        displayName: cie10.nombre
    };
}

/**
 * Crea la estructura IID a partir de un ID
 * @param id
 */
function buildID (id) {
    return {
        root: rootOID,
        extension: id
    };
}

let base64RegExp = /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,(.*)/;

export function storeFile (base64) {
    var match = base64.match(base64RegExp);
    var mime = match[1];
    var data = match[2];
    return new Promise((resolve, reject) => {
        let uniqueId = String(new mongoose.Types.ObjectId());
        let input = new stream.PassThrough();
        let decoder = base64_stream.decode();
        let CDAFiles = makeFs();

        CDAFiles.write({
                _id: uniqueId,
                filename:  uniqueId + '.' + mime.split('/')[1],
                contentType: mime
            },
            input.pipe(decoder),
            (error, createdFile) => {
                resolve({
                    id: createdFile._id,
                    data: 'files/' + createdFile.filename,
                    mime: mime,
                    is64: false
                });
            }
        );

        input.end(data);
    });
}

export function storePdfFile (pdf) {
    return new Promise(( resolve, reject) => {
        let uniqueId = String(new mongoose.Types.ObjectId());
        let input = new stream.PassThrough();
        let mime = 'application/pdf';
        let CDAFiles = makeFs();
        CDAFiles.write({
            _id: uniqueId,
            filename:  uniqueId + '.pdf',
            contentType: mime
        },
        input.pipe(pdf),
        (error, createdFile) => {
            resolve({
                id: createdFile._id,
                data: 'files/' + createdFile.filename,
                mime: mime
            });
        }
    );
    });
}

/**
 * Almacena un XML en Mongo
 * @param objectID ID del CDA
 * @param cdaXml  XML en texto plano
 * @param metadata Datos extras para almacenar con el archivo.
 */
export function storeCDA (objectID, cdaXml, metadata) {
    return new Promise((resolve, reject) => {

        let input = new stream.PassThrough();
        let CDAFiles = makeFs();

        CDAFiles.write({
                _id: objectID,
                filename:  objectID + '.xml',
                contentType: 'application/xml',
                metadata
            },
            input,
            (error, createdFile) => {
                resolve(createdFile);
            }
        );

        input.end(cdaXml);
    });
}

/**
 * Genera el CDA
 * @param {string} uniqueId ID del CDA
 * @param {object} patient Datos del paciente. 5 datos básicos
 * @param {Date} date Fecha de la prestación
 * @param {object} author Dato del profesional. [nombre, apellido, (id)]
 * @param {object} organization Datos de la organización [id, nombre]
 * @param {conceptId} snomed concept id asociado. Sirve para tabular el tipo de CDA
 * @param {CIE10Schema} cie10 Código cie10
 * @param {string} text Texto descriptivo
 * @param {string} base64  Archivo para adjutar al CDA en base64
 */
export function generateCDA(uniqueId, patient, date, author, organization, snomed, cie10, text, file) {

    let cda = new CDA();
    cda.id(buildID(uniqueId));

    let code = matchCode(snomed);
    cda.code(code);

    // [TODO] Desde donde inferir el titulo
    cda.title(code.displayName);

    cda.versionNumber(1);
    cda.date(date);
    // [TODO] Falta definir el tema del DNI
    let patientCDA = new Patient();
    patientCDA.setFirstname(patient.nombre).setLastname(patient.apellido);
    patientCDA.setBirthtime(patient.fechaNacimiento);
    patientCDA.setGender(patient.sexo);
    if (patient.id) {
        patientCDA.setId(buildID(patient.id));
    }
    cda.patient(patientCDA);
    let orgCDA = new Organization();
    orgCDA.id(buildID(organization._id));
    orgCDA.name(organization.nombre);

    cda.custodian(orgCDA);

    if (author) {
        let authorCDA = new Author();
        authorCDA.firstname(author.nombre);
        authorCDA.lastname(author.apellido);
        authorCDA.organization(orgCDA);
        if (author._id) {
            authorCDA.id(buildID(author._id));
        }
        cda.author(authorCDA);
    }

    let body = new Body();

    if (text) {
        let textComponent = new Component();
        textComponent.title('Resumen de la consulta');
        textComponent.text(text);
        if (cie10) {
            textComponent.code(icd10Code(cie10));
        }
        body.addComponent(textComponent);
    }

    // [TODO] Archivo en base64 o aparte
    if (file) {

        // var match = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,(.*)/);
        // var mime = match[1];
        // var data = match[2];

        let imagecomponent = new ImageComponent();
        imagecomponent.title('Archivo adjunto');
        imagecomponent.file(file.data);
        imagecomponent.type(file.mime);
        imagecomponent.isB64(file.is64 || false);

        body.addComponent(imagecomponent);
    }

    cda.body(body);

    let builder = new CDABuilder();
    return builder.build(cda);

}

export function validateMiddleware(req, res, next) {
    let errors: any = {};
    let validString = function (value) {
        return value && value.length > 0;
    };
    let dataPaciente = req.body.paciente;
    let dataProfesional = req.body.profesional;
    let cie10Code = req.body.cie10;
    let file = req.body.file;
    let texto = req.body.texto;
    let snomed = req.body.prestacion;

    if (snomedCodes.indexOf(snomed) < 0) {
        errors.prestacion = 'not_valid_value';
    }

    if (!moment(req.body.fecha).isValid()) {
        errors.fecha = 'invalid_format';
    }

    if (file && !base64RegExp.test(file)) {
        errors.file = 'file_error';
    }

    if (!validString(dataProfesional.nombre)) {
        errors.profesional = errors.profesional || {};
        errors.profesional.nombre = 'required';
    }

    if (!validString(dataProfesional.apellido)) {
        errors.profesional = errors.profesional || {};
        errors.profesional.apellido = 'required';
    }

    if (!validString(dataPaciente.nombre)) {
        errors.paciente = errors.paciente || {};
        errors.paciente.nombre = 'required';
    }

    if (!validString(dataPaciente.apellido)) {
        errors.paciente = errors.paciente || {};
        errors.paciente.apellido = 'required';
    }

    if (!validString(dataPaciente.documento)) {
        errors.paciente = errors.paciente || {};
        errors.paciente.documento = 'required';
    }

    if (!dataPaciente.fechaNacimiento || !moment(req.body.fecha).isValid()) {
        errors.paciente = errors.paciente || {};
        errors.paciente.fechaNacimiento = 'invalid_date';
    }


    if (Object.keys(errors).length > 0) {
        return next(errors);
    }
    return next();
}
