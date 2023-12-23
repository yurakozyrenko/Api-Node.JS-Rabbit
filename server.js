// Микросервис М1: HTTP сервер для обработки входящих HTTP запросов

const express = require('express');
const amqp = require('amqplib');
const app = express();
const Sentry = require('@sentry/node');
const PORT = process.env.PORT || 5000;

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());

Sentry.init({
    dsn: process.env.DSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({
            tracing: true,
        }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({
            app,
        }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!,
});

app.use(express.json());

const QUEUE_NAME = 'tasks';
const RESULTS_QUEUE_NAME = 'results';

function getMessage(channel, RESULTS_QUEUE_NAME) {
    return new Promise((resolve) =>
        channel.consume(RESULTS_QUEUE_NAME, (msg) => resolve(msg))
    );
}

app.post('/', async (req, res) => {
    try {
        const { inputData } = req.body;
        if (Number.isNaN(Number(inputData))) {
            return res
                .status(400)
                .send('Требуется на вход системы подавать числовой параметр');
        }

        // Подключение к RabbitMQ
        const connection = await amqp.connect(process.env.URL_CONNECT);
        const channel = await connection.createChannel();

        // Опубликовать задание в очередь RabbitMQ
        await channel.assertQueue(QUEUE_NAME);

        channel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(JSON.stringify({ inputData }))
        );

        console.log('Data sent to the queue.');

        // Закрываем канал
        await channel.close();

        // канал ответа
        const receiveChannel = await connection.createChannel();

        // Опубликовать задание в очередь RabbitMQ
        await receiveChannel.assertQueue(RESULTS_QUEUE_NAME);

        const msg = await getMessage(receiveChannel, RESULTS_QUEUE_NAME);
        await receiveChannel.ack(msg);
        const data = msg.content.toString();
        console.log('Wait result');
        // Закрываем канал
        await receiveChannel.close();

        // Закрываем соединение
        await connection.close();

        res.status(200).json(JSON.parse(data));
    } catch (error) {
        Sentry.captureException(error);
        console.error('Error processing HTTP request:', error);
        res.status(500).send('Internal Server Error');
    }
});

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Тестовое задание на должность "Разработчик NodeJS" API',
            version: '1.0.0',
            description: 'API information',
            contact: {
                name: 'Yura Kozyrenko',
            },
            servers: ['http://localhost:5000'],
        },
    },
    apis: ['./routes/*js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(PORT, () => {
    console.log(`Microservice M1 on port ${PORT}`);
});
