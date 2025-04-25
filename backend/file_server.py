from dotenv import load_dotenv
import os, mimetypes
from flask import Flask, request, jsonify
from datetime import datetime
from pathlib import Path


load_dotenv()
class server:
    def __init__(self):
        self.expected_key = os.getenv('api_key')
        self.environment = os.getenv('py_env')
        self.base_url = "/api/v1"
        self.base_dir = os.getenv('base_dir')
        self.app = Flask(__name__)
        self.setup_routes()


    def setup_routes(self):
        self.app.add_url_rule("/", "index", self.index, methods=['GET'])
        self.app.add_url_rule(f"{self.base_url}/health", "health", self.health, methods=['GET'])
        self.app.add_url_rule(f"{self.base_url}/auth/validate", "validate_key", self.validate_key, methods=['POST'])
        self.app.add_url_rule(f"{self.base_url}/createdir", "create_dir", self.create_dir, methods=['POST'])
        self.app.add_url_rule(f"{self.base_url}/delete", "delete_obj", self.delete_obj, methods=['POST'])
        self.app.add_url_rule(f"{self.base_url}/browse", "browse", self.browse, defaults={"path": ""}, methods=['GET'])
        self.app.add_url_rule(f"{self.base_url}/browse/<path:path>", "browse_with_path", self.browse, methods=['GET'])

    def index(self):
        return jsonify(status=200, message=f"Success, Welcome to your file server API!")
    
    def health(self):
        try:
            return jsonify(status=200, content={
                "status": "ok",
                "timestamp": datetime.now(),
                "environment": self.environment,
                "filesDirectory": self.base_dir,
            })
        except Exception as e:
            print(f"[FAIL] - Health check failed, {e}")
            return jsonify(status=500, message="Internal Server Error")
    
    def isAuthenticated(self, request):
        try:
            authHeader = request.headers.get("Authorization")
            if not authHeader:
                return False
            
            token = authHeader.replace("Bearer ", "")
            if not token:
                return False
            
            if token != self.expected_key:
                return False
            return token==self.expected_key
        except Exception as e:
            print(f"Error: {e}")
            return False
        
    def validate_key(self):
        try:
            authHeader = request.headers.get("Authorization")
            if not authHeader:
                return jsonify(status=401, message="No authorization header")
            
            token = authHeader.replace("Bearer ", "")
            if not token:
                return jsonify(status=401, message="No token provided")
            
            if not self.expected_key:
                print(f"API_KEY environment variable not set")
                return jsonify(status=500, message="Server configuration error")
            
            if token != self.expected_key:
                return jsonify(status=401, message="Incorrect or Invalid API Key")

            return jsonify(status=200, message="API Key validated successfully")
        except Exception as e:
            print(f"Internal Server Error: {e}")
            return jsonify(status=500, message="Internal Server Error")
    
    def create_dir(self):
        try:
            params = request.args
            authenticated = self.isAuthenticated(request=request)
            if not authenticated:
                return jsonify(status=401, message="Authentication required")
            requestPath = os.path.join(params['path']) if 'path' in params and params['path'] else ""
            fullPath = os.path.join(self.base_dir, requestPath)

            os.makedirs(fullPath, exist_ok=False)
            return jsonify(status=200, content={
                "message" : "Folder created successfully",
                "location" : fullPath
            })
        except Exception as e:
            print(f"Error: {e}")
            message = "Folder already exists" if "WinError 183" in str(e) else "Internal Server Error"
            status = 409 if "WinError 183" in str(e) else 500
            return jsonify(status=status, message=message)
    
    def delete_obj(self):
        try:
            type="Folder"
            params = request.args
            authenticated = self.isAuthenticated(request=request)
            if not authenticated:
                return jsonify(status=401, message="Authentication required")
            requestPath = os.path.join(params['path']) if 'path' in params and params['path'] else ""
            fullPath = os.path.join(self.base_dir, requestPath)
            print(fullPath)
            if not os.path.exists(fullPath):
                return jsonify(status=404, message="Folder or File does not exist")
            if os.path.isdir(fullPath):
                os.rmdir(fullPath)
            else:
                type="File"
                os.remove(fullPath)
            return jsonify(status=200, message=f"{type} {requestPath} deleted successfully)")
        except Exception as e:
            print(f"Error deleting file: {e}")
            return jsonify(status=500, message="Internal Server Error")
    
    def browse(self, path=""):
        try:
            request_path = Path(path)
            full_path = Path(self.base_dir) / request_path
            full_path = full_path.resolve()

            if not full_path.exists():
                return jsonify(status=404, error="File or directory not found", files=[])

            if full_path.is_dir():
                file_details = []
                for file in full_path.iterdir():
                    is_dir = file.is_dir()
                    extension = None
                    mime_type = None

                    if not is_dir:
                        extension = file.suffix
                        mime_type, _ = mimetypes.guess_type(file)
                        if not mime_type:
                            mime_type = "application/octet-stream"

                    file_details.append({
                        "name": file.name,
                        "type": "directory" if is_dir else "file",
                        "size": None if is_dir else file.stat().st_size,
                        "mimeType": mime_type,
                        "extension": extension,
                        "path": str((Path("/") / request_path / file.name).as_posix()),
                    })

                return jsonify(status=200, files=file_details)

            else:
                mime_type, _ = mimetypes.guess_type(full_path)
                if not mime_type:
                    mime_type = "application/octet-stream"
                return self.app.response_class(
                    response=full_path.read_bytes(),
                    status=200,
                    mimetype=mime_type,
                    headers={
                        "Content-Length": str(full_path.stat().st_size)
                    }
                )

        except Exception as e:
            print(f"Error accessing file: {e}")
            return jsonify(status=500, error="Internal server error", files=[])


if __name__ == '__main__':
    api = server()
    expected_key = api.expected_key
    if not os.path.exists(api.base_dir):
        os.makedirs(api.base_dir, exist_ok=True)
    api.app.run('0.0.0.0', 5000, debug=True)