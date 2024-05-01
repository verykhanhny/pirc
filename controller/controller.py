import requests
import asyncio
import websockets
import json
import hashlib
import os
import time
import random

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

# Base URL
BASE_URL = f"{os.environ.get('hostname')}:{os.environ.get('port')}"


def get_salt():
    try:
        response = requests.get(f"http://{BASE_URL}/salt")
        response.raise_for_status()
        return response.text
    except Exception as e:
        raise Exception(f"Error getting salt: {e}")


def auth(salt):
    salted_password = os.environ.get("password") + salt
    hashed_password = hashlib.sha512(salted_password.encode("utf-8")).hexdigest()
    login_data = {"username": os.environ.get("username"), "password": hashed_password}

    try:
        response = requests.post(f"http://{BASE_URL}/login", json=login_data)
        response.raise_for_status()
        print("Login successful!")
        return response.headers["set-cookie"]
    except Exception as e:
        raise Exception(f"Login failed: {e}")


def login():
    try:
        salt = get_salt()
        cookie = auth(salt)
        asyncio.run(connect(cookie))
    except Exception as e:
        print(f"Error logging in: {e}")


async def on_message(ws):
    while True:
        try:
            message = json.loads(await ws.recv())
            print(f"Received: {message}")
            if "code" in message:
                return
        except Exception as e:
            raise Exception(f"Error recieving message: {e}")


async def stream(ws):
    while True:
        try:
            data = generate_data()
            await ws.send(data)
            await asyncio.sleep(1)
        except Exception as e:
            raise Exception(f"Error sending message: {e}")


async def connect(cookie):
    print("Connecting to WebSocket...")
    try:
        async with websockets.connect(
            f"ws://{BASE_URL}", extra_headers={"Cookie": cookie}
        ) as ws:
            try:
                print("WebSocket connection opened")
                tasks = [
                    asyncio.create_task(stream(ws)),
                    asyncio.create_task(on_message(ws)),
                ]
                group = asyncio.gather(*tasks)
                await group
            except Exception as e:
                print(f"Lost connection: {e}")
                for task in tasks:
                    if not task.done():
                        task.cancel()
    except Exception as e:
        print(f"Failed to connect: {e}")


def generate_data():
    return str(random.random())


while True:
    login()
    time.sleep(3)
