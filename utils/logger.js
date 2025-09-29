// services/logger.js
const winston = require('winston');

const { winstonAzureBlob, extensions } = require("winston-azure-blob");

const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});


const logger = winston.createLogger({
    level: 'info', // Log 'info' and above ('warn', 'error')
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        logFormat
    ),
    // Define the transports (destinations) for your logs
    transports: [
        new winston.transports.Console(),

        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({filename: 'logs/nonError.log', level: 'info'}),
        new winston.transports.File({ filename: "ecombined.log" }),


        winstonAzureBlob({

            account: {
                name: process.env.AZURE_STORAGE_NAME,
                key: process.env.AZURE_STORAGE_KEY,
                // host: 'The host address',
                // sasToken: 'The Shared Access Signature token',
                connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING
            },

            // connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
            // containerName: process.env.AZURE_LOGS_CONTAINER_NAME,
            blobName: `app-log-${new Date().toISOString().split('T')[0]}.log`,
            level: 'info',
            eol: '\n',
        })
    ],
    exitOnError: false,
});

logger.stream = {
    write: function (message, encoding) {
        logger.info(message.trim());
    },
};

module.exports = logger;