const API_URL = '/api';
let trafficChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initDashboard();
    initTrainModel();
    initSimulation();
});

function initTabs() {
    const tabs = document.querySelectorAll('.nav-links li');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
            
            if (targetId === 'dashboard' || targetId === 'simulation') {
                updateDashboard();
            }
        });
    });
}

async function initDashboard() {
    await updateDashboard();
}

async function updateDashboard() {
    try {
        const statusRes = await fetch(`${API_URL}/status`);
        const statusData = await statusRes.json();
        
        document.getElementById('sys-status').innerText = statusData.status;
        document.getElementById('model-accuracy').innerText = statusData.accuracy.toFixed(2) + '%';
        
        if (statusData.model_trained) {
            const msg = document.getElementById('sim-not-trained-msg');
            const content = document.getElementById('sim-content');
            if(msg) msg.classList.add('hidden');
            if(content) content.classList.remove('hidden');
        } else {
            const msg = document.getElementById('sim-not-trained-msg');
            const content = document.getElementById('sim-content');
            if(msg) msg.classList.remove('hidden');
            if(content) content.classList.add('hidden');
        }
        
        const trafficRes = await fetch(`${API_URL}/traffic-overview`);
        const trafficData = await trafficRes.json();
        
        renderChart(trafficData.data);
    } catch (err) {
        console.error("Failed to load dashboard data:", err);
    }
}

