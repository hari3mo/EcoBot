$(document).ready(function () {
    // Find the data container element. We expect the JSON data to be passed
    // from the Flask template into a data attribute (e.g., data-chartdata).
    const $dataContainer = $('#dashboard-data');

    // If the data container doesn't exist (e.g., this script is loaded on the
    // wrong page), stop execution to avoid errors.
    if ($dataContainer.length === 0) {
        console.error('Dashboard data container not found.');
        return;
    }

    // Parse the JSON data string from the data attribute
    let chartData;
    try {
        chartData = JSON.parse($dataContainer.data('chartdata'));
    } catch (e) {
        console.error('Failed to parse chart data:', e);
        return;
    }

    // Initialize all the charts
    initTimeseriesChart(chartData.timeseries);
    initCostBreakdownChart(chartData.cost_breakdown);
    initTokenBreakdownChart(chartData.token_breakdown);

    /**
     * Creates a multi-axis line chart for daily usage and environmental impact.
     * @param {object} data - The timeseries data object from the server.
     */
    function initTimeseriesChart(data) {
        const ctx = document.getElementById('timeseries-chart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Total Queries',
                        data: data.queries,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                        yAxisID: 'y-queries'
                    },
                    {
                        label: 'Energy (Wh)',
                        data: data.wh,
                        borderColor: 'rgba(255, 159, 64, 1)',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        fill: true,
                        yAxisID: 'y-impact'
                    },
                    {
                        label: 'Water (mL)',
                        data: chartData.timeseries.ml,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'CO2 (g)',
                        data: data.g_co2,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.08)',
                        fill: true,
                        yAxisID: 'y-impact'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Usage & Environmental Impact'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    'y-queries': {
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Total Queries'
                        },
                        grid: {
                            drawOnChartArea: false // Only show grid for one axis
                        }
                    },
                    'y-impact': {
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Energy (Wh) / CO2 (g)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Creates a doughnut chart for the cost breakdown (input, cache, output).
     * @param {object} data - The cost breakdown data object.
     */
    function initCostBreakdownChart(data) {
        const ctx = document.getElementById('cost-breakdown-chart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Cost Breakdown',
                    data: data.data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',  // Red (Input)
                        'rgba(54, 162, 235, 0.8)',  // Blue (Cache)
                        'rgba(255, 206, 86, 0.8)'   // Yellow (Output)
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Cost Breakdown (USD)'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                let value = context.parsed;
                                return `${label}: $${value.toFixed(5)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Creates a doughnut chart for the token breakdown (input, cache, output).
     * @param {object} data - The token breakdown data object.
     */
    function initTokenBreakdownChart(data) {
        const ctx = document.getElementById('token-breakdown-chart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Token Breakdown',
                    data: data.data,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',   // Teal (Input)
                        'rgba(153, 102, 255, 0.8)', // Purple (Cache)
                        'rgba(255, 159, 64, 0.8)'  // Orange (Output)
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Token Breakdown'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                let value = context.parsed;
                                // Format with commas for large numbers
                                return `${label}: ${value.toLocaleString()} tokens`;
                            }
                        }
                    }
                }
            }
        });
    }
});