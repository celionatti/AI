import pandas as pd
import logging

class Strategy:
    def __init__(self, name):
        self.name = name

    def generate_signal(self, df):
        """
        Analyzes the DataFrame and returns a signal.
        Returns:
            'buy', 'sell', or None
        """
        raise NotImplementedError("Should implement generate_signal method")

class SMACrossoverStrategy(Strategy):
    def __init__(self, short_window=20, long_window=50):
        super().__init__("SMA Crossover")
        self.short_window = short_window
        self.long_window = long_window

    def generate_signal(self, df):
        if df.empty:
            return None

        # Calculate Indicators using Pandas
        df['sma_short'] = df['close'].rolling(window=self.short_window).mean()
        df['sma_long'] = df['close'].rolling(window=self.long_window).mean()

        # Get last two rows to check for crossover
        if len(df) < 2:
            return None
            
        last_row = df.iloc[-1]
        prev_row = df.iloc[-2]

        # Buy Signal: Short SMA crosses above Long SMA
        if prev_row['sma_short'] <= prev_row['sma_long'] and last_row['sma_short'] > last_row['sma_long']:
            return 'buy'
        
        # Sell Signal: Short SMA crosses below Long SMA
        if prev_row['sma_short'] >= prev_row['sma_long'] and last_row['sma_short'] < last_row['sma_long']:
            return 'sell'
            
        return None
