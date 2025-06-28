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

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests from your frontend

# Initialize Firebase Admin SDK (if not already done)
if not firebase_admin._apps:
    try:
        # Try to use environment variable (for Render deployment)
        firebase_creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        print("GOOGLE_APPLICATION_CREDENTIALS:", firebase_creds)
        
        if firebase_creds and os.path.exists(firebase_creds):
            print("File exists:", os.path.exists(firebase_creds))
            with open(firebase_creds) as f:
                print("First 100 chars of file:", f.read(100))
            cred = credentials.Certificate(firebase_creds)
            firebase_admin.initialize_app(cred)
            print("Firebase initialized with environment credentials")
        else:
            # Fall back to file (for local development)
            local_creds_file = "outprint-3d-printing-firebase-adminsdk-fbsvc-bee53169f9.json"
            if os.path.exists(local_creds_file):
                cred = credentials.Certificate(local_creds_file)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized with local credentials file")
            else:
                print("No Firebase credentials found, running without database")
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Firebase initialization error: {e}")
        # Continue without Firebase for now
        db = None
    else:
        try:
            db = firestore.client()
            print("Firestore client created successfully")
        except Exception as e:
            print(f"Firestore client creation failed: {e}")
            db = None
else:
    try:
        db = firestore.client()
        print("Using existing Firebase app")
    except Exception as e:
        print(f"Firestore client creation failed: {e}")
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
    
    return jsonify({
        'status': 'healthy',
        'firebase_connected': db is not None,
        'meshlab_available': meshlab_available,
        'meshlab_version': meshlab_version,
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
        print(f"Mesh extents: {mesh.extents}")
        print(f"Mesh bounding box: {mesh.bounding_box.extents}")
        if not mesh.is_watertight:
            print("Mesh is not watertight, attempting to fill holes...")
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
        print(f"Trimesh calculation failed: {e}")
        return None

def calculate_wall_and_infill_volume(stl_file_path, infill=0.2, wall_thickness_mm=1.2, layer_height_mm=0.2, top_bottom_layers=3, perimeters=2, density=1.24, units='mm'):
    print(f"=== STL Volume Calculation Debug ===")
    print(f"Loading STL file: {stl_file_path}")
    print(f"Expected units: {units}")
    
    mesh = trimesh.load(stl_file_path)
    print(f"Mesh loaded successfully")
    print(f"Mesh bounds: {mesh.bounds}")
    print(f"Mesh extents: {mesh.extents}")
    print(f"Mesh extents (mm): {mesh.extents}")
    print(f"Mesh extents (cm): {mesh.extents / 10.0}")
    print(f"Expected cube size: 100mm = 10cm")
    print(f"Actual cube size from mesh: {max(mesh.extents)}mm = {max(mesh.extents) / 10.0}cm")
    
    if not mesh.is_watertight:
        print("Mesh was not watertight, filling holes...")
        mesh = mesh.fill_holes()
    
    total_volume_mm3 = abs(mesh.volume)
    surface_area_mm2 = mesh.area
    
    print(f"=== Volume Calculation Results ===")
    print(f"Raw mesh volume: {mesh.volume}")
    print(f"Total volume (mm³): {total_volume_mm3}")
    print(f"Total volume (cm³): {total_volume_mm3 / 1000.0}")
    print(f"Expected volume for 10cm cube: 1000 cm³")
    print(f"Expected volume for 100mm cube: 1,000,000 mm³")
    print(f"Surface area (mm²): {surface_area_mm2}")
    print(f"Expected surface area for 10cm cube: 600 cm² = 60,000 mm²")
    print(f"Wall thickness (mm): {wall_thickness_mm}")
    print(f"Layer height (mm): {layer_height_mm}")
    print(f"Top/bottom layers: {top_bottom_layers}")
    print(f"Perimeters: {perimeters}")
    
    # More accurate calculation based on typical 3D printing parameters
    # This accounts for multiple perimeters, top/bottom layers, and proper infill
    
    # Estimate the part dimensions for better calculations
    extents = mesh.extents
    max_dimension = max(extents)
    min_dimension = min(extents)
    
    # Calculate shell volume more accurately using actual printing parameters
    # Wall volume = surface area × perimeter thickness × perimeters
    perimeter_thickness = 0.6  # Each perimeter is 0.6mm wide
    wall_volume_mm3 = surface_area_mm2 * perimeter_thickness * perimeters
    
    # Top/bottom layers volume
    top_bottom_volume_mm3 = surface_area_mm2 * layer_height_mm * top_bottom_layers
    
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
    
    print(f"=== Final CM³ Values ===")
    print(f"Total volume: {total_volume_cm3} cm³")
    print(f"Wall volume: {wall_volume_mm3 / 1000.0} cm³")
    print(f"Top/bottom volume: {top_bottom_volume_mm3 / 1000.0} cm³")
    print(f"Shell volume (100% infill): {shell_volume_cm3} cm³")
    print(f"Inner volume: {inner_volume_cm3} cm³")
    print(f"Infill percentage: {infill * 100}%")
    print(f"Material volume: {shell_volume_cm3} + ({inner_volume_cm3} × {infill * 100}%) = {material_volume_cm3} cm³")
    
    # Calculate weights (no correction factor needed)
    shell_weight = shell_volume_cm3 * density
    infill_weight = inner_volume_cm3 * infill * density
    total_weight = shell_weight + infill_weight
    
    print(f"=== Weight Calculation ===")
    print(f"Shell weight: {shell_weight}g")
    print(f"Infill weight: {infill_weight}g")
    print(f"Total weight: {total_weight}g")
    print(f"=== End Debug ===")
    
    return {
        'material_volume_cm3': material_volume_cm3,
        'shell_volume_cm3': shell_volume_cm3,
        'inner_volume_cm3': inner_volume_cm3,
        'total_volume_cm3': total_volume_cm3,
        'shell_weight': shell_weight,
        'infill_weight': infill_weight,
        'total_weight': total_weight
    }

@app.route('/upload-stl', methods=['POST'])
def upload_stl():
    print("upload_stl endpoint called")
    try:
        if 'file' not in request.files:
            print("No file provided in request.files")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            print("No file selected (empty filename)")
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith('.stl'):
            print("File is not an STL file:", file.filename)
            return jsonify({'error': 'File must be an STL file'}), 400
        
        # Get units, infill, wall thickness, density, and correction factor from request (optional)
        units = request.form.get('units', 'mm')
        infill = float(request.form.get('infill', 20)) / 100  # Default 20%
        
        # Validate infill percentage (minimum 10%)
        if infill < 0.1:
            infill = 0.1
        elif infill > 1.0:
            infill = 1.0
            
        wall_thickness = float(request.form.get('wallThickness', 1.2))  # Realistic: 1.2mm (2 perimeters at 0.6mm each)
        layer_height = float(request.form.get('layerHeight', 0.2))  # Realistic: 0.2mm
        top_bottom_layers = int(request.form.get('topBottomLayers', 3))  # Realistic: 3 top + 3 bottom layers
        perimeters = int(request.form.get('perimeters', 2))  # Realistic: 2 perimeters
        density = float(request.form.get('density', 1.24))
        print(f"Using units: {units}, infill: {infill}, wall_thickness: {wall_thickness}, layer_height: {layer_height}, top_bottom_layers: {top_bottom_layers}, perimeters: {perimeters}, density: {density}")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.stl') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        print("Calling calculate_wall_and_infill_volume with:", temp_path)
        
        try:
            # Use wall+infill volume calculation
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
            calculation_method = f'Trimesh wall+infill (wall {wall_thickness}mm, infill {infill}, layer {layer_height}mm, top/bottom {top_bottom_layers}, perimeters {perimeters})'
            
            return jsonify({
                'success': True,
                'materialVolume': result['material_volume_cm3'],
                'totalVolume': result['total_volume_cm3'],
                'shellVolume': result['shell_volume_cm3'],
                'innerVolume': result['inner_volume_cm3'],
                'shellWeight': result['shell_weight'],
                'infillWeight': result['infill_weight'],
                'totalWeight': result['total_weight'],
                'filename': file.filename,
                'calculationMethod': calculation_method
            })
        except Exception as e:
            print("Error in wall+infill volume calculation:", str(e))
            # Fallback to estimation
            file_size = os.path.getsize(temp_path)
            estimated_volume = file_size / 1000
            return jsonify({
                'success': True,
                'materialVolume': estimated_volume,
                'totalVolume': estimated_volume,
                'shellVolume': 0,
                'innerVolume': 0,
                'shellWeight': 0,
                'infillWeight': 0,
                'totalWeight': 0,
                'filename': file.filename,
                'calculationMethod': f'Estimated (wall+infill failed)',
                'warning': 'Volume calculation failed, using estimation'
            })
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
            except:
                pass
    except Exception as e:
        print("Error in upload_stl:", str(e))
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/calculate', methods=['POST'])
def calculate_cost():
    try:
        print("=== /calculate endpoint called ===")
        data = request.get_json()
        print(f"Request data: {data}")
        # Add detailed logging for all key variables
        material = data.get('material')
        color = data.get('color')
        total_volume = float(data.get('totalVolume', 0))  # cm³
        infill = float(data.get('infill', 20)) / 100
        wall_thickness = float(data.get('wallThickness', 1.2))
        layer_height = float(data.get('layerHeight', 0.2))
        top_bottom_layers = int(data.get('topBottomLayers', 3))
        perimeters = int(data.get('perimeters', 2))
        print(f"material: {material}, color: {color}, total_volume: {total_volume}, infill: {infill}, wall_thickness: {wall_thickness}, layer_height: {layer_height}, top_bottom_layers: {top_bottom_layers}, perimeters: {perimeters}")
        if not material or total_volume <= 0:
            print("Missing material or invalid volume")
            return jsonify({'error': 'Missing material or invalid volume'}), 400

        # Get material data from database
        if db is None:
            print("Database not available")
            return jsonify({'error': 'Database not available'}), 500

        try:
            materials_ref = db.collection('materials')
            material_docs = materials_ref.where('name', '==', material).limit(1).stream()
            material_data = None
            for doc in material_docs:
                material_data = doc.to_dict()
                break
            if not material_data:
                print(f"Material '{material}' not found in database")
                return jsonify({'error': f'Material "{material}" not found in database'}), 404

            price_per_gram = float(material_data.get('price', 0.05))
            if color and 'colors' in material_data:
                for color_data in material_data['colors']:
                    if color_data.get('hex') == color:
                        price_per_gram = float(color_data.get('price', material_data.get('price', 0.05)))
                        print(f"Using color-specific price for {color}: {price_per_gram}")
                        break
            density = float(material_data.get('density', 1.24))
        except Exception as db_error:
            print(f"Database query error: {db_error}")
            return jsonify({'error': 'Database query failed'}), 500

        # Robust slicer-style calculation
        # Estimate surface area for shell calculation (approximate as cube root for non-cube shapes)
        # For best accuracy, this should come from STL, but we use total_volume as input for now
        # Assume a cube for surface area estimation: surface_area = 6 * (side^2), side = (volume)^(1/3)
        side = total_volume ** (1/3)
        surface_area = 6 * (side ** 2)
        
        # Much more realistic shell calculation - use much smaller values
        perimeter_thickness = 0.4  # 0.4mm per perimeter (typical nozzle width)
        wall_volume = surface_area * perimeter_thickness * perimeters
        top_bottom_volume = surface_area * layer_height * top_bottom_layers
        
        # Cap shell volume to a very small percentage of total volume (max 15%)
        shell_volume = wall_volume + top_bottom_volume
        max_shell_percentage = 0.15  # Maximum 15% of total volume for shell
        max_shell_volume = total_volume * max_shell_percentage
        shell_volume = min(shell_volume, max_shell_volume)
        
        inner_volume = max(0, total_volume - shell_volume)
        material_volume = shell_volume + (inner_volume * infill)
        weight_grams = material_volume * density
   
        cost = weight_grams * price_per_gram * 3.5

        print(f"=== Slicer-Style Calculation ===")
        print(f"Total volume: {total_volume} cm³")
        print(f"Surface area (approx): {surface_area} cm²")
        print(f"Perimeter thickness: {perimeter_thickness}mm")
        print(f"Wall volume: {wall_volume} cm³")
        print(f"Top/bottom volume: {top_bottom_volume} cm³")
        print(f"Raw shell volume: {wall_volume + top_bottom_volume} cm³")
        print(f"Max shell volume (15%): {max_shell_volume} cm³")
        print(f"Final shell volume: {shell_volume} cm³")
        print(f"Inner volume: {inner_volume} cm³")
        print(f"Infill percentage received: {infill * 100}%")
        print(f"Material volume calculation: {shell_volume} + ({inner_volume} × {infill * 100}%) = {material_volume} cm³")
        print(f"Weight: {weight_grams}g")
        print(f"Cost: ${cost}")
        
        # Simple test to verify infill impact
        test_20_percent = shell_volume + (inner_volume * 0.2)
        test_50_percent = shell_volume + (inner_volume * 0.5)
        test_80_percent = shell_volume + (inner_volume * 0.8)
        print(f"TEST - Material volume at 20% infill: {test_20_percent} cm³")
        print(f"TEST - Material volume at 50% infill: {test_50_percent} cm³")
        print(f"TEST - Material volume at 80% infill: {test_80_percent} cm³")
        print(f"TEST - Current infill material volume: {material_volume} cm³")
        print(f"=== End Calculation Debug ===")

        return jsonify({
            'cost': round(cost, 2),
            'breakdown': {
                'totalVolume': round(total_volume, 2),
                'materialVolume': round(material_volume, 2),
                'weight': round(weight_grams, 2),
                'density': density,
                'pricePerGram': round(price_per_gram, 4),
                'infill': infill,
                'wallVolume': round(wall_volume, 2),
                'topBottomVolume': round(top_bottom_volume, 2),
                'shellVolume': round(shell_volume, 2),
                'innerVolume': round(inner_volume, 2),
                'calculationMethod': 'Robust slicer-style backend calculation'
            }
        })
    except Exception as e:
        print(f"Error calculating cost: {str(e)}")
        import traceback
        traceback.print_exc()
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
    config = {
        "apiKey": os.environ.get('FIREBASE_API_KEY'),
        "authDomain": os.environ.get('FIREBASE_AUTH_DOMAIN'),
        "projectId": os.environ.get('FIREBASE_PROJECT_ID'),
        "storageBucket": os.environ.get('FIREBASE_STORAGE_BUCKET'),
        "messagingSenderId": os.environ.get('FIREBASE_MESSAGING_SENDER_ID'),
        "appId": os.environ.get('FIREBASE_APP_ID'),
        "measurementId": os.environ.get('FIREBASE_MEASUREMENT_ID')
    }
    return jsonify(config)

@app.route('/api/sheets-data')
def get_sheets_data():
    """Fetch Google Sheets data securely from backend"""
    sheet_id = "1H6XhzxP4rr6gXOBdhGBhIory9gBKWudl2FD7p8cdgrU"
    api_key = os.environ.get('GOOGLE_SHEETS_API_KEY')
    
    if not api_key:
        return jsonify({'error': 'Google Sheets API key not configured'}), 500
    
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)