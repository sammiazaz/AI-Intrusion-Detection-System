from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional
import io
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import time
import random
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Allow all CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for the model state
model_state = {
    "model": None,
    "accuracy": 0.0,
    "data": None
}

def generate_traffic_data(n_samples=1000, seed=None):
    if seed is not None:
        np.random.seed(seed)
    else:
        np.random.seed(int(time.time() % 1000))
    
    data = []
    for _ in range(n_samples):
        label = random.choice(["Normal", "DDoS", "Brute Force", "Malware"])
        
        if label == "Normal":
            duration = np.random.uniform(0.1, 2.0)
            src_bytes = np.random.randint(100, 5000)
            dst_bytes = np.random.randint(100, 5000)
            count = np.random.randint(1, 10)
        elif label == "DDoS":
            duration = np.random.uniform(0.01, 0.1)
            src_bytes = np.random.randint(5000, 10000)
            dst_bytes = np.random.randint(10, 100)
            count = np.random.randint(50, 200)
        elif label == "Brute Force":
            duration = np.random.uniform(2.0, 10.0)
            src_bytes = np.random.randint(50, 200)
            dst_bytes = np.random.randint(50, 200)
            count = np.random.randint(20, 50)
        else: # Malware
            duration = np.random.uniform(5.0, 60.0)
            src_bytes = np.random.randint(1000, 20000)
            dst_bytes = np.random.randint(1000, 20000)
            count = np.random.randint(1, 5)

        data.append([duration, src_bytes, dst_bytes, count, label])

    df = pd.DataFrame(data, columns=['Duration', 'Src_Bytes', 'Dst_Bytes', 'Conn_Count', 'Label'])
    return df

@app.get("/api/status")
def get_status():
    return {
        "status": "Active",
        "model_trained": model_state["model"] is not None,
        "accuracy": model_state["accuracy"]
    }

@app.get("/api/traffic-overview")
def get_traffic_overview():
    df = generate_traffic_data(500)
    counts = df['Label'].value_counts().to_dict()
    return {"data": counts}

@app.post("/api/generate-data")
async def generate_data(
    data_source: str = Form("simulated"),
    file: Optional[UploadFile] = File(None)
):
    if data_source == "csv" and file is not None:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        df = df.dropna()
    else:
        df = generate_traffic_data(5000, seed=42)
    
    model_state["data"] = df
    preview_records = df.head(5).to_dict(orient="records")
    return {"message": "Data generated successfully", "dataset_preview": preview_records}

@app.post("/api/train")
async def train_model():
    df = model_state.get("data")
    if df is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No data generated. Please generate data first.")
    
    X = df.drop('Label', axis=1)
    y = df['Label']
    
    # Handle numeric encoding for real datasets if needed
    X = pd.get_dummies(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test) * 100
    
    y_pred = model.predict(X_test)
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    report_str = classification_report(y_test, y_pred)
    
    model_state["model"] = model
    model_state["accuracy"] = accuracy
    
    return {
        "message": "Model trained successfully", 
        "accuracy": accuracy,
        "classification_report": report_dict,
        "classification_report_str": report_str
    }

@app.get("/api/simulate")
def simulate_traffic():
    if model_state["model"] is None:
        return {"error": "Model not trained yet"}
        
    test_df = generate_traffic_data(1)
    features = test_df.drop('Label', axis=1)
    
    prediction = model_state["model"].predict(features)[0]
    
    return {
        "timestamp": time.strftime("%H:%M:%S"),
        "duration": round(features['Duration'].values[0], 2),
        "src_bytes": int(features['Src_Bytes'].values[0]),
        "dst_bytes": int(features['Dst_Bytes'].values[0]),
        "conn_count": int(features['Conn_Count'].values[0]),
        "prediction": prediction
    }

# Mount the frontend static files at the root
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
