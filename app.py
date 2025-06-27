from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import firebase_admin
from firebase_admin import credentials, firestore
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import subprocess
import tempfile
import werkzeug

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests from your frontend

# Initialize Firebase Admin SDK (if not already done)
if not firebase_admin._apps:
    try:
        # Try to use environment variable (for Render deployment)
        firebase_creds = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        print("GOOGLE_APPLICATION_CREDENTIALS:", firebase_creds)
        print("File exists:", os.path.exists(firebase_creds))
        if firebase_creds and os.path.exists(firebase_creds):
            with open(firebase_creds) as f:
                print("First 100 chars of file:", f.read(100))
            cred = credentials.Certificate(firebase_creds)
        else:
            # Fall back to file (for local development)
            cred = credentials.Certificate("outprint-3d-printing-firebase-adminsdk-fbsvc-bee53169f9.json")
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Firebase initialization error: {e}")
        # Continue without Firebase for now
        db = None
    else:
        db = firestore.client()
else:
    db = firestore.client()

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

def calculate_volume_with_meshlab(stl_file_path):
    """Calculate volume using MeshLab command line"""
    try:
        # Create a temporary MeshLab script
        script_content = """
        <!DOCTYPE FilterScript>
        <FilterScript>
         <filter name="Compute Geometric Measures">
          <Param type="RichBool" value="true" name="Volume"/>
          <Param type="RichBool" value="false" name="Surface"/>
          <Param type="RichBool" value="false" name="Shape"/>
          <Param type="RichBool" value="false" name="Topology"/>
         </filter>
        </FilterScript>
        """
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.mlx', delete=False) as script_file:
            script_file.write(script_content)
            script_path = script_file.name
        
        # Run MeshLab command
        cmd = [
            'xvfb-run', '-a', 'meshlabserver',  # Run headless with virtual framebuffer
            '-i', stl_file_path,  # Input STL file
            '-s', script_path,    # Script file
            '-o', '/dev/null'     # Output (we don't need it)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        print("MeshLab stdout:", result.stdout)
        print("MeshLab stderr:", result.stderr)
        
        # Parse output for volume
        output_lines = result.stdout.split('\n')
        volume = None
        for line in output_lines:
            if 'Volume:' in line:
                # Extract volume value (usually in mm³)
                try:
                    volume_str = line.split('Volume:')[1].strip()
                    volume = float(volume_str.split()[0])  # Get first number
                    break
                except:
                    continue
        
        # Clean up temporary file
        os.unlink(script_path)
        
        if volume is not None:
            # Convert from mm³ to cm³
            return volume / 1000
        else:
            raise Exception("Could not parse volume from MeshLab output")
            
    except subprocess.TimeoutExpired:
        raise Exception("MeshLab calculation timed out")
    except FileNotFoundError:
        raise Exception("MeshLab not found. Please install MeshLab: https://www.meshlab.net/")
    except Exception as e:
        raise Exception(f"MeshLab calculation failed: {str(e)}")

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
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.stl') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        print("Calling calculate_volume_with_meshlab with:", temp_path)
        
        try:
            # Calculate volume using MeshLab
            volume = calculate_volume_with_meshlab(temp_path)
            
            return jsonify({
                'success': True,
                'volume': volume,
                'filename': file.filename,
                'calculationMethod': 'MeshLab'
            })
            
        except Exception as e:
            print("Error in calculate_volume_with_meshlab:", str(e))
            # Fallback to estimation if MeshLab fails
            print(f"MeshLab calculation failed: {e}")
            # For now, return an estimated volume based on file size
            # This is a rough estimation - in practice, you'd want a better fallback
            file_size = os.path.getsize(temp_path)
            estimated_volume = file_size / 1000  # Rough estimation
            return jsonify({
                'success': True,
                'volume': estimated_volume,
                'filename': file.filename,
                'calculationMethod': 'Estimated (MeshLab unavailable)',
                'warning': 'MeshLab calculation failed, using estimation'
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
        data = request.get_json()
        material = data.get('material')
        volume = float(data.get('volume', 0))
        infill = float(data.get('infill', 20)) / 100  # Default to 20%
        wall_thickness = float(data.get('wallThickness', 1.2))  # mm, default 1.2mm
        layer_height = float(data.get('layerHeight', 0.2))  # mm, default 0.2mm
        support_percentage = float(data.get('supportPercentage', 0)) / 100  # Default 0%
        stl_file_path = data.get('stlFilePath')  # Path to STL file if available
        
        if not material or not volume:
            return jsonify({'error': 'Missing material or volume'}), 400

        # Get material data from Firestore
        if db is None:
            return jsonify({'error': 'Database not available'}), 500
            
        materials_ref = db.collection('materials')
        material_docs = materials_ref.where('name', '==', material).limit(1).stream()
        
        material_data = None
        for doc in material_docs:
            material_data = doc.to_dict()
            break
        
        if not material_data:
            return jsonify({'error': f'Material "{material}" not found'}), 400

        # Use admin-managed price and density
        price_per_gram = material_data.get('price', 0)
        density = material_data.get('density', 1.24)  # g/cm³, fallback to default
        
        # Try to use MeshLab for accurate volume calculation if STL file is available
        if stl_file_path and os.path.exists(stl_file_path):
            try:
                actual_volume = calculate_volume_with_meshlab(stl_file_path)
                volume = actual_volume  # Use the more accurate volume
            except Exception as e:
                print(f"MeshLab calculation failed, using provided volume: {e}")
                # Fall back to provided volume
        
        # Improved calculation using actual volume
        # Convert volume from cm³ to mm³
        volume_mm3 = volume * 1000
        
        # Calculate surface area more accurately
        # For complex shapes, estimate surface area from volume
        # Surface area ≈ 6 * (volume^(2/3)) for most shapes
        surface_area_mm2 = 6 * (volume_mm3 ** (2/3))
        
        # Wall volume (perimeters) - 2 perimeters
        perimeters = 2
        wall_volume_mm3 = surface_area_mm2 * wall_thickness * perimeters
        
        # Top/bottom layers - 3 layers
        top_bottom_layers = 3
        top_bottom_volume_mm3 = surface_area_mm2 * layer_height * top_bottom_layers
        
        # Infill volume (remaining volume after walls and top/bottom)
        remaining_volume = max(0, volume_mm3 - wall_volume_mm3 - top_bottom_volume_mm3)
        infill_volume_mm3 = remaining_volume * infill
        
        # Support volume
        support_volume_mm3 = volume_mm3 * support_percentage
        
        # Total material volume
        total_volume_mm3 = wall_volume_mm3 + top_bottom_volume_mm3 + infill_volume_mm3 + support_volume_mm3
        
        # Convert back to cm³ and calculate weight
        total_volume_cm3 = total_volume_mm3 / 1000
        grams = total_volume_cm3 * density
        
        # Calculate cost
        cost = grams * price_per_gram
        
        # Return detailed breakdown
        return jsonify({
            'cost': round(cost, 2),
            'breakdown': {
                'totalVolume': round(total_volume_cm3, 2),
                'wallVolume': round(wall_volume_mm3 / 1000, 2),
                'topBottomVolume': round(top_bottom_volume_mm3 / 1000, 2),
                'infillVolume': round(infill_volume_mm3 / 1000, 2),
                'supportVolume': round(support_volume_mm3 / 1000, 2),
                'grams': round(grams, 2),
                'density': density,
                'pricePerGram': price_per_gram,
                'originalVolume': round(volume, 2),
                'calculationMethod': 'MeshLab' if stl_file_path and os.path.exists(stl_file_path) else 'Estimated'
            }
        })
        
    except Exception as e:
        print(f"Error calculating cost: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)