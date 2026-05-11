# 🛡️ AI-Powered Network Intrusion Detection System (NIDS)

An intelligent, web-based Network Intrusion Detection System designed to monitor, analyze, and detect malicious network traffic using Machine Learning.

## 🚀 Live Demo
The project is deployed and accessible at: 
**[https://ai-intrusion-detection-system.onrender.com](https://ai-intrusion-detection-system.onrender.com)**
*(Note: May take ~50s to load if it's "sleeping")*

---

## ✨ Features

- **Real-time Traffic Overview:** Visual dashboard showing the distribution of network traffic categories.
- **Flexible Data Sources:** Supports both simulated traffic generation and custom CSV dataset uploads for training.
- **Machine Learning Engine:** Uses a **Random Forest Classifier** to identify patterns in network behavior.
- **Performance Analytics:** Provides detailed classification reports (Accuracy, Precision, Recall, F1-Score).
- **Live Simulation:** An interactive simulation mode that predicts whether incoming traffic packets are "Normal" or potential threats (DDoS, Brute Force, Malware).
- **Modern UI:** A clean, professional, and responsive dashboard built with modern web standards.

---
 
## 🛠️ Tech Stack

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Machine Learning:** [Scikit-learn](https://scikit-learn.org/), Pandas, NumPy
- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Server/Hosting:** [Render](https://render.com/)
- **Version Control:** Git & GitHub

---

## 💻 Local Installation

To run this project on your own computer:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sammiazaz/AI-Intrusion-Detection-System.git
   cd AI-Intrusion-Detection-System
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   uvicorn api:app --reload
   ```

4. **Open your browser:**
   Go to `http://127.0.0.1:8000`

---

## 📝 License
This project was developed as a Major Project for academic purposes.

---
**Developed by Sammi Azaz**
