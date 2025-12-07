import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    API_KEY = os.getenv("EXCHANGE_API_KEY")
    SECRET_KEY = os.getenv("EXCHANGE_SECRET_KEY")
    EXCHANGE_ID = os.getenv("EXCHANGE_ID", "binance")  # Default to binance
    SANDBOX_MODE = os.getenv("SANDBOX_MODE", "True").lower() == "true"
    
    SYMBOL = "BTC/USDT"
    TIMEFRAME = "1h"
    
    # Risk Management
    STOP_LOSS_PCT = 0.02  # 2%
    TAKE_PROFIT_PCT = 0.04 # 4%
    RISK_PER_TRADE = 0.01 # 1% of account balance

    # Strategy Settings
    SMA_SHORT_WINDOW = 20
    SMA_LONG_WINDOW = 50
