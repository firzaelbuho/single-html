import os
import requests
import re
import time

API_URL = "https://jkt48.com/api/v1/members?lang=id"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

SAVE_DIR = r"e:\Project\single-html\48\assets\img"
os.makedirs(SAVE_DIR, exist_ok=True)

def clean_filename(name):
    # Hilangkan karakter yang tidak valid untuk nama file Windows/Unix
    # namun pelihara spasi dan huruf
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    return clean.strip()

print("Fetching members list...")
try:
    response = requests.get(API_URL, headers=HEADERS, timeout=10)
    data = response.json()
    members = data.get("data", [])
    print(f"Found {len(members)} members.")
    
    for member in members:
        name = member.get("name", "Unknown")
        photo_url = member.get("photo", "")
        
        if not photo_url:
            continue
            
        # Perbaiki format url HTTPS misal aslinya "//jkt48.com..."
        if photo_url.startswith("//"):
            photo_url = "https:" + photo_url
        elif photo_url.startswith("/"):
            photo_url = "https://jkt48.com" + photo_url
            
        safe_name = clean_filename(name)
        save_path = os.path.join(SAVE_DIR, f"{safe_name}.jpg")
        
        print(f"Downloading {safe_name}...")
        try:
            img_res = requests.get(photo_url, headers=HEADERS, timeout=10)
            if img_res.status_code == 200:
                with open(save_path, 'wb') as f:
                    f.write(img_res.content)
            else:
                print(f"  -> Error {img_res.status_code}")
        except Exception as e:
            print(f"  -> Exception: {e}")
            
        time.sleep(0.1) # Kasih jeda sedikit agar tidak membebani server
        
    print(f"\nAll downloads finished! Files saved in: {SAVE_DIR}")
except Exception as e:
    print(f"Error fetching members: {e}")
