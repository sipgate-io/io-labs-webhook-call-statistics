const socketIo = require('socket.io');
const { createWebhookModule } = require('sipgateio');

const express = require('express');
const path = require('path');

const webhookServerPort = 8080;
const webhookServerAddress =
	process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS || 'YOUR_WEBHOOK_SERVER_ADDRESS';

const counters = {
	totalAnswered: 0,
	voicemail: 0,
	canceled: 0,
	busy: 0,
};

const webhookModule = createWebhookModule();

webhookModule
	.createServer({
		port: webhookServerPort,
		serverAddress: webhookServerAddress,
	})
	.then(webhookServer => {
		console.log(
			`Server running at ${webhookServerAddress}\n` +
				'Please set this URL for incoming calls at https://console.sipgate.com/webhooks/urls\n' +
				'Ready for calls 📞'
		);
		webhookServer.onNewCall(logCall);
		webhookServer.onHangUp(handleHangUpEvent);
	});

const logCall = newCallEvent => {
	console.log(`New Call from ${newCallEvent.from} to ${newCallEvent.to}`);
};

const handleHangUpEvent = hangUpEvent => {
	if (hangUpEvent.cause === 'normalClearing') {
		counters.totalAnswered += 1;
	}
	if (hangUpEvent.cause === 'forwarded') {
		counters.voicemail += 1;
		return;
	}
	if (hangUpEvent.cause === 'cancel') {
		counters.canceled += 1;
	}
	if (hangUpEvent.cause === 'busy') {
		counters.busy += 1;
	}

	websocketServer.emit('data', calculateData());
};

const calculateData = () => {
	const answeredByUser = counters.totalAnswered - counters.voicemail;
	return [answeredByUser, counters.voicemail, counters.busy, counters.canceled];
};

const app = express();

app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/', (_, res) => {
	res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

const server = app.listen(3000);

const websocketServer = socketIo(server, {
	serveClient: true,
	origins: '*:*',
});

websocketServer.on('connection', socket => {
	socket.emit('init', {
		labels: [
			'Answered by user',
			'Answered by voicemail',
			'Rejected or busy',
			'Missed',
		],
		data: calculateData(),
	});
});
