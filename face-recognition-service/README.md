# Face Recognition Python Service

A simple Python microservice for facial recognition using face_recognition library.

## Setup

```bash
cd face-recognition-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## API Endpoints

- `POST /register` - Register a face
- `POST /verify` - Verify a face
- `GET /health` - Health check

## Environment Variables

- `PORT` - Server port (default: 5001)
- `UPLOAD_FOLDER` - Folder to store face images (default: ./faces)
