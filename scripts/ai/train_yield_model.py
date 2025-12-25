import torch
import torch.nn as nn
import numpy as np
import requests
import json
import os

# Configuration
COINGECKO_API = "https://api.coingecko.com/api/v3"
ASSET_ID = "chainlink" # Example asset
DAYS = 365
VS_CURRENCY = "usd"
MODEL_PATH = "scripts/ai/yield_model.pth"

def fetch_live_data():
    print(f"Fetching live data for {ASSET_ID}...")
    url = f"{COINGECKO_API}/coins/{ASSET_ID}/market_chart?vs_currency={VS_CURRENCY}&days={DAYS}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        prices = [p[1] for p in data['prices']]
        return prices
    except Exception as e:
        print(f"Error fetching data: {e}")
        # Fallback mock data for testing if API fails (rate limits)
        return list(np.linspace(10, 20, 365) + np.random.normal(0, 0.5, 365))

def prepare_data(prices):
    # Calculate daily yield approx as % change
    prices = np.array(prices)
    yields = np.diff(prices) / prices[:-1]
    return yields

class YieldPredictor(nn.Module):
    def __init__(self):
        super(YieldPredictor, self).__init__()
        self.lstm = nn.LSTM(input_size=1, hidden_size=50, num_layers=2, batch_first=True)
        self.fc = nn.Linear(50, 1)

    def forward(self, x):
        _, (h, _) = self.lstm(x)
        return self.fc(h[-1])

def train():
    prices = fetch_live_data()
    yields = prepare_data(prices)
    
    # Prepare tensors
    # Sequence length of 30 days to predict next day
    SEQ_LEN = 30
    X, y = [], []
    for i in range(len(yields) - SEQ_LEN):
        X.append(yields[i:i+SEQ_LEN])
        y.append(yields[i+SEQ_LEN])
    
    X = torch.tensor(X, dtype=torch.float32).unsqueeze(-1) # (Batch, Seq, 1)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(-1)
    
    model = YieldPredictor()
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    
    print("Training model...")
    for epoch in range(100):
        optimizer.zero_grad()
        outputs = model(X)
        loss = criterion(outputs, y)
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {loss.item()}")
            
    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    torch.save(model.state_dict(), MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    # Inference on latest data for ZK proof input
    latest_seq = torch.tensor(yields[-SEQ_LEN:], dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
    projection = model(latest_seq).item()
    print(f"Predicted next yield: {projection:.6f}")
    
    # Save inputs/outputs for ZK verification
    verification_data = {
        "input": yields[-SEQ_LEN:].tolist(),
        "prediction": projection
    }
    with open("scripts/ai/verification_data.json", "w") as f:
        json.dump(verification_data, f)

if __name__ == "__main__":
    train()
