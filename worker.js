// Микросервис М2: Обработчик заданий из RabbitMQ
const Sentry = require('@sentry/node');
const amqp = require('amqplib');
const RESULTS_QUEUE_NAME = 'results';
const QUEUE_NAME = 'tasks';

const processTask = async (data) => {
    try {
        // Имитация задержки обработки задания в 5 секунд
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const inputData = JSON.parse(data).inputData;
        const result = inputData * 2;

        console.log('Result of processing task:', result);

        // Подключение к RabbitMQ
        const connection = await amqp.connect(process.env.URL_CONNECT);
        const channel = await connection.createChannel();

        // Объявление очереди для результатов (если не существует)
        await channel.assertQueue(RESULTS_QUEUE_NAME);
        // Отправляем результат обработки в очередь RabbitMQ
        channel.sendToQueue(
            RESULTS_QUEUE_NAME,
            Buffer.from(JSON.stringify({ result }))
        );

        console.log('Result sent to the queue.');

        // Закрываем соединение
        await channel.close();

        // Закрываем соединение
        await connection.close();
    } catch (error) {
        // Sentry.captureException(error);
        console.error('Error processing task:', error);
    }
};

const startWorker = async () => {
    try {
        const connection = await amqp.connect(process.env.URL_CONNECT);
        const channel = await connection.createChannel();

        // Объявление очереди для задач
        await channel.assertQueue(QUEUE_NAME);

        console.log(`Worker is waiting for tasks. To exit press CTRL+C`);

        // Подписываемся на очередь задач
        channel.consume(
            'tasks',
            (msg) => {
                if (msg.content) {
                    console.log('получаем задачу');
                    const data = msg.content.toString();
                    processTask(data);
                    // Подтверждение получения сообщения (acknowledgement)
                    channel.ack(msg);
                }
            },
            { noAck: false }
        );
    } catch (error) {
        console.error('Error processing HTTP request:', error);
    }
};

startWorker();