function renderChart(data) {
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    if (trafficChart) {
        trafficChart.destroy();
    }
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    const bgColors = labels.map(l => l === 'Normal' ? '#10b981' : '#ef4444');

    trafficChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Traffic Distribution',
                data: values,
                backgroundColor: bgColors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function initTrainModel() {
    const generateBtn = document.getElementById('generate-data-btn');
    const generateMsg = document.getElementById('generate-message');
    const trainBtn = document.getElementById('train-btn');
    const resultsBox = document.getElementById('train-results');
    const trainMessage = document.getElementById('train-message');
    const radioButtons = document.querySelectorAll('input[name="data-source"]');
    const csvContainer = document.getElementById('csv-upload-container');
    const desc = document.getElementById('data-source-desc');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'csv') {
                csvContainer.classList.remove('hidden');
                desc.innerText = "Upload a CSV file containing your dataset.";
            } else {
                csvContainer.classList.add('hidden');
                desc.innerText = "Using 5,000 synthetic high-fidelity CIC-IDS2017-like traffic samples to train the model.";
            }
            // Reset state if data source changes
            trainBtn.classList.add('hidden');
            generateMsg.classList.add('hidden');
            document.getElementById('dataset-preview-container').classList.add('hidden');
            document.getElementById('performance-metrics-container').classList.add('hidden');
            resultsBox.classList.add('hidden');
        });
    });

    generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.innerText = "Generating/Loading Data...";
        generateMsg.classList.add('hidden');
        trainBtn.classList.add('hidden');
        resultsBox.classList.add('hidden');
        document.getElementById('performance-metrics-container').classList.add('hidden');
        
        try {
            const formData = new FormData();
            const dataSource = document.querySelector('input[name="data-source"]:checked').value;
            formData.append('data_source', dataSource);

            if (dataSource === 'csv') {
                const fileInput = document.getElementById('csv-file');
                if (fileInput.files.length === 0) {
                    throw new Error("Please select a CSV file to upload.");
                }
                formData.append('file', fileInput.files[0]);
            }

            const res = await fetch(`${API_URL}/generate-data`, { 
                method: 'POST',
                body: formData
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            generateMsg.innerText = data.message || "Data generated/loaded successfully!";
            generateMsg.classList.remove('hidden');
            
            if (data.dataset_preview && data.dataset_preview.length > 0) {
                const previewContainer = document.getElementById('dataset-preview-container');
                const thead = document.querySelector('#dataset-preview-table thead');
                const tbody = document.querySelector('#dataset-preview-table tbody');
                
                thead.innerHTML = '';
                tbody.innerHTML = '';
                
                const keys = Object.keys(data.dataset_preview[0]);
                const headerRow = document.createElement('tr');
                keys.forEach(key => {
                    const th = document.createElement('th');
                    th.textContent = key;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                
                data.dataset_preview.forEach(row => {
                    const tr = document.createElement('tr');
                    keys.forEach(key => {
                        const td = document.createElement('td');
                        if (typeof row[key] === 'number') {
                            td.textContent = Number.isInteger(row[key]) ? row[key] : row[key].toFixed(4);
                        } else {
                            td.textContent = row[key];
                        }
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                
                previewContainer.classList.remove('hidden');
            }
            
            // Enable training after data is successfully loaded
            trainBtn.classList.remove('hidden');
        } catch (err) {
            alert(err.message || "Error loading data.");
            console.error(err);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerText = "Generate/Load Data";
        }
    });

    trainBtn.addEventListener('click', async () => {
        trainBtn.disabled = true;
        trainBtn.innerText = "Training...";
        resultsBox.classList.remove('hidden');
        trainMessage.innerText = "Optimizing Random Forest Hyperparameters...";
        
        try {
            const res = await fetch(`${API_URL}/train`, { 
                method: 'POST'
            });
            
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            trainMessage.innerHTML = `Model trained successfully!<br>Accuracy: <strong>${data.accuracy.toFixed(2)}%</strong>`;
            
            const metricsContainer = document.getElementById('performance-metrics-container');
            const metricsPre = document.getElementById('performance-metrics');
            if (data.classification_report_str) {
                metricsPre.textContent = data.classification_report_str;
                metricsContainer.classList.remove('hidden');
            }
            
            await updateDashboard(); // Update accuracy
            
            // Explicitly show simulation content before switching
            const msg = document.getElementById('sim-not-trained-msg');
            const content = document.getElementById('sim-content');
            if(msg) msg.classList.add('hidden');
            if(content) content.classList.remove('hidden');
            
            // Automatically switch to simulation tab and start it after 1.5s
            setTimeout(() => {
                const simTab = document.querySelector('.nav-links li[data-tab="simulation"]');
                if (simTab) simTab.click();
                
                const startSimBtn = document.getElementById('start-sim-btn');
                if (startSimBtn && !startSimBtn.disabled) {
                    startSimBtn.click();
                }
            }, 1500);
        } catch (err) {
            trainMessage.innerText = err.message || "Error training model. Make sure backend is running.";
            console.error(err);
        } finally {
            trainBtn.disabled = false;
            trainBtn.innerText = "Start Training Model";
        }
    });
}

let simInterval = null;

function initSimulation() {
    const startBtn = document.getElementById('start-sim-btn');
    const stopBtn = document.getElementById('stop-sim-btn');
    const statusText = document.getElementById('sim-status-text');
    const alertBox = document.getElementById('sim-alert-box');
    const tbody = document.getElementById('sim-log-body');

    startBtn.addEventListener('click', () => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusText.innerText = "Initializing Simulation...";
        
        simInterval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/simulate`);
                const data = await res.json();
                
                if (data.error) {
                    stopSimulation();
                    alert("Please train the model first from the Train Model tab!");
                    return;
                }
                
                // Update Alert Box
                if (data.prediction === "Normal") {
                    alertBox.className = "alert-box alert-normal";
                    statusText.innerText = "✅ Traffic: Normal";
                } else {
                    alertBox.className = "alert-box alert-threat";
                    statusText.innerText = `🚨 ALERT: ${data.prediction} detected!`;
                    // Update dashboard threat level if threat detected
                    document.getElementById('threat-level').innerText = "High";
                    document.getElementById('threat-level-card').className = "metric-card threat-high";
                }
                
                // Add log entry
                const tr = document.createElement('tr');
                const badgeClass = data.prediction === "Normal" ? "badge-normal" : "badge-threat";
                
                tr.innerHTML = `
                    <td>${data.timestamp}</td>
                    <td>${data.duration}s</td>
                    <td>${data.src_bytes}</td>
                    <td>${data.dst_bytes}</td>
                    <td><span class="badge ${badgeClass}">${data.prediction}</span></td>
                `;
                
                tbody.insertBefore(tr, tbody.firstChild);
                
                // Keep only 10 rows
                if (tbody.children.length > 10) {
                    tbody.removeChild(tbody.lastChild);
                }
                
            } catch (err) {
                console.error("Simulation error", err);
            }
        }, 1500);
    });

    stopBtn.addEventListener('click', () => {
        stopSimulation();
    });
    
    function stopSimulation() {
        clearInterval(simInterval);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        alertBox.className = "alert-box";
        statusText.innerText = "Simulation Stopped.";
        document.getElementById('threat-level').innerText = "Low";
        document.getElementById('threat-level-card').className = "metric-card threat-low";
    }
}
