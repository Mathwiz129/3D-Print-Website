#!/usr/bin/env python3
"""
Test script for STL volume calculation
"""

import struct
import tempfile
import os

def create_test_stl():
    """Create a simple test STL file (a cube)"""
    # Create a simple cube STL file
    vertices = [
        # Front face
        (0, 0, 0), (1, 0, 0), (1, 1, 0),  # Triangle 1
        (0, 0, 0), (1, 1, 0), (0, 1, 0),  # Triangle 2
        # Back face
        (0, 0, 1), (1, 1, 1), (1, 0, 1),  # Triangle 3
        (0, 0, 1), (0, 1, 1), (1, 1, 1),  # Triangle 4
        # Left face
        (0, 0, 0), (0, 1, 0), (0, 1, 1),  # Triangle 5
        (0, 0, 0), (0, 1, 1), (0, 0, 1),  # Triangle 6
        # Right face
        (1, 0, 0), (1, 0, 1), (1, 1, 1),  # Triangle 7
        (1, 0, 0), (1, 1, 1), (1, 1, 0),  # Triangle 8
        # Top face
        (0, 1, 0), (1, 1, 0), (1, 1, 1),  # Triangle 9
        (0, 1, 0), (1, 1, 1), (0, 1, 1),  # Triangle 10
        # Bottom face
        (0, 0, 0), (0, 0, 1), (1, 0, 1),  # Triangle 11
        (0, 0, 0), (1, 0, 1), (1, 0, 0),  # Triangle 12
    ]
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.stl', delete=False) as f:
        # Write header (80 bytes)
        f.write(b'Test Cube STL File' + b'\x00' * 63)
        
        # Write triangle count (4 bytes)
        f.write(struct.pack('<I', len(vertices) // 3))
        
        # Write triangles
        for i in range(0, len(vertices), 3):
            v1, v2, v3 = vertices[i], vertices[i+1], vertices[i+2]
            
            # Calculate normal (simplified - just use (0,0,1) for all)
            normal = (0.0, 0.0, 1.0)
            
            # Write normal
            f.write(struct.pack('<3f', *normal))
            
            # Write vertices
            f.write(struct.pack('<3f', *v1))
            f.write(struct.pack('<3f', *v2))
            f.write(struct.pack('<3f', *v3))
            
            # Write padding (2 bytes)
            f.write(b'\x00\x00')
    
    return f.name

def calculate_volume_from_stl(stl_file_path):
    """Calculate volume by parsing STL file directly"""
    try:
        with open(stl_file_path, 'rb') as f:
            # Read header (80 bytes)
            header = f.read(80)
            
            # Read triangle count (4 bytes)
            triangle_count_bytes = f.read(4)
            triangle_count = struct.unpack('<I', triangle_count_bytes)[0]
            
            print(f"STL file has {triangle_count} triangles")
            
            # Read all triangles
            triangles = []
            for i in range(triangle_count):
                # Each triangle is 50 bytes: 3 vertices (12 bytes each) + normal (12 bytes) + 2 bytes padding
                triangle_data = f.read(50)
                if len(triangle_data) < 50:
                    print(f"Warning: Incomplete triangle data at triangle {i}")
                    break
                
                # Extract vertices (skip normal and padding)
                v1 = struct.unpack('<3f', triangle_data[0:12])
                v2 = struct.unpack('<3f', triangle_data[12:24])
                v3 = struct.unpack('<3f', triangle_data[24:36])
                triangles.append((v1, v2, v3))
            
            print(f"Successfully read {len(triangles)} triangles")
        
        # Calculate volume using signed tetrahedron volume
        total_volume = 0.0
        for v1, v2, v3 in triangles:
            # Calculate signed volume of tetrahedron
            # Volume = (1/6) * dot(cross(v2-v1, v3-v1), v1)
            v2_minus_v1 = (v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2])
            v3_minus_v1 = (v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2])
            
            # Cross product: v2_minus_v1 × v3_minus_v1
            cross_x = v2_minus_v1[1] * v3_minus_v1[2] - v2_minus_v1[2] * v3_minus_v1[1]
            cross_y = v2_minus_v1[2] * v3_minus_v1[0] - v2_minus_v1[0] * v3_minus_v1[2]
            cross_z = v2_minus_v1[0] * v3_minus_v1[1] - v2_minus_v1[1] * v3_minus_v1[0]
            
            # Dot product with v1
            dot_product = cross_x * v1[0] + cross_y * v1[1] + cross_z * v1[2]
            
            # Add to total volume
            total_volume += dot_product / 6.0
        
        # Convert from mm³ to cm³ and take absolute value
        volume_cm3 = abs(total_volume) / 1000.0
        return volume_cm3
        
    except Exception as e:
        print(f"Error calculating volume from STL: {e}")
        return None

if __name__ == "__main__":
    print("Creating test STL file...")
    test_file = create_test_stl()
    
    print(f"Test file created: {test_file}")
    
    print("Calculating volume...")
    volume = calculate_volume_from_stl(test_file)
    
    if volume is not None:
        print(f"Calculated volume: {volume:.2f} cm³")
        print(f"Expected volume for 1x1x1 cube: 1.00 cm³")
        print(f"Accuracy: {abs(volume - 1.0) / 1.0 * 100:.1f}%")
    else:
        print("Volume calculation failed!")
    
    # Clean up
    os.unlink(test_file)
    print("Test completed.") 