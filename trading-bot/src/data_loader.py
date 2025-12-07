import ccxt
import pandas as pd
import logging

class DataHandler:
    def __init__(self, exchange_id, symbol, timeframe, sandbox=False):
        self.exchange_id = exchange_id
        self.symbol = symbol
        self.timeframe = timeframe
        self.sandbox = sandbox
        self.exchange = self._initialize_exchange()

    def _initialize_exchange(self):
        try:
            exchange_class = getattr(ccxt, self.exchange_id)
            exchange = exchange_class()
            exchange.set_sandbox_mode(self.sandbox)
            return exchange
        except AttributeError:
            logging.error(f"Exchange '{self.exchange_id}' not found in ccxt.")
            raise

    def fetch_ohlcv(self, limit=100):
        """Fetches OHLCV data and returns a DataFrame."""
        try:
            ohlcv = self.exchange.fetch_ohlcv(self.symbol, self.timeframe, limit=limit)
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            logging.error(f"Error fetching data: {e}")
            return pd.DataFrame()

    def get_ticker(self):
        """Fetches current ticker data."""
        try:
            return self.exchange.fetch_ticker(self.symbol)
        except Exception as e:
            logging.error(f"Error fetching ticker: {e}")
            return None
