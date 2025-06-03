from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class PrinterConnectionManager:
    def __init__(self):
        self.active_printers: Dict[str, WebSocket] = {}
        self.logger = logging.getLogger(__name__)

    async def connect(self, printer_id: str, websocket: WebSocket):
        try:
            # Không accept connection ở đây vì đã được accept trong endpoint
            self.active_printers[printer_id] = websocket
            self.logger.info(f"Printer {printer_id} connected")
            return True
        except Exception as e:
            self.logger.error(f"Error connecting printer {printer_id}: {str(e)}")
            return False

    def disconnect(self, printer_id: str):
        if printer_id in self.active_printers:
            del self.active_printers[printer_id]
            self.logger.info(f"Printer {printer_id} disconnected")

    async def send_to_printer(self, printer_id: str, data: dict):
        if printer_id in self.active_printers:
            try:
                await self.active_printers[printer_id].send_json(data)
                return True
            except Exception as e:
                self.logger.error(f"Error sending to printer {printer_id}: {str(e)}")
                return False
        return False

    async def broadcast_to_printers(self, data: dict):
        disconnected_printers = []
        for printer_id, connection in self.active_printers.items():
            try:
                await connection.send_json(data)
            except Exception as e:
                self.logger.error(f"Error broadcasting to printer {printer_id}: {str(e)}")
                disconnected_printers.append(printer_id)
        
        # Xóa các printer đã ngắt kết nối
        for printer_id in disconnected_printers:
            self.disconnect(printer_id)

printer_manager = PrinterConnectionManager() 