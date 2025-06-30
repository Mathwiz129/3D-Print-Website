#!/usr/bin/env python3
"""
Test the corrected shell volume calculation
"""

import trimesh

def test_shell_calculation():
    # Load the 100mm cube
    mesh = trimesh.load('100mm cubed.stl')
    
    print("=== Testing Corrected Shell Calculation ===")
    print(f"Total volume: {mesh.volume/1000:.1f} cm³")
    print(f"Extents: {mesh.extents}")
    
    # Parameters
    cube_side_length = max(mesh.extents)  # 100mm
    perimeters = 2
    layer_height_mm = 0.2
    top_bottom_layers = 3
    infill = 0.2  # 20%
    
    print(f"\n=== Parameters ===")
    print(f"Cube side length: {cube_side_length}mm")
    print(f"Perimeters: {perimeters}")
    print(f"Layer height: {layer_height_mm}mm")
    print(f"Top/bottom layers: {top_bottom_layers}")
    print(f"Infill: {infill*100}%")
    
    # Calculate wall volume
    perimeter_length = 4 * cube_side_length  # 400mm
    wall_height = cube_side_length  # 100mm
    wall_thickness_mm = 0.6  # Each perimeter is 0.6mm wide
    
    wall_volume_mm3 = perimeter_length * wall_height * wall_thickness_mm * perimeters
    wall_volume_cm3 = wall_volume_mm3 / 1000.0
    
    print(f"\n=== Wall Calculation ===")
    print(f"Perimeter length: {perimeter_length}mm")
    print(f"Wall height: {wall_height}mm")
    print(f"Wall thickness per perimeter: {wall_thickness_mm}mm")
    print(f"Wall volume: {wall_volume_cm3:.1f} cm³")
    
    # Calculate top/bottom volume
    top_bottom_area_mm2 = cube_side_length * cube_side_length  # 10,000 mm²
    top_bottom_volume_mm3 = top_bottom_area_mm2 * layer_height_mm * top_bottom_layers * 2
    top_bottom_volume_cm3 = top_bottom_volume_mm3 / 1000.0
    
    print(f"\n=== Top/Bottom Calculation ===")
    print(f"Top/bottom area: {top_bottom_area_mm2} mm²")
    print(f"Top/bottom volume: {top_bottom_volume_cm3:.1f} cm³")
    
    # Total shell volume
    shell_volume_cm3 = wall_volume_cm3 + top_bottom_volume_cm3
    total_volume_cm3 = 1000.0  # Known from mesh
    
    print(f"\n=== Shell Volume ===")
    print(f"Wall volume: {wall_volume_cm3:.1f} cm³")
    print(f"Top/bottom volume: {top_bottom_volume_cm3:.1f} cm³")
    print(f"Total shell volume: {shell_volume_cm3:.1f} cm³")
    
    # Inner volume and material volume
    inner_volume_cm3 = max(0, total_volume_cm3 - shell_volume_cm3)
    material_volume_cm3 = shell_volume_cm3 + (inner_volume_cm3 * infill)
    
    print(f"\n=== Final Calculation ===")
    print(f"Total volume: {total_volume_cm3:.1f} cm³")
    print(f"Shell volume: {shell_volume_cm3:.1f} cm³")
    print(f"Inner volume: {inner_volume_cm3:.1f} cm³")
    print(f"Material volume: {material_volume_cm3:.1f} cm³")
    
    # Weight calculation
    density = 1.24  # PLA density
    weight_grams = material_volume_cm3 * density
    
    print(f"\n=== Weight Calculation ===")
    print(f"Material volume: {material_volume_cm3:.1f} cm³")
    print(f"Density: {density} g/cm³")
    print(f"Weight: {weight_grams:.1f}g")
    
    return material_volume_cm3

if __name__ == "__main__":
    result = test_shell_calculation()
    print(f"\n=== Summary ===")
    print(f"Material volume: {result:.1f} cm³")
    print(f"Expected for 1000 cm³ cube with 20% infill: ~300-400 cm³") 