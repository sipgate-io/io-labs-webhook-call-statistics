let callChart;

const socket = io('/');

socket.on('init', (data) => {
	callChart = setupChart(data);
});

socket.on('data', (data) => {
	updateChart(callChart, data);
});

const colors = {
	cyan: '#00A6A6',
	yellow: '#EFCA08',
	orange: '#F49F0A',
	red: '#FF0000'
};

const setupChart = (data) => {
	const context = document.getElementById('chart').getContext('2d');

	return new Chart(context, {
		type: 'bar',
		data: {
			labels: data.labels,
			datasets: [
				{
					data: data.data,
					backgroundColor: [ colors.cyan, colors.yellow, colors.orange, colors.red ],
					borderWidth: 0
				}
			]
		},
		options: {
			legend: { display: false },
			tooltip: { position: 'average' },
			title: { display: true, text: 'Calls today' },
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true,
							stepSize: 1
						}
					}
				]
			}
		}
	});
};

const updateChart = (chart, data) => {
	chart.data.datasets[0].data = data;
	chart.update();
};
