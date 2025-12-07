import logging

class ExecutionHandler:
    def __init__(self, exchange):
        self.exchange = exchange

    def place_buy_order(self, symbol, amount):
        try:
            # In Sandbox/Paper mode, this might just log
            order = self.exchange.create_market_buy_order(symbol, amount)
            logging.info(f"BUY Order Placed: {order}")
            return order
        except Exception as e:
            logging.error(f"Failed to place BUY order: {e}")
            return None

    def place_sell_order(self, symbol, amount):
        try:
            order = self.exchange.create_market_sell_order(symbol, amount)
            logging.info(f"SELL Order Placed: {order}")
            return order
        except Exception as e:
            logging.error(f"Failed to place SELL order: {e}")
            return None
