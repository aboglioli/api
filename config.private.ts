// Configuración de Passport
export const auth = {
    useLdap: false,
    jwtKey: 'API_KEY',
    ldapOU: 'ou=People,o=integrabilidad,o=neuquen',
};

// True: Expone una ruta de la api que lista todos los permisos disponibles
export const enablePermisosDoc = false;

// Puerto de LDAP
export const ports = {
    ldapPort: ':389'
};

// Hosts
export const hosts = {
    ldap: 'ldap.neuquen.gov.ar',
    elastic_main: 'localhost:9200',
    mongoDB_main: {
        host: 'localhost:27017/andes',
        auth: { authdb: 'admin' },
        server: { reconnectTries: Number.MAX_VALUE }
    },
    mongoDB_mpi: {
        host: 'localhost:27017/mpi',
        auth: { authdb: 'admin' },
        server: { reconnectTries: Number.MAX_VALUE }
    },
    mongoDB_snomed: {
        host: 'mongodb://localhost:27017/es-edition',
        auth: { authdb: 'admin' },
        server: { reconnectTries: Number.MAX_VALUE }
    }
};
// Mongoose config
export let mongooseDebugMode = false;

// Swagger config
export let enableSwagger = true;

// Configuración de Google Geocoding
export const geoKey = 'GOOGLE_MAP_KEY';

// Configuración servicio SISA
export const sisa = {
    username: '',
    password: '',
    host: 'sisa.msal.gov.ar',
    port: 443,
    url: 'https://sisa.msal.gov.ar/sisa/services/rest/cmdb/obtener?'
};
// Configuración servicio ANSES
export const anses = {
    Usuario: '',
    password: '',
    url: '',
    serv: '',
    serv2: ''
};
// Configuración servicio SINTYS
export const sintys = {
    username: '',
    password: '',
    host: '',
    port: 443,
    path: ''
};

// Auth App Mobile
export const authApp = {
    secret: ''
};

export const snomed = {
    dbName: 'es-edition',
    dbVersion: 'v20171200'
};

// Push Notifications
export const pushNotificationsSettings = {
    gcm: {
        id: 'GCM_API_KEY',
        phonegap: true
    },
    apn: {
        token: {
            key: './certs/key.p8', // optionally: fs.readFileSync('./certs/key.p8')
            keyId: 'ABCD',
            teamId: 'EFGH',
        },
    }
};

// E-mail server settings
export const enviarMail = {
    host: '',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: '', // generated ethereal user
        pass: ''  // generated ethereal password
    }
};

// URLs descarga facmacias de turnos
export const farmaciasEndpoints = {
    localidades: 'http://181.231.9.13/cf/consultarturnos.aspx',
    turnos: 'http://181.231.9.13/lawen/turnos.aspx'
};

// Endpoints envio de SMS
export const SMSendpoints = {
    urlOperador: '',
    urlNumero: ''
};

export const jobs = [
    {
        when: '*/5 * * * * * ',
        action: './jobs/roboSenderJob'
    }
];

export const userScheduler = {
    user: {
        usuario: {
            nombre: 'Ejemplo',
            apellido: 'Scheduler'
        },
        organizacion: {
            'nombre': 'Ejemplo'
        }
    },
    ip: '0.0.0.0',
    connection: {
        localAddress: '0.0.0.0'
    }
};

export const conSql = {
    auth: {
        user: '',
        password: ''
    },
    serverSql: {
        server: '',
        database: ''
    },
    pool: {
        acquireTimeoutMillis: 15000
    }
};

export const conSqlHPN = {
    auth: {
        user: '',
        password: ''
    },
    serverSql: {
        server: '',
        database: '',
        port: ''
    },
    pool: {
        acquireTimeoutMillis: 15000
    }

}

export const CDA = {
    rootOID: ''
};

export const wsSalud = {
    host: '',
    getPaciente: '',
    getResultado: '',
    hellerWS: '',
    hellerFS: '',
    hpnWS: '',
    hostHPN: ''
};
