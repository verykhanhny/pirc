import requests
import asyncio
import websockets
import json
import hashlib
import os
import time
import random
import dotenv


# Get the salt from the server to append to the password
def get_salt(base_url):
    try:
        response = requests.get(f"https://{base_url}/salt")
        response.raise_for_status()
        return response.text
    except Exception as e:
        raise Exception(f"Error getting salt: {e}")


# Salt the password and hash it before sending to server for authenticating
def auth(base_url, salt):
    salted_password = os.environ.get("password") + salt
    hashed_password = hashlib.sha512(salted_password.encode("utf-8")).hexdigest()
    login_data = {"username": os.environ.get("username"), "password": hashed_password}

    try:
        response = requests.post(f"https://{base_url}/login", json=login_data)
        response.raise_for_status()
        print("Login successful!")
        return response.headers["set-cookie"]
    except Exception as e:
        raise Exception(f"Login failed: {e}")


# Authenticate and connect to websocket
def login(base_url):
    try:
        salt = get_salt(base_url)
        cookie = auth(base_url, salt)
        asyncio.run(connect(base_url, cookie))
    except Exception as e:
        print(f"Error logging in: {e}")


# Handler for incoming commands from server
async def on_message(ws):
    while True:
        try:
            message = json.loads(await ws.recv())
            print(f"Received: {message}")
            if "code" in message:
                return
        except Exception as e:
            raise Exception(f"Error receiving message: {e}")


# Handler to stream video to server
async def stream(ws):
    while True:
        try:
            data = generate_data()
            await ws.send(data)
            await asyncio.sleep(1)
        except Exception as e:
            raise Exception(f"Error sending message: {e}")


# Connect a websocket to the server using the session cookie
async def connect(base_url, cookie):
    print("Connecting to WebSocket...")
    try:
        async with websockets.connect(
            f"wss://{base_url}", extra_headers={"Cookie": cookie}
        ) as ws:
            try:
                print("WebSocket connection opened")
                # Start the handlers
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


dotenv.load_dotenv()
base_url = f"{os.environ.get('hostname')}:{os.environ.get('port')}"
while True:
    login(base_url)
    time.sleep(3)
