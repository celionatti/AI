import logging
import time
from config import Config
from src.data_loader import DataHandler
from src.strategy import SMACrossoverStrategy
from src.executor import ExecutionHandler
from src.risk_manager import RiskManager

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("trading_bot.log"),
        logging.StreamHandler()
    ]
)

def main():
    logging.info("Starting Trading Bot...")
    logging.info(f"Exchange: {Config.EXCHANGE_ID}")
    logging.info(f"Mode: {'SANDBOX' if Config.SANDBOX_MODE else 'LIVE'}")
    
    # Initialize components
    try:
        data_handler = DataHandler(Config.EXCHANGE_ID, Config.SYMBOL, Config.TIMEFRAME, Config.SANDBOX_MODE)
        risk_manager = RiskManager(Config.RISK_PER_TRADE, Config.STOP_LOSS_PCT, Config.TAKE_PROFIT_PCT)
        executor = ExecutionHandler(data_handler.exchange)
        strategy = SMACrossoverStrategy(Config.SMA_SHORT_WINDOW, Config.SMA_LONG_WINDOW)
        
        logging.info("Components initialized successfully.")
    except Exception as e:
        logging.error(f"Initialization failed: {e}")
        return

    try:
        while True:
            logging.info("Checking market...")
            
            # 1. Fetch Data
            df = data_handler.fetch_ohlcv(limit=100)
            if df.empty:
                logging.warning("No data fetched. Retrying...")
                time.sleep(10)
                continue
                
            current_price = df.iloc[-1]['close']
            logging.info(f"Current Price: {current_price}")

            # 2. Analyze Data (Strategy)
            signal = strategy.generate_signal(df)
            logging.info(f"Signal: {signal}")

            # 3. Execute Trade (if signal)
            if signal:
                # Check current balance (Mocking balance for now if API fails)
                try:
                    balance_info = data_handler.exchange.fetch_balance()
                    # Assuming USDT for now
                    quote_currency = Config.SYMBOL.split('/')[1]
                    balance = balance_info.get(quote_currency, {}).get('free', 0)
                except Exception:
                    logging.warning("Could not fetch balance. Using mock balance 1000.")
                    balance = 1000.0

                if signal == 'buy':
                    position_size = risk_manager.calculate_position_size(balance, current_price)
                    if position_size > 0:
                        logging.info(f"Placing BUY order for {position_size} units.")
                        executor.place_buy_order(Config.SYMBOL, position_size)
                    else:
                        logging.warning("Calculated position size is 0. Insufficient funds or risk too high.")
                
                elif signal == 'sell':
                    # For selling, we'd check the base currency balance
                    # Simplified: just sell a fixed amount or all (logic needs refinement for real usage)
                    logging.info("Placing SELL order.")
                    # In a real scenario, we'd track our position. 
                    # For now, let's just log it as we don't have a position tracker yet.
                    executor.place_sell_order(Config.SYMBOL, 0.001) # Mock amount

            time.sleep(60) # Wait for next cycle

            
    except KeyboardInterrupt:
        logging.info("Bot stopped by user.")
    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)

if __name__ == "__main__":
    main()
