"use strict";
var validateFormatDate_1 = require('./validateFormatDate');
var ValidatePatient = (function () {
    function ValidatePatient() {
    }
    ValidatePatient.checkPatient = function (patient) {
        var errors = [];
        var valid = true;
        var estadoCivil = ["casado", "separado", "soltero", "divorciado", "viudo", "otro"];
        var sexo = ["femenino", "masculino", "otro"];
        var estado = ["temporal", "identificado", "validado", "recienNacido", "extranjero"];
        var tipoContacto = ["Teléfono Fijo", "Teléfono Celular", "Email"];
        var relaciones = ["padre", "madre", "hijo", "hermano", "tutor"];
        if (!patient.apellido) {
            valid = false;
            errors.push("Paciente no posee apellido");
        }
        if (!patient.nombre) {
            valid = false;
            errors.push("Paciente no posee nombre");
        }
        if (!patient.fechaNacimiento) {
            valid = false;
            errors.push("Paciente no posee fecha de nacimiento");
        }
        else {
            if (!validateFormatDate_1.ValidateFormatDate.validateDate(patient.fechaNacimiento)) {
                valid = false;
                errors.push("Paciente posee fecha de nacimiento con formato inválido");
            }
        }
        if (!patient.sexo) {
            valid = false;
            errors.push("Paciente no posee fecha de nacimiento");
        }
        if (patient.estado) {
            if (estado.indexOf(patient.estado) < 0) {
                valid = false;
                errors.push("El estado del paciente no pertenece al conjunto enumerado");
            }
        }
        if (patient.estadoCivil) {
            if (estadoCivil.indexOf(patient.estadoCivil) < 0) {
                valid = false;
                errors.push("El estado civil del paciente no pertenece al conjunto enumerado");
            }
        }
        if (patient.sexo) {
            if (sexo.indexOf(patient.sexo) < 0) {
                valid = false;
                errors.push("El sexo del paciente no pertenece al conjunto enumerado");
            }
        }
        if (patient.genero) {
            if (sexo.indexOf(patient.genero) < 0) {
                valid = false;
                errors.push("El genero del paciente no pertenece al conjunto enumerado");
            }
        }
        if (patient.relaciones) {
            var long = 0;
            while (patient.relaciones.length > long) {
                if (relaciones.indexOf(patient.relaciones[long].relacion) < 0) {
                    valid = false;
                    errors.push("Existe al menos un tipo de parentezco que no pertenece al conjunto enumerado");
                    break;
                }
                long = long + 1;
            }
        }
        if (patient.contacto) {
            var long = 0;
            while (patient.contacto.length > long) {
                if (tipoContacto.indexOf(patient.contacto[long].tipo) < 0) {
                    valid = false;
                    errors.push("Existe al menos un tipo de contacto que no pertenece al conjunto enumerado");
                    break;
                }
                long = long + 1;
            }
        }
        return {
            valid: valid,
            errors: errors
        };
    };
    return ValidatePatient;
}());
exports.ValidatePatient = ValidatePatient;
//# sourceMappingURL=validatePatient.js.map