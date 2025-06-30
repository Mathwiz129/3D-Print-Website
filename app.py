from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import subprocess
import tempfile
import werkzeug
import struct
import math
import trimesh
import requests
import random

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests from your frontend

# Get price multiplier from environment variable, default to 1.0 for local development
PRICE_MULTIPLIER = float(os.environ.get('PRICE_MULTIPLIER', '1.0'))

# STL Weight Estimator API configuration
STL_API_URL = "https://stl-api-66l8.onrender.com/estimate-weight"

# Initialize Firebase Admin SDK (if not already done)
if not firebase_admin._apps:
    try:
        # Try to use environment variable (for Render deployment)
        firebase_creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        
        if firebase_creds and os.path.exists(firebase_creds):
            cred = credentials.Certificate(firebase_creds)
            firebase_admin.initialize_app(cred)
            print("Firebase: Environment credentials")
        else:
            # Fall back to file (for local development)
            local_creds_file = "outprint-3d-printing-firebase-adminsdk-fbsvc-bee53169f9.json"
            if os.path.exists(local_creds_file):
                cred = credentials.Certificate(local_creds_file)
                firebase_admin.initialize_app(cred)
                print("Firebase: Local credentials")
            else:
                print("Firebase: No credentials found")
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Firebase init error: {e}")
        # Continue without Firebase for now
        db = None
    else:
        try:
            db = firestore.client()
            print("Firebase: Connected")
        except Exception as e:
            print(f"Firebase client error: {e}")
            db = None
else:
    try:
        db = firestore.client()
        print("Firebase: Using existing app")
    except Exception as e:
        print(f"Firebase client error: {e}")
        db = None

# Serve main pages
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/apply')
def apply():
    return send_from_directory('.', 'apply.html')

@app.route('/about')
def about():
    return send_from_directory('.', 'about.html')

@app.route('/orders')
def orders():
    return send_from_directory('.', 'orders.html')

@app.route('/account')
def account():
    return send_from_directory('.', 'account.html')

@app.route('/login')
def login():
    return send_from_directory('.', 'login.html')

@app.route('/signup')
def signup():
    return send_from_directory('.', 'signup.html')

@app.route('/admin')
def admin():
    return send_from_directory('.', 'admin.html')

