#!/usr/bin/env python3
"""
Test script for STL Weight Estimator API integration
"""

import requests
import os

def test_stl_api():
    """Test the STL Weight Estimator API with the sample STL file"""
    
    # API endpoint
    url = "https://stl-api-66l8.onrender.com/estimate-weight"
    
    # Check if test STL file exists
    stl_file_path = "100mm cubed.stl"
    if not os.path.exists(stl_file_path):
        print(f"Error: Test STL file '{stl_file_path}' not found")
        return False
    
    # Test parameters
    test_params = {
        'infill_percentage': 20,
        'material_density': 1.24,  # PLA density
        'line_thickness': 0.2,
        'layer_height': 0.2,
        'shell_count': 2
    }
    
    print("Testing STL Weight Estimator API...")
    print(f"URL: {url}")
    print(f"STL File: {stl_file_path}")
    print(f"Parameters: {test_params}")
    print("-" * 50)
    
    try:
        # Prepare the request
        with open(stl_file_path, 'rb') as f:
            files = {'file': f}
            data = test_params
            
            print("Sending request...")
            response = requests.post(url, files=files, data=data)
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API Response Success!")
                print(f"Weight: {result.get('weight_grams', 'N/A')} grams")
                print(f"Total Volume: {result.get('total_volume_cm3', 'N/A')} cm³")
                print(f"Solid Volume: {result.get('solid_volume_cm3', 'N/A')} cm³")
                print(f"Infill Volume: {result.get('infill_volume_cm3', 'N/A')} cm³")
                print(f"Shell Volume: {result.get('shell_volume_cm3', 'N/A')} cm³")
                return True
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Error Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def test_material_densities():
    """Test different material densities"""
    
    print("\n" + "=" * 50)
    print("Testing different material densities...")
    print("=" * 50)
    
    materials = {
        'PLA': 1.24,
        'ABS': 1.04,
        'PETG': 1.27,
        'TPU': 1.20,
        'Nylon': 1.13
    }
    
    stl_file_path = "100mm cubed.stl"
    if not os.path.exists(stl_file_path):
        print(f"Error: Test STL file '{stl_file_path}' not found")
        return
    
    url = "https://stl-api-66l8.onrender.com/estimate-weight"
    
    for material_name, density in materials.items():
        print(f"\nTesting {material_name} (density: {density} g/cm³)...")
        
        try:
            with open(stl_file_path, 'rb') as f:
                files = {'file': f}
                data = {
                    'infill_percentage': 20,
                    'material_density': density,
                    'line_thickness': 0.2,
                    'layer_height': 0.2,
                    'shell_count': 2
                }
                
                response = requests.post(url, files=files, data=data)
                
                if response.status_code == 200:
                    result = response.json()
                    weight = result.get('weight_grams', 0)
                    print(f"  ✅ {material_name}: {weight:.2f} grams")
                else:
                    print(f"  ❌ {material_name}: API Error {response.status_code}")
                    
        except Exception as e:
            print(f"  ❌ {material_name}: Error - {e}")

if __name__ == "__main__":
    print("STL Weight Estimator API Integration Test")
    print("=" * 50)
    
    # Test basic API functionality
    success = test_stl_api()
    
    if success:
        # Test different material densities
        test_material_densities()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        print("The API integration should work correctly in the web application.")
    else:
        print("\n" + "=" * 50)
        print("❌ API test failed. Please check the API endpoint and try again.") 