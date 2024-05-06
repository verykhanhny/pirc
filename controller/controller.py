import picamera2.encoders
import picamera2.outputs
import requests
import asyncio
import websockets
import json
import hashlib
import os
import time
import dotenv
import picamera2


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
def login(base_url, udp0_url, udp1_url):
    try:
        salt = get_salt(base_url)
        cookie = auth(base_url, salt)
        asyncio.run(connect(base_url, udp0_url, udp1_url, cookie))
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


# Connect a websocket to the server using the session cookie
async def connect(base_url, udp0_url, udp1_url, cookie):
    camera0 = picamera2.Picamera2(0)
    camera1 = picamera2.Picamera2(1)
    encoder0 = picamera2.encoders.H264Encoder(100000)
    encoder1 = picamera2.encoders.H264Encoder(100000)

    camera0.configure(camera0.create_video_configuration(main={"size": (320, 240)}))
    camera1.configure(camera1.create_video_configuration(main={"size": (320, 240)}))
    try:
        camera0.start_recording(
            encoder0,
            picamera2.outputs.FfmpegOutput(f"-f h264 udp://{udp0_url}"),
        )
        camera1.start_recording(
            encoder1,
            picamera2.outputs.FfmpegOutput(f"-f h264 udp://{udp1_url}"),
        )

        print("Connecting to WebSocket...")
        async with websockets.connect(
            f"wss://{base_url}", extra_headers={"Cookie": cookie}
        ) as ws:
            try:
                print("WebSocket connection opened")
                # Start the handlers
                tasks = [
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


if __name__ == "__main__":
    dotenv.load_dotenv()
    base_url = f"{os.environ.get('host')}:{os.environ.get('port')}"
    udp0_url = f"{os.environ.get('sock')}:{os.environ.get('udp0')}"
    udp1_url = f"{os.environ.get('sock')}:{os.environ.get('udp1')}"
    login(base_url, udp0_url, udp1_url)
    while True:
        time.sleep(3)