# Serve static files
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/health')
def health_check():
    """Health check endpoint to verify server and MeshLab status"""
    try:
        # Check if MeshLab is available
        result = subprocess.run(['meshlabserver', '--version'], 
                              capture_output=True, text=True, timeout=5)
        meshlab_available = result.returncode == 0
        meshlab_version = result.stdout.strip() if meshlab_available else "Not available"
    except:
        meshlab_available = False
        meshlab_version = "Not installed"
    
    # Check external STL API status
    stl_api_status = "unknown"
    try:
        response = requests.get("https://stl-api-66l8.onrender.com/health", timeout=5)
        stl_api_status = "healthy" if response.status_code == 200 else "unhealthy"
    except:
        stl_api_status = "unreachable"
    
    return jsonify({
        'status': 'healthy',
        'firebase_connected': db is not None,
        'meshlab_available': meshlab_available,
        'meshlab_version': meshlab_version,
        'stl_api_status': stl_api_status,
        'stl_api_url': STL_API_URL,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/test-db')
def test_database():
    """Test endpoint to check database connection and available materials"""
    try:
        if db is None:
            return jsonify({
                'error': 'Database not connected',
                'firebase_creds': os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'),
                'creds_file_exists': os.path.exists(os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', ''))
            })
        
        # Try to get materials
        materials_ref = db.collection('materials')
        materials = []
        try:
            material_docs = materials_ref.stream()
            for doc in material_docs:
                materials.append({
                    'id': doc.id,
                    'data': doc.to_dict()
                })
        except Exception as e:
            return jsonify({
                'error': f'Failed to query materials: {str(e)}',
                'firebase_connected': True
            })
        
        return jsonify({
            'success': True,
            'firebase_connected': True,
            'materials_count': len(materials),
            'materials': materials[:5]  # Show first 5 materials
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Database test failed: {str(e)}',
            'firebase_connected': db is not None
        })

def calculate_volume_with_trimesh(stl_file_path, units='mm'):
    try:
        mesh = trimesh.load(stl_file_path)
        if not mesh.is_watertight:
            mesh = mesh.fill_holes()
        volume = mesh.volume  # in mm³ if STL is in mm

        # Convert units if needed
        if units == 'mm':
            volume_cm3 = abs(volume) / 1000.0
        elif units == 'cm':
            volume_cm3 = abs(volume)
        elif units == 'in':
            # 1 in³ = 16.387 cm³
            volume_cm3 = abs(volume) * 16.387
        else:
            volume_cm3 = abs(volume) / 1000.0  # default to mm

        return volume_cm3
    except Exception as e:
        print(f"Trimesh volume calc failed: {e}")
        return None

def calculate_wall_and_infill_volume(stl_file_path, infill=0.2, wall_thickness_mm=1.2, layer_height_mm=0.2, top_bottom_layers=3, perimeters=2, density=1.24, units='mm'):
    mesh = trimesh.load(stl_file_path)
    
    if not mesh.is_watertight:
        mesh = mesh.fill_holes()
    
    total_volume_mm3 = abs(mesh.volume)
    surface_area_mm2 = mesh.area
    
    # Calculate expected volume from bounding box
    extents = mesh.extents
    expected_volume_mm3 = extents[0] * extents[1] * extents[2]
    
    # Calculate shell volume more realistically
    cube_side_length = max(extents)  # Assuming it's roughly cubic
    perimeter_length = 4 * cube_side_length  # Perimeter of one layer
    wall_height = cube_side_length  # Height of the walls
    
    # Wall volume = perimeter × wall height × wall thickness × perimeters
    wall_thickness_mm = 0.6  # Each perimeter is 0.6mm wide
    wall_volume_mm3 = perimeter_length * wall_height * wall_thickness_mm * perimeters
    
    # Top/bottom layers volume (only the top and bottom faces)
    top_bottom_area_mm2 = cube_side_length * cube_side_length  # Area of one face
    top_bottom_volume_mm3 = top_bottom_area_mm2 * layer_height_mm * top_bottom_layers * 2  # Top and bottom
    
    # Total shell volume
    shell_volume_mm3 = wall_volume_mm3 + top_bottom_volume_mm3
    shell_volume_mm3 = min(shell_volume_mm3, total_volume_mm3)  # Can't exceed total volume
    
    # Inner volume (what gets infill)
    inner_volume_mm3 = max(0, total_volume_mm3 - shell_volume_mm3)
    
    # Calculate material volume
    # Shell is 100% infill, inner volume gets user's infill percentage
    material_volume_mm3 = shell_volume_mm3 + (inner_volume_mm3 * infill)
    
    # Convert to cm³
    shell_volume_cm3 = shell_volume_mm3 / 1000.0
    inner_volume_cm3 = inner_volume_mm3 / 1000.0
    total_volume_cm3 = total_volume_mm3 / 1000.0
    material_volume_cm3 = material_volume_mm3 / 1000.0
    
    # Calculate weights
    shell_weight = shell_volume_cm3 * density
    infill_weight = inner_volume_cm3 * infill * density
    total_weight = shell_weight + infill_weight
    
    print(f"Trimesh: {total_weight:.1f}g, {total_volume_cm3:.1f}cm³")
    
    return {
        'material_volume_cm3': material_volume_cm3,
        'shell_volume_cm3': shell_volume_cm3,
        'inner_volume_cm3': inner_volume_cm3,
        'total_volume_cm3': total_volume_cm3,
        'shell_weight': shell_weight,
        'infill_weight': infill_weight,
        'total_weight': total_weight
    }

def call_stl_weight_api(stl_file_path, infill_percentage, material_density):
    """
    Call the external STL Weight Estimator API for accurate weight calculation
    
    Args:
        stl_file_path: Path to the STL file
        infill_percentage: Infill percentage (0-100)
        material_density: Material density in g/cm³
    
    Returns:
        float: Weight in grams, or None if failed
    """
    try:
        # Prepare the API request with fixed parameters
        with open(stl_file_path, 'rb') as stl_file:
            files = {'file': stl_file}
            data = {
                'infill_percentage': infill_percentage,
                'material_density': material_density,
                'line_thickness': 0.2,  # Fixed at 0.2mm
                'layer_height': 0.2,    # Fixed at 0.2mm
                'shell_count': 2        # Fixed at 2 shells
            }
            
            # Make the API call
            response = requests.post(STL_API_URL, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                weight_grams = result.get('weight_grams', 0)
                print(f"STL API: {weight_grams:.1f}g")
                return weight_grams
            else:
                print(f"STL API failed: {response.status_code}")
                return None
                
    except requests.exceptions.Timeout:
        print("STL API timeout")
        return None
    except requests.exceptions.RequestException as e:
        print(f"STL API error: {e}")
        return None
    except Exception as e:
        print(f"STL API unexpected error: {e}")
        return None

@app.route('/upload-stl', methods=['POST'])
def upload_stl():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.stl'):
            return jsonify({'error': 'File must be an STL file'}), 400
        
        # Get parameters from request
        units = request.form.get('units', 'mm')
        infill = float(request.form.get('infill', 20)) / 100  # Default 20%
        
        # Validate infill percentage (minimum 10%)
        if infill < 0.1:
            infill = 0.1
        elif infill > 1.0:
            infill = 1.0
            
        wall_thickness = float(request.form.get('wallThickness', 1.2))
        layer_height = float(request.form.get('layerHeight', 0.2))
        top_bottom_layers = int(request.form.get('topBottomLayers', 3))
        perimeters = int(request.form.get('perimeters', 2))
        density = float(request.form.get('density', 1.24))
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.stl') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # First, try the external STL Weight Estimator API for accurate weight
            infill_percentage = infill * 100
            
            # Call the external API
            weight_grams = call_stl_weight_api(
                stl_file_path=temp_path,
                infill_percentage=infill_percentage,
                material_density=density
            )
            
            if weight_grams is not None:
                # API call successful - return the weight
                calculation_method = f'External STL API (infill {infill_percentage}%, density {density}g/cm³)'
                
                return jsonify({
                    'success': True,
                    'weight': weight_grams,
                    'filename': file.filename,
                    'calculationMethod': calculation_method,
                    'apiUsed': True
                })
            
            # Fallback to existing trimesh calculation
            import trimesh
            
            result = calculate_wall_and_infill_volume(
                temp_path,
                infill=infill,
                wall_thickness_mm=wall_thickness,
                layer_height_mm=layer_height,
                top_bottom_layers=top_bottom_layers,
                perimeters=perimeters,
                density=density,
                units=units
            )
            calculation_method = f'Trimesh fallback (infill {infill_percentage}%, density {density}g/cm³)'
            
            return jsonify({
                'success': True,
                'weight': result['total_weight'],
                'filename': file.filename,
                'calculationMethod': calculation_method,
                'apiUsed': False
            })
        except Exception as e:
            # Emergency fallback
            try:
                mesh = trimesh.load(temp_path)
                if mesh.is_watertight:
                    total_volume_mm3 = abs(mesh.volume)
                    total_volume_cm3 = total_volume_mm3 / 1000.0
                else:
                    extents = mesh.extents
                    estimated_volume_cm3 = (extents[0] * extents[1] * extents[2]) / 1000.0
                    total_volume_cm3 = estimated_volume_cm3
            except Exception as fallback_error:
                total_volume_cm3 = 10.0
            
            emergency_weight = total_volume_cm3 * 0.3 * density
            
            return jsonify({
                'success': True,
                'weight': emergency_weight,
                'filename': file.filename,
                'calculationMethod': 'Emergency estimation',
                'warning': 'Volume calculation failed, using fallback estimation',
                'apiUsed': False
            })
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/calculate', methods=['POST'])
def calculate_cost():
    try:
        data = request.get_json()
        
        # Get parameters
        material = data.get('material')
        color = data.get('color')
        weight_grams = float(data.get('weight', 0))  # Weight in grams from STL API
        
        if not material or weight_grams <= 0:
            return jsonify({'error': 'Missing material or invalid weight'}), 400

        # Get material data from database
        if db is None:
            return jsonify({'error': 'Database not available'}), 500

        try:
            materials_ref = db.collection('materials')
            material_docs = materials_ref.where('name', '==', material).limit(1).stream()
            material_data = None
            for doc in material_docs:
                material_data = doc.to_dict()
                break
            if not material_data:
                return jsonify({'error': f'Material "{material}" not found in database'}), 404

            price_per_gram = float(material_data.get('price', 0.05))
            if color and 'colors' in material_data:
                for color_data in material_data['colors']:
                    if color_data.get('hex') == color:
                        price_per_gram = float(color_data.get('price', material_data.get('price', 0.05)))
                        break
        except Exception as db_error:
            return jsonify({'error': 'Database query failed'}), 500

        # Calculate cost: weight × price per gram × multiplier
        cost = weight_grams * price_per_gram * PRICE_MULTIPLIER

        print(f"Cost calc: {weight_grams:.1f}g × ${price_per_gram:.4f} = ${cost:.2f}")

        return jsonify({
            'cost': round(cost, 2),
            'breakdown': {
                'weight': round(weight_grams, 2),
                'pricePerGram': round(price_per_gram, 4),
                'priceMultiplier': PRICE_MULTIPLIER,
                'calculationMethod': 'Weight × Price per gram'
            }
        })
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/submit-printer-application', methods=['POST'])
def submit_printer_application():
    try:
        # Get application data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'materials', 'colors', 'printers']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Add timestamp and status
        data['submittedAt'] = datetime.now()
        data['status'] = 'pending'
        
        # Save to Firestore
        if db is None:
            return jsonify({'error': 'Database not available'}), 500
            
        doc_ref = db.collection('printer-applications').add(data)
        
        # Send email notification
        send_application_email(data['email'], data['name'])
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'id': doc_ref[1].id
        }), 200
        
    except Exception as e:
        print(f"Error submitting application: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def send_application_email(email, name):
    """Send confirmation email to applicant"""
    try:
        # Email configuration - update with your email settings
        sender_email = "your-email@outprint.com"  # Update with your email
        sender_password = "your-app-password"     # Update with your app password
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email
        msg['Subject'] = "Your Outprint Printer Application is Under Review"
        
        # Email body
        body = f"""
        Dear {name},
        
        Thank you for applying to be a printer on Outprint! We've received your application and it's now under review.
        
        What happens next:
        • Our team will review your application within 2 business days
        • We'll check your printer specifications and materials
        • You'll receive an email with our decision
        
        If you have any questions, please don't hesitate to contact us.
        
        Best regards,
        The Outprint Team
        
        ---
        This is an automated message. Please do not reply to this email.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email (you'll need to configure your email service)
        # For Gmail, you might use:
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        # server.starttls()
        # server.login(sender_email, sender_password)
        # server.send_message(msg)
        # server.quit()
        
        # For now, just print the email (remove this in production)
        print(f"Email would be sent to {email}:")
        print(body)
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        # Don't fail the application submission if email fails

def get_user_email_from_token():
    """Extract user email from Firebase ID token in Authorization header."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    id_token = auth_header.split(' ')[1]
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token.get('email')
    except Exception as e:
        print('Token verification failed:', e)
        return None

@app.route('/api/applications', methods=['GET'])
def get_user_applications():
    if db is None:
        return jsonify({'error': 'Database not available'}), 500
    user_email = get_user_email_from_token()
    if not user_email:
        return jsonify({'error': 'Not logged in'}), 401
    applications = []
    try:
        docs = db.collection('printer-applications').where('email', '==', user_email).stream()
        for doc in docs:
            app_data = doc.to_dict()
            app_data['id'] = doc.id
            applications.append(app_data)
        return jsonify(applications)
    except Exception as e:
        print('Error fetching applications:', e)
        return jsonify({'error': 'Failed to fetch applications'}), 500

@app.route('/api/admin/applications', methods=['GET'])
def admin_get_all_applications():
    if db is None:
        return jsonify({'error': 'Database not available'}), 500
    # TODO: Add admin check here!
    applications = []
    try:
        docs = db.collection('printer-applications').stream()
        for doc in docs:
            app_data = doc.to_dict()
            app_data['id'] = doc.id
            applications.append(app_data)
        return jsonify(applications)
    except Exception as e:
        print('Error fetching applications:', e)
        return jsonify({'error': 'Failed to fetch applications'}), 500

@app.route('/api/admin/applications/<app_id>', methods=['PATCH', 'DELETE'])
def admin_update_or_delete_application(app_id):
    if db is None:
        return jsonify({'error': 'Database not available'}), 500
    # TODO: Add admin check here!
    if request.method == 'PATCH':
        data = request.get_json()
        status = data.get('status')
        if not status or status not in ['accepted', 'denied']:
            return jsonify({'error': 'Invalid status'}), 400
        try:
            db.collection('printer-applications').document(app_id).update({'status': status})
            return jsonify({'success': True})
        except Exception as e:
            print('Error updating application:', e)
            return jsonify({'error': 'Failed to update application'}), 500
    elif request.method == 'DELETE':
        try:
            db.collection('printer-applications').document(app_id).delete()
            return jsonify({'success': True})
        except Exception as e:
            print('Error deleting application:', e)
            return jsonify({'error': 'Failed to delete application'}), 500

@app.route('/api/firebase-config')
def get_firebase_config():
    """Serve Firebase config from environment variables"""
    # For local development, use hardcoded config if env vars aren't set
    if os.environ.get('FIREBASE_API_KEY'):
        # Production/Deployment: Use environment variables
        config = {
            "apiKey": os.environ.get('FIREBASE_API_KEY'),
            "authDomain": os.environ.get('FIREBASE_AUTH_DOMAIN'),
            "projectId": os.environ.get('FIREBASE_PROJECT_ID'),
            "storageBucket": os.environ.get('FIREBASE_STORAGE_BUCKET'),
            "messagingSenderId": os.environ.get('FIREBASE_MESSAGING_SENDER_ID'),
            "appId": os.environ.get('FIREBASE_APP_ID'),
            "measurementId": os.environ.get('FIREBASE_MEASUREMENT_ID')
        }
    else:
        # Local development: Use hardcoded config (safe for local testing)
        config = {
            "apiKey": "AIzaSyAbUwgBItOT4kOnUnsliHpMgNI7ONQuAqA",
            "authDomain": "outprint-3d-printing.firebaseapp.com",
            "projectId": "outprint-3d-printing",
            "storageBucket": "outprint-3d-printing.firebasestorage.app",
            "messagingSenderId": "11337273606",
            "appId": "1:11337273606:web:3daa9f8f673cae76c30e87",
            "measurementId": "G-9G95YJB9LH"
        }
    return jsonify(config)

@app.route('/api/sheets-data')
def get_sheets_data():
    """Fetch Google Sheets data securely from backend"""
    sheet_id = "1H6XhzxP4rr6gXOBdhGBhIory9gBKWudl2FD7p8cdgrU"
    
    # For local development, use hardcoded API key if env var isn't set
    api_key = os.environ.get('GOOGLE_SHEETS_API_KEY')
    if not api_key:
        # Local development: Use hardcoded API key (safe for local testing)
        api_key = "AIzaSyBhJmoT7U_-R_ewsOs2E0uTqC_1IXIbQC0"
    
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/A2:B2?alt=json&key={api_key}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get('values') and data['values'][0]:
            return jsonify({
                'printers': data['values'][0][0],
                'orders': data['values'][0][1]
            })
        else:
            return jsonify({'error': 'No data found in sheet'}), 404
            
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch sheet data: {str(e)}'}), 500

@app.route('/api/orders', methods=['GET', 'POST'])
def handle_orders():
    """Handle orders - GET for retrieving user orders, POST for submitting new orders"""
    
    if request.method == 'POST':
        """Submit a new order"""
        try:
            order_data = request.json
            
            if not order_data:
                return jsonify({'error': 'No order data provided'}), 400
            
            # Validate required fields
            required_fields = ['customer', 'shipping', 'items', 'total']
            for field in required_fields:
                if field not in order_data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            # Add order metadata
            order_data['createdAt'] = datetime.now().isoformat()
            order_data['status'] = 'pending'
            order_data['orderNumber'] = order_data.get('orderNumber', generate_order_number())
            
            # Save to Firestore if available
            if db:
                try:
                    # Add to orders collection
                    order_ref = db.collection('orders').add(order_data)
                    order_data['firestoreId'] = order_ref[1].id
                    
                    # Also save to user's orders if user is logged in
                    if 'userId' in order_data:
                        user_orders_ref = db.collection('users').document(order_data['userId']).collection('orders').add(order_data)
                        order_data['userOrderId'] = user_orders_ref[1].id
                    
                    print(f"Order saved: {order_data['orderNumber']}")
                    
                except Exception as e:
                    print(f"Order save error: {e}")
                    # Continue without Firestore if it fails
            
            # Send confirmation email (if email service is configured)
            try:
                send_order_confirmation_email(order_data)
            except Exception as e:
                print(f"Email error: {e}")
                # Continue without email if it fails
            
            return jsonify({
                'success': True,
                'orderNumber': order_data['orderNumber'],
                'message': 'Order submitted successfully'
            })
            
        except Exception as e:
            print(f"Order processing error: {e}")
            return jsonify({'error': 'Failed to process order'}), 500
    
    elif request.method == 'GET':
        """Get orders for the current user"""
        try:
            # Get user ID from query parameter or header
            user_id = request.args.get('userId') or request.headers.get('X-User-ID')
            
            if not user_id:
                return jsonify({'error': 'User ID required'}), 400
            
            if not db:
                return jsonify({'error': 'Database not available'}), 500
            
            # Get orders from Firestore
            try:
                # Get orders from user's orders subcollection
                user_orders_ref = db.collection('users').document(user_id).collection('orders')
                orders = []
                
                for doc in user_orders_ref.stream():
                    order_data = doc.to_dict()
                    order_data['id'] = doc.id
                    orders.append(order_data)
                
                # Sort by creation date (newest first)
                orders.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
                
                return jsonify({
                    'success': True,
                    'orders': orders,
                    'count': len(orders)
                })
                
            except Exception as e:
                print(f"Order fetch error: {e}")
                return jsonify({'error': 'Failed to fetch orders'}), 500
                
        except Exception as e:
            print(f"Order get error: {e}")
            return jsonify({'error': 'Failed to get orders'}), 500

def generate_order_number():
    """Generate a unique order number"""
    timestamp = str(int(datetime.now().timestamp()))
    random_suffix = str(random.randint(100, 999))
    return f"ORD{timestamp[-6:]}{random_suffix}"

def send_order_confirmation_email(order_data):
    """Send order confirmation email"""
    try:
        customer_email = order_data['customer']['email']
        order_number = order_data['orderNumber']
        total = order_data['total']
        
        # Create email content
        subject = f"Order Confirmation - {order_number}"
        body = f"""
        Thank you for your order!
        
        Order Number: {order_number}
        Total: ${total:.2f}
        
        We'll start processing your 3D prints right away. You'll receive updates as your order progresses.
        
        Best regards,
        The Outprint Team
        """
        
        # For now, just log the email (you can implement actual email sending later)
        print(f"Email: {customer_email} - {order_number} - ${total:.2f}")
        
    except Exception as e:
        print(f"Email creation error: {e}")

@app.route('/test-trimesh')
def test_trimesh():
    """Test endpoint to check if trimesh is working properly"""
    try:
        import trimesh
        
        # Create a simple test cube
        vertices = [[0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
                   [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10]]
        faces = [[0, 1, 2], [0, 2, 3], [4, 7, 6], [4, 6, 5],
                [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2],
                [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]]
        
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
        volume = mesh.volume
        
        return jsonify({
            'success': True,
            'trimesh_version': trimesh.__version__,
            'test_volume': volume,
            'expected_volume': 1000.0,
            'is_watertight': mesh.is_watertight,
            'bounds': mesh.bounds.tolist(),
            'extents': mesh.extents.tolist()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test-stl-api')
def test_stl_api():
    """Test endpoint to check if the external STL Weight Estimator API is working"""
    try:
        # Check if we have the test STL file
        test_stl_path = "100mm cubed.stl"
        if not os.path.exists(test_stl_path):
            return jsonify({
                'success': False,
                'error': 'Test STL file not found',
                'message': 'Please ensure "100mm cubed.stl" exists in the project directory'
            }), 404
        
        # Test with the 100mm cube STL file
        weight_grams = call_stl_weight_api(
            stl_file_path=test_stl_path,
            infill_percentage=20,
            material_density=1.24
        )
        
        if weight_grams is not None:
            return jsonify({
                'success': True,
                'api_working': True,
                'test_file': test_stl_path,
                'weight_grams': weight_grams,
                'expected_weight_g': 1240.0,  # 1000cm³ × 1.24g/cm³ = 1240g
                'weight_accuracy': f"{abs(weight_grams - 1240.0) / 1240.0 * 100:.2f}% difference"
            })
        else:
            return jsonify({
                'success': False,
                'api_working': False,
                'error': 'External API call failed',
                'test_file': test_stl_path,
                'message': 'The external STL Weight Estimator API is not responding'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)