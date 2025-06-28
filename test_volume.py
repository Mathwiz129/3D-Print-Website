#!/usr/bin/env python3
"""
Test script to verify volume calculation for a 100mm cube
"""

import trimesh
import numpy as np

def create_test_cube():
    """Create a 100mm cube for testing"""
    # Create a 100mm cube
    vertices = np.array([
        [0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0],  # bottom face
        [0, 0, 100], [100, 0, 100], [100, 100, 100], [0, 100, 100]  # top face
    ])
    
    faces = np.array([
        [0, 1, 2], [0, 2, 3],  # bottom
        [4, 7, 6], [4, 6, 5],  # top
        [0, 4, 5], [0, 5, 1],  # front
        [1, 5, 6], [1, 6, 2],  # right
        [2, 6, 7], [2, 7, 3],  # back
        [3, 7, 4], [3, 4, 0]   # left
    ])
    
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    return mesh

def test_volume_calculation():
    """Test the volume calculation"""
    print("=== Testing Volume Calculation ===")
    
    # Create test cube
    mesh = create_test_cube()
    
    print(f"Mesh bounds: {mesh.bounds}")
    print(f"Mesh extents: {mesh.extents}")
    print(f"Expected cube size: 100mm")
    print(f"Actual cube size: {max(mesh.extents)}mm")
    
    # Calculate volume
    total_volume_mm3 = abs(mesh.volume)
    surface_area_mm2 = mesh.area
    
    print(f"\n=== Volume Results ===")
    print(f"Raw mesh volume: {mesh.volume}")
    print(f"Total volume (mm³): {total_volume_mm3}")
    print(f"Total volume (cm³): {total_volume_mm3 / 1000.0}")
    print(f"Expected volume: 1,000,000 mm³ = 1000 cm³")
    print(f"Surface area (mm²): {surface_area_mm2}")
    print(f"Expected surface area: 60,000 mm²")
    
    # Test the wall and infill calculation
    print(f"\n=== Testing Wall and Infill Calculation ===")
    
    # Parameters
    infill = 0.2  # 20%
    wall_thickness_mm = 2.0
    layer_height_mm = 0.2
    top_bottom_layers = 4
    perimeters = 2
    density = 1.24
    
    # Calculate shell volume
    perimeter_thickness = 0.4  # Typical nozzle width
    wall_volume_mm3 = surface_area_mm2 * perimeter_thickness * perimeters
    top_bottom_volume_mm3 = surface_area_mm2 * layer_height_mm * top_bottom_layers
    shell_volume_mm3 = wall_volume_mm3 + top_bottom_volume_mm3
    shell_volume_mm3 = min(shell_volume_mm3, total_volume_mm3)
    
    # Inner volume
    inner_volume_mm3 = max(0, total_volume_mm3 - shell_volume_mm3)
    
    # Material volume
    material_volume_mm3 = shell_volume_mm3 + (inner_volume_mm3 * infill)
    
    # Convert to cm³
    shell_volume_cm3 = shell_volume_mm3 / 1000.0
    inner_volume_cm3 = inner_volume_mm3 / 1000.0
    total_volume_cm3 = total_volume_mm3 / 1000.0
    material_volume_cm3 = material_volume_mm3 / 1000.0
    
    print(f"Wall volume: {wall_volume_mm3 / 1000.0} cm³")
    print(f"Top/bottom volume: {top_bottom_volume_mm3 / 1000.0} cm³")
    print(f"Shell volume: {shell_volume_cm3} cm³")
    print(f"Inner volume: {inner_volume_cm3} cm³")
    print(f"Material volume: {material_volume_cm3} cm³")
    
    # Calculate weights
    shell_weight = shell_volume_cm3 * density
    infill_weight = inner_volume_cm3 * infill * density
    total_weight = shell_weight + infill_weight
    
    print(f"\n=== Weight Calculation ===")
    print(f"Shell weight: {shell_weight}g")
    print(f"Infill weight: {infill_weight}g")
    print(f"Total weight: {total_weight}g")
    
    print(f"\n=== Expected Results for 100mm cube ===")
    print(f"Total volume: 1000 cm³")
    print(f"Material volume: ~276.8 cm³")
    print(f"Total weight: ~343.2g")
    
    return {
        'total_volume_cm3': total_volume_cm3,
        'material_volume_cm3': material_volume_cm3,
        'total_weight': total_weight
    }

if __name__ == "__main__":
    result = test_volume_calculation()
    print(f"\n=== Test Complete ===")
    print(f"Total volume: {result['total_volume_cm3']} cm³")
    print(f"Material volume: {result['material_volume_cm3']} cm³")
    print(f"Total weight: {result['total_weight']}g") 