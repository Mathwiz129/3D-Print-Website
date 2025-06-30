#!/usr/bin/env python3
"""
Debug script to test STL volume calculation
"""

import trimesh
import numpy as np
import sys

def analyze_stl_file(stl_path):
    """Analyze an STL file and show detailed volume information"""
    print(f"=== Analyzing STL file: {stl_path} ===")
    
    try:
        # Load the mesh
        mesh = trimesh.load(stl_path)
        print(f"Mesh loaded successfully")
        
        # Basic mesh info
        print(f"Number of vertices: {len(mesh.vertices)}")
        print(f"Number of faces: {len(mesh.faces)}")
        print(f"Is watertight: {mesh.is_watertight}")
        print(f"Is convex: {mesh.is_convex}")
        
        # Bounding box and extents
        print(f"\n=== Bounding Box ===")
        print(f"Bounds: {mesh.bounds}")
        print(f"Extents: {mesh.extents}")
        print(f"Center: {mesh.center_mass}")
        
        # Calculate expected volume based on extents
        extents = mesh.extents
        expected_volume_mm3 = extents[0] * extents[1] * extents[2]
        expected_volume_cm3 = expected_volume_mm3 / 1000.0
        
        print(f"\n=== Volume Analysis ===")
        print(f"Expected volume from bounding box (mm³): {expected_volume_mm3}")
        print(f"Expected volume from bounding box (cm³): {expected_volume_cm3}")
        print(f"Actual mesh volume (mm³): {mesh.volume}")
        print(f"Actual mesh volume (cm³): {mesh.volume / 1000.0}")
        print(f"Surface area (mm²): {mesh.area}")
        print(f"Surface area (cm²): {mesh.area / 100.0}")
        
        # Unit analysis
        print(f"\n=== Unit Analysis ===")
        max_extent = max(extents)
        print(f"Largest dimension: {max_extent} units")
        
        if max_extent > 50 and max_extent < 150:
            print("Units appear to be MILLIMETERS (mm)")
            print(f"Expected 100mm cube, got {max_extent}mm")
            print(f"Scale factor: {max_extent / 100.0}")
        elif max_extent > 5 and max_extent < 15:
            print("Units appear to be CENTIMETERS (cm)")
            print(f"Expected 10cm cube, got {max_extent}cm")
            print(f"Scale factor: {max_extent / 10.0}")
        elif max_extent > 1 and max_extent < 5:
            print("Units appear to be INCHES (in)")
            print(f"Expected ~4in cube, got {max_extent}in")
            print(f"Scale factor: {max_extent / 4.0}")
        else:
            print(f"Units unclear - largest dimension is {max_extent}")
        
        # Volume consistency check
        print(f"\n=== Volume Consistency ===")
        if abs(mesh.volume - expected_volume_mm3) < 0.01 * expected_volume_mm3:
            print("✓ Volume calculation is consistent with bounding box")
        else:
            print("✗ Volume calculation differs from bounding box")
            print(f"  Difference: {abs(mesh.volume - expected_volume_mm3)} mm³")
            print(f"  Percentage: {abs(mesh.volume - expected_volume_mm3) / expected_volume_mm3 * 100:.2f}%")
        
        # If it's a cube, check if it's actually cubic
        if len(set(extents)) == 1:
            print("✓ Shape appears to be a perfect cube")
        else:
            print("✗ Shape is not a perfect cube")
            print(f"  Dimensions: {extents[0]} × {extents[1]} × {extents[2]}")
        
        return {
            'volume_mm3': mesh.volume,
            'volume_cm3': mesh.volume / 1000.0,
            'extents': extents,
            'is_watertight': mesh.is_watertight,
            'surface_area_mm2': mesh.area
        }
        
    except Exception as e:
        print(f"Error analyzing STL file: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_test_cube():
    """Create a perfect 100mm cube for testing"""
    print("\n=== Creating Test 100mm Cube ===")
    
    # Create vertices for a 100mm cube
    vertices = np.array([
        [0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0],  # bottom face
        [0, 0, 100], [100, 0, 100], [100, 100, 100], [0, 100, 100]  # top face
    ])
    
    # Create faces (triangles)
    faces = np.array([
        [0, 1, 2], [0, 2, 3],  # bottom
        [4, 7, 6], [4, 6, 5],  # top
        [0, 4, 5], [0, 5, 1],  # front
        [1, 5, 6], [1, 6, 2],  # right
        [2, 6, 7], [2, 7, 3],  # back
        [3, 7, 4], [3, 4, 0]   # left
    ])
    
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    
    print(f"Test cube created:")
    print(f"  Extents: {mesh.extents}")
    print(f"  Volume: {mesh.volume} mm³ = {mesh.volume / 1000.0} cm³")
    print(f"  Expected: 1,000,000 mm³ = 1000 cm³")
    print(f"  Is watertight: {mesh.is_watertight}")
    
    return mesh

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Analyze provided STL file
        stl_path = sys.argv[1]
        result = analyze_stl_file(stl_path)
        if result:
            print(f"\n=== Summary ===")
            print(f"Volume: {result['volume_cm3']:.1f} cm³")
            print(f"Expected for 10cm cube: 1000 cm³")
            print(f"Ratio: {result['volume_cm3'] / 1000.0:.3f}")
    else:
        # Create and analyze test cube
        test_mesh = create_test_cube()
        print("\n=== Test Complete ===") 