import logging

class RiskManager:
    def __init__(self, risk_per_trade, stop_loss_pct, take_profit_pct):
        self.risk_per_trade = risk_per_trade
        self.stop_loss_pct = stop_loss_pct
        self.take_profit_pct = take_profit_pct

    def calculate_position_size(self, account_balance, current_price):
        """
        Calculates position size based on risk per trade.
        """
        # Risk amount in quote currency (e.g., USDT)
        risk_amount = account_balance * self.risk_per_trade
        
        # Stop loss distance per unit
        stop_loss_distance = current_price * self.stop_loss_pct
        
        if stop_loss_distance == 0:
            return 0

        # Position size = Risk Amount / Stop Loss Distance
        position_size = risk_amount / stop_loss_distance
        
        return position_size

    def check_funds(self, balance, required_amount):
        return balance >= required_amount
