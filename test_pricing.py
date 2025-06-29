#!/usr/bin/env python3
"""
Test script to verify pricing calculation with different multipliers
"""

import os
import sys

# Mock the calculation logic from app.py
def calculate_cost(material_volume, price_per_gram, multiplier):
    """Calculate cost using the same logic as the backend"""
    weight_grams = material_volume * 1.24  # Default density
    cost = weight_grams * price_per_gram * multiplier
    return cost, weight_grams

def test_pricing():
    """Test pricing with different multipliers"""
    print("=== Pricing Calculation Test ===")
    
    # Test parameters (example values)
    material_volume = 10.0  # cm³
    price_per_gram = 0.05   # $0.05 per gram
    
    print(f"Test parameters:")
    print(f"  Material volume: {material_volume} cm³")
    print(f"  Price per gram: ${price_per_gram}")
    print(f"  Density: 1.24 g/cm³")
    print()
    
    # Test with different multipliers
    multipliers = [1.0, 3.5]
    
    for multiplier in multipliers:
        cost, weight = calculate_cost(material_volume, price_per_gram, multiplier)
        print(f"Multiplier {multiplier}:")
        print(f"  Weight: {weight:.2f}g")
        print(f"  Cost: ${cost:.2f}")
        print()
    
    print("=== End Test ===")

if __name__ == "__main__":
    test_pricing() 