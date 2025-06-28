#!/usr/bin/env python3
"""
Test script to show how infill percentage affects material usage
"""

def test_infill_impact():
    """Test how different infill percentages affect material usage"""
    print("=== Testing Infill Impact on 100mm Cube ===")
    
    # Fixed parameters
    total_volume_cm3 = 1000
    shell_volume_cm3 = 96  # Always 100% infill
    inner_volume_cm3 = 904  # Gets infill percentage
    
    print(f"Total volume: {total_volume_cm3} cm³")
    print(f"Shell volume (always 100% infill): {shell_volume_cm3} cm³")
    print(f"Inner volume (gets infill %): {inner_volume_cm3} cm³")
    print()
    
    # Test different infill percentages
    infill_percentages = [10, 15, 20, 25, 30, 50, 75, 100]
    
    print("Infill % | Inner Material | Total Material | Weight (g) | Cost ($)")
    print("---------|----------------|----------------|------------|----------")
    
    for infill_pct in infill_percentages:
        infill_decimal = infill_pct / 100
        inner_material = inner_volume_cm3 * infill_decimal
        total_material = shell_volume_cm3 + inner_material
        weight = total_material * 1.24  # PLA density
        cost = weight * 0.03  # $0.03/g
        
        print(f"{infill_pct:7}% | {inner_material:13.1f} | {total_material:13.1f} | {weight:9.1f} | {cost:8.2f}")
    
    print()
    print("Note: Shell is always 100% infill, so material usage doesn't change linearly with infill %")
    print("The shell represents about 35% of total material usage for this cube.")

if __name__ == "__main__":
    test_infill_impact() 